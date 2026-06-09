import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, createAdminClient } from "@/lib/supabase";
import { getAuthedUser } from "@/lib/auth";
import { MOCK_SCRATCH_CARDS } from "@/lib/mock-data";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { pin } = body;

  if (!pin) {
    return NextResponse.json({ error: "pin is required" }, { status: 400 });
  }

  const normalizedPin = String(pin).trim().toUpperCase();

  if (!isSupabaseConfigured) {
    // Mock fallback (stateless).
    const card = MOCK_SCRATCH_CARDS.find(
      (c) => c.pin.toUpperCase() === normalizedPin && !c.is_used
    );
    if (!card) {
      const alreadyUsed = MOCK_SCRATCH_CARDS.find(
        (c) => c.pin.toUpperCase() === normalizedPin
      );
      return NextResponse.json(
        {
          error: alreadyUsed
            ? "This voucher has already been used."
            : "Invalid PIN. Please check and try again.",
        },
        { status: 400 }
      );
    }
    card.is_used = true;
    return NextResponse.json({ credits: card.credit_value });
  }

  // ── Identity comes from the session, never the request body ────────────────
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // scratch_cards is deny-all to the user client (secret PINs); redemption and
  // the wallet credit both require the service role.
  const db = createAdminClient();
  if (!db) {
    return NextResponse.json({ error: "Wallet service unavailable" }, { status: 503 });
  }

  const { data: card, error: cardErr } = await db
    .from("scratch_cards")
    .select("*")
    .eq("pin", normalizedPin)
    .single();

  if (cardErr || !card) {
    return NextResponse.json(
      { error: "Invalid PIN. Please check and try again." },
      { status: 400 }
    );
  }

  if (card.is_used) {
    return NextResponse.json(
      { error: "This voucher has already been used." },
      { status: 400 }
    );
  }

  // Optimistic lock: only the request that flips is_used false→true wins.
  // We check the affected rows so a lost race never credits the wallet.
  const { data: claimed, error: updateErr } = await db
    .from("scratch_cards")
    .update({ is_used: true, used_by: user.id, used_at: new Date().toISOString() })
    .eq("id", card.id)
    .eq("is_used", false)
    .select("id");

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }
  if (!claimed || claimed.length === 0) {
    return NextResponse.json(
      { error: "Redemption failed — voucher may already be claimed." },
      { status: 409 }
    );
  }

  const { error: balErr } = await db.rpc("add_wallet_balance", {
    p_user_id: user.id,
    p_amount: card.credit_value,
    p_ref_id: card.id,
    p_reason: "scratch_card",
  });

  if (balErr) {
    return NextResponse.json({ error: balErr.message }, { status: 500 });
  }

  return NextResponse.json({ credits: card.credit_value });
}
