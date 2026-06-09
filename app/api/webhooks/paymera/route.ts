/**
 * Paymera Webhook – Syrian Electronic Payment Company (SEP)
 *
 * Receives payment confirmation callbacks from the Paymera network
 * (launched May 2026, operated by SEP – الشركة السورية للمدفوعات الإلكترونية).
 *
 * Flow:
 *  1. User tops up via a Paymera kiosk / mobile app / telecom agent
 *  2. SEP sends a signed POST to this endpoint
 *  3. We verify the HMAC-SHA256 signature, credit the user's wallet, and ACK
 *
 * Security: HMAC signature verification via PAYMERA_WEBHOOK_SECRET env var.
 * In production, also enforce IP allowlist (SEP publishes their webhook IPs).
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase";

// ── Paymera event types ──────────────────────────────────────────────────────
type PaymeraEventType =
  | "payment.completed"
  | "payment.refunded"
  | "payment.failed";

interface PaymeraPayload {
  event: PaymeraEventType;
  transaction_id: string;
  merchant_ref: string;      // Mawqif user_id
  amount_syp: number;        // Amount in Syrian Pounds
  credits: number;           // Pre-computed credit value (amount_syp / 1000)
  payer_phone: string;       // Masked phone, e.g. +963 9** *** 678
  payment_method: "telecom_wallet" | "paymera_card" | "bank_transfer";
  network?: "syriatel" | "mtn_syria" | "byblos_bank";
  timestamp: string;
  signature: string;         // HMAC-SHA256(secret, event+transaction_id+amount_syp)
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function verifySignature(payload: PaymeraPayload, secret: string): boolean {
  const message = `${payload.event}:${payload.transaction_id}:${payload.amount_syp}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("hex");
  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(payload.signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

function creditFromSyp(amountSyp: number): number {
  return Math.floor(amountSyp / 1000);
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let payload: PaymeraPayload;

  try {
    payload = (await request.json()) as PaymeraPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // ── Validate required fields ─────────────────────────────────────────────
  const required: (keyof PaymeraPayload)[] = [
    "event", "transaction_id", "merchant_ref", "amount_syp", "timestamp", "signature",
  ];
  for (const field of required) {
    if (!payload[field]) {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  // ── Timestamp freshness (±5 min) to prevent replay attacks ───────────────
  const webhookAge = Math.abs(Date.now() - new Date(payload.timestamp).getTime());
  if (webhookAge > 5 * 60 * 1000) {
    return NextResponse.json({ error: "Webhook timestamp expired" }, { status: 400 });
  }

  // ── Signature verification ────────────────────────────────────────────────
  const webhookSecret = process.env.PAYMERA_WEBHOOK_SECRET ?? "mock_secret_for_demo";
  if (!verifySignature(payload, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ── Only process completed payments ──────────────────────────────────────
  if (payload.event !== "payment.completed") {
    return NextResponse.json({ received: true, action: "ignored", event: payload.event });
  }

  const credits = payload.credits ?? creditFromSyp(payload.amount_syp);

  // ── Credit user wallet ────────────────────────────────────────────────────
  const db = createAdminClient();
  if (db) {
    const { error } = await db.rpc("add_wallet_balance", {
      p_user_id: payload.merchant_ref,
      p_amount:  credits,
      p_ref_id:  null,
      p_reason:  `paymera:${payload.payment_method}:${payload.transaction_id}`,
    });

    if (error) {
      console.error("[Paymera Webhook] wallet credit failed:", error.message);
      return NextResponse.json({ error: "Wallet credit failed" }, { status: 500 });
    }
  } else {
    // Mock mode: just log — no DB available
    console.log(
      `[Paymera Webhook MOCK] +${credits} credits → user ${payload.merchant_ref} ` +
      `via ${payload.payment_method} (txn: ${payload.transaction_id})`
    );
  }

  return NextResponse.json({
    received: true,
    transaction_id: payload.transaction_id,
    credits_applied: credits,
    user_id: payload.merchant_ref,
  });
}

// ── GET: health-check / integration verification ─────────────────────────────
export async function GET() {
  return NextResponse.json({
    service: "Mawqif · Paymera Webhook Endpoint",
    operator: "Syrian Electronic Payment Company (SEP) – شركة الدفع الإلكتروني السورية",
    status: "active",
    version: "1.0.0",
    accepted_events: ["payment.completed", "payment.refunded", "payment.failed"],
    accepted_methods: ["telecom_wallet", "paymera_card", "bank_transfer"],
    networks: ["syriatel", "mtn_syria", "byblos_bank"],
    signature_algorithm: "HMAC-SHA256",
    replay_window_seconds: 300,
  });
}
