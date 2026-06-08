import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { MOCK_SESSIONS } from "@/lib/mock-data";
import { calcSessionCost } from "@/lib/pricing";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const plate = searchParams.get("plate");
  const userId = searchParams.get("user_id");

  const db = createAdminClient();
  if (!db) {
    // Fallback to mock data
    let sessions = MOCK_SESSIONS;
    if (plate) {
      const norm = plate.replace(/\s/g, "").toLowerCase();
      sessions = sessions.filter(
        (s) => s.license_plate.replace(/\s/g, "").toLowerCase() === norm
      );
    }
    if (userId) sessions = sessions.filter((s) => s.user_id === userId);
    return NextResponse.json({ sessions });
  }

  let query = db
    .from("parking_sessions")
    .select("*, zone:parking_zones(*)")
    .order("started_at", { ascending: false });

  if (plate) query = query.eq("license_plate", plate);
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { user_id, zone_id, license_plate, gas_price_snapshot } = body;

  if (!user_id || !zone_id || !license_plate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = createAdminClient();
  if (!db) {
    return NextResponse.json({
      session: {
        id: `mock-${Date.now()}`,
        user_id,
        zone_id,
        license_plate,
        started_at: new Date().toISOString(),
        ended_at: null,
        total_cost_credits: null,
        gas_price_snapshot: gas_price_snapshot ?? 5000,
        status: "active",
      },
    });
  }

  const { data, error } = await db
    .from("parking_sessions")
    .insert({
      user_id,
      zone_id,
      license_plate,
      gas_price_snapshot: gas_price_snapshot ?? 5000,
      status: "active",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { session_id } = body;

  if (!session_id) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  const db = createAdminClient();
  if (!db) {
    const session = MOCK_SESSIONS.find((s) => s.id === session_id);
    return NextResponse.json({ session: { ...session, status: "completed" } });
  }

  // Fetch session + zone to compute cost
  const { data: session, error: fetchErr } = await db
    .from("parking_sessions")
    .select("*, zone:parking_zones(*)")
    .eq("id", session_id)
    .single();

  if (fetchErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const cost = Math.ceil(
    calcSessionCost(session.zone, session.gas_price_snapshot, session.started_at)
  );

  const { data, error } = await db
    .from("parking_sessions")
    .update({
      ended_at: new Date().toISOString(),
      total_cost_credits: cost,
      status: "completed",
    })
    .eq("id", session_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Deduct from wallet
  await db.rpc("deduct_wallet_balance", {
    p_user_id: session.user_id,
    p_amount: cost,
    p_ref_id: session_id,
    p_reason: "session_charge",
  });

  return NextResponse.json({ session: data, charged_credits: cost });
}
