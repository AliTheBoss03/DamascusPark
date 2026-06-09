import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, createAdminClient } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/auth";
import { MOCK_SESSIONS } from "@/lib/mock-data";
import { calcSessionCost } from "@/lib/pricing";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const plate = searchParams.get("plate");

  if (!isSupabaseConfigured) {
    let sessions = MOCK_SESSIONS;
    if (plate) {
      const norm = plate.replace(/\s/g, "").toLowerCase();
      sessions = sessions.filter(
        (s) => s.license_plate.replace(/\s/g, "").toLowerCase() === norm
      );
    }
    return NextResponse.json({ sessions });
  }

  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RLS scopes: drivers see their own sessions; wardens/admins see all. The
  // old ?user_id param (an IDOR vector) is gone — scope is enforced by policy.
  const supabase = createClient();
  let query = supabase
    .from("parking_sessions")
    .select("*, zone:parking_zones(*)")
    .order("started_at", { ascending: false });

  if (plate) query = query.eq("license_plate", plate);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { zone_id, license_plate } = body;

  if (!zone_id || !license_plate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({
      session: {
        id: `mock-${Date.now()}`,
        zone_id,
        license_plate,
        started_at: new Date().toISOString(),
        ended_at: null,
        total_cost_credits: null,
        gas_price_snapshot: 5000,
        status: "active",
      },
    });
  }

  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient();

  // Server-authoritative gas snapshot — pricing inputs are never trusted from
  // the client. Locks the rate for fair billing even if the index moves later.
  const { data: gasSetting } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "gas_price_per_liter_syp")
    .single();
  const gasSnapshot = gasSetting ? parseInt(gasSetting.value, 10) : 5000;

  // RLS sessions_insert_own enforces user_id = auth.uid().
  const { data, error } = await supabase
    .from("parking_sessions")
    .insert({
      user_id: user.id,
      zone_id,
      license_plate,
      gas_price_snapshot: gasSnapshot,
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

  if (!isSupabaseConfigured) {
    const session = MOCK_SESSIONS.find((s) => s.id === session_id);
    return NextResponse.json({ session: { ...session, status: "completed" } });
  }

  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RLS ensures the caller can only read (and later update) their own session,
  // or any session if admin.
  const supabase = createClient();
  const { data: session, error: fetchErr } = await supabase
    .from("parking_sessions")
    .select("*, zone:parking_zones(*)")
    .eq("id", session_id)
    .single();

  if (fetchErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.status !== "active") {
    return NextResponse.json({ error: "Session is not active" }, { status: 409 });
  }

  const cost = Math.ceil(
    calcSessionCost(session.zone, session.gas_price_snapshot, session.started_at)
  );

  // Charge BEFORE completing the session, via the service role (wallet RPCs are
  // service-role only). deduct_wallet_balance rejects on insufficient funds, so
  // an underfunded driver gets a 402 and the session stays active — no silent
  // free parking, and the ledger stays exact.
  const admin = createAdminClient();
  if (admin) {
    const { error: chargeErr } = await admin.rpc("deduct_wallet_balance", {
      p_user_id: session.user_id,
      p_amount: cost,
      p_ref_id: session_id,
      p_reason: "session_charge",
    });
    if (chargeErr) {
      if (chargeErr.message?.includes("insufficient_funds")) {
        return NextResponse.json(
          { error: "insufficient_funds", required_credits: cost },
          { status: 402 }
        );
      }
      return NextResponse.json({ error: chargeErr.message }, { status: 500 });
    }
  }

  const { data, error } = await supabase
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
  return NextResponse.json({ session: data, charged_credits: cost });
}
