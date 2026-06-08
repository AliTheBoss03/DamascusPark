import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { MOCK_SCRATCH_CARDS } from "@/lib/mock-data";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { user_id, pin } = body;

  if (!user_id || !pin) {
    return NextResponse.json(
      { error: "user_id and pin are required" },
      { status: 400 }
    );
  }

  const normalizedPin = String(pin).trim().toUpperCase();

  const db = createAdminClient();

  if (!db) {
    // Mock fallback
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
    // Mark as used in-memory (stateless in mock mode)
    card.is_used = true;
    return NextResponse.json({ credits: card.credit_value });
  }

  // Supabase path: atomic redemption via transaction
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

  // Mark used and add credits
  const { error: updateErr } = await db
    .from("scratch_cards")
    .update({ is_used: true, used_by: user_id, used_at: new Date().toISOString() })
    .eq("id", card.id)
    .eq("is_used", false); // optimistic lock

  if (updateErr) {
    return NextResponse.json(
      { error: "Redemption failed — voucher may already be claimed." },
      { status: 409 }
    );
  }

  const { error: balErr } = await db.rpc("add_wallet_balance", {
    p_user_id: user_id,
    p_amount: card.credit_value,
    p_ref_id: card.id,
    p_reason: "scratch_card",
  });

  if (balErr) {
    return NextResponse.json({ error: balErr.message }, { status: 500 });
  }

  return NextResponse.json({ credits: card.credit_value });
}
