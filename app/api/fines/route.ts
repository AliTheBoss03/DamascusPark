import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { MOCK_FINES } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const wardenId = searchParams.get("warden_id");
  const plate = searchParams.get("plate");

  const db = createAdminClient();
  if (!db) {
    let fines = MOCK_FINES;
    if (wardenId) fines = fines.filter((f) => f.warden_id === wardenId);
    if (plate) {
      const norm = plate.replace(/\s/g, "").toLowerCase();
      fines = fines.filter(
        (f) => f.plate_number.replace(/\s/g, "").toLowerCase() === norm
      );
    }
    return NextResponse.json({ fines });
  }

  let query = db
    .from("fines")
    .select("*, zone:parking_zones(*), warden:profiles!warden_id(*)")
    .order("issued_at", { ascending: false });

  if (wardenId) query = query.eq("warden_id", wardenId);
  if (plate) query = query.eq("plate_number", plate);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ fines: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { plate_number, warden_id, zone_id, amount_credits, notes } = body;

  if (!plate_number || !warden_id || !zone_id || !amount_credits) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = createAdminClient();
  if (!db) {
    return NextResponse.json({
      fine: {
        id: `mock-fine-${Date.now()}`,
        plate_number,
        warden_id,
        zone_id,
        amount_credits,
        notes,
        status: "unpaid",
        issued_at: new Date().toISOString(),
      },
    });
  }

  const { data, error } = await db
    .from("fines")
    .insert({ plate_number, warden_id, zone_id, amount_credits, notes })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ fine: data }, { status: 201 });
}
