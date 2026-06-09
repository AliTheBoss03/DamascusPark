import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser, hasRole } from "@/lib/auth";
import { MOCK_FINES } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const plate = searchParams.get("plate");

  if (!isSupabaseConfigured) {
    let fines = MOCK_FINES;
    if (plate) {
      const norm = plate.replace(/\s/g, "").toLowerCase();
      fines = fines.filter(
        (f) => f.plate_number.replace(/\s/g, "").toLowerCase() === norm
      );
    }
    return NextResponse.json({ fines });
  }

  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RLS scopes the result set: wardens/admins see all, drivers see fines tied
  // to their own sessions/plates. No manual warden_id filter needed.
  const supabase = createClient();
  let query = supabase
    .from("fines")
    .select("*, zone:parking_zones(*), warden:profiles!warden_id(*)")
    .order("issued_at", { ascending: false });

  if (plate) query = query.eq("plate_number", plate);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ fines: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { plate_number, zone_id, amount_credits, notes } = body;

  if (!plate_number || !zone_id || !amount_credits) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({
      fine: {
        id: `mock-fine-${Date.now()}`,
        plate_number,
        zone_id,
        amount_credits,
        notes,
        status: "unpaid",
        issued_at: new Date().toISOString(),
      },
    });
  }

  // ── Authorization: wardens (and admins) only ──────────────────────────────
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(user, "warden", "admin")) {
    return NextResponse.json({ error: "Forbidden — wardens only" }, { status: 403 });
  }

  // warden_id is the SESSION identity, never the request body. RLS
  // fines_insert_warden double-checks warden_id = auth.uid().
  const supabase = createClient();
  const { data, error } = await supabase
    .from("fines")
    .insert({ plate_number, warden_id: user.id, zone_id, amount_credits, notes })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ fine: data }, { status: 201 });
}
