import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser, hasRole } from "@/lib/auth";
import { MOCK_SETTINGS } from "@/lib/mock-data";

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ settings: MOCK_SETTINGS });
  }
  // system_settings is public-read under RLS.
  const supabase = createClient();
  const { data, error } = await supabase.from("system_settings").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { key, value } = body;

  if (!key || value === undefined) {
    return NextResponse.json(
      { error: "key and value are required" },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured) {
    const setting = MOCK_SETTINGS.find((s) => s.key === key);
    if (setting) {
      setting.value = String(value);
      setting.updated_at = new Date().toISOString();
    }
    return NextResponse.json({ key, value: String(value) });
  }

  // ── Authorization: admins only ────────────────────────────────────────────
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(user, "admin")) {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  // Guard the pricing index against fat-finger / malicious values. Gas price
  // drives every zone's rate, so clamp it to a sane band.
  if (key === "gas_price_per_liter_syp") {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 100 || n > 1_000_000) {
      return NextResponse.json(
        { error: "gas_price_per_liter_syp out of allowed range (100–1,000,000)" },
        { status: 422 }
      );
    }
  }

  // RLS settings_admin_write enforces the same constraint at the data layer.
  const supabase = createClient();
  const { data, error } = await supabase
    .from("system_settings")
    .upsert({ key, value: String(value), updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
