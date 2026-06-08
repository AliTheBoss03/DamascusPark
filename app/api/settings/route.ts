import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { MOCK_SETTINGS } from "@/lib/mock-data";

export async function GET() {
  const db = createAdminClient();
  if (!db) {
    return NextResponse.json({ settings: MOCK_SETTINGS });
  }
  const { data, error } = await db.from("system_settings").select("*");
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

  const db = createAdminClient();
  if (!db) {
    const setting = MOCK_SETTINGS.find((s) => s.key === key);
    if (setting) {
      setting.value = String(value);
      setting.updated_at = new Date().toISOString();
    }
    return NextResponse.json({ key, value: String(value) });
  }

  const { data, error } = await db
    .from("system_settings")
    .upsert({ key, value: String(value), updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
