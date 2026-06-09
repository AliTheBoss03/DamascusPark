-- ============================================================
-- Migration 007 – Paymera Webhook Idempotency
-- ------------------------------------------------------------
-- Payment webhooks retry (network blips, non-2xx). Without an
-- idempotency guard, a retried `payment.completed` with a valid
-- signature credits the wallet again — real duplicated money.
--
-- This adds a transaction ledger keyed by transaction_id and an
-- atomic RPC that records-then-credits in a single transaction:
--   • first delivery  -> records event + credits wallet + ledger row
--   • any retry        -> no-op (returns { duplicate: true })
--   • mid-failure      -> whole tx rolls back, so a later retry works
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
    transaction_id  TEXT        PRIMARY KEY,
    provider        TEXT        NOT NULL DEFAULT 'paymera',
    user_id         UUID        REFERENCES public.profiles (id) ON DELETE SET NULL,
    amount_syp      INTEGER,
    credits         INTEGER,
    event           TEXT,
    processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_user ON public.payment_webhook_events (user_id, processed_at DESC);

-- Only the service role (the webhook) ever touches this table.
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_webhook_events FROM anon, authenticated;

-- ── Atomic record-then-credit ───────────────────────────────
CREATE OR REPLACE FUNCTION public.process_paymera_topup(
    p_transaction_id TEXT,
    p_user_id        UUID,
    p_credits        INTEGER,
    p_amount_syp     INTEGER,
    p_method         TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_rows        INTEGER;
    v_new_balance INTEGER;
BEGIN
    IF p_credits IS NULL OR p_credits < 0 THEN
        RAISE EXCEPTION 'process_paymera_topup: credits must be non-negative (got %)', p_credits
            USING ERRCODE = 'check_violation';
    END IF;

    -- Idempotency gate: only the first delivery inserts a row.
    INSERT INTO public.payment_webhook_events
        (transaction_id, provider, user_id, amount_syp, credits, event)
    VALUES
        (p_transaction_id, 'paymera', p_user_id, p_amount_syp, p_credits, 'payment.completed')
    ON CONFLICT (transaction_id) DO NOTHING;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
        RETURN jsonb_build_object('duplicate', true, 'transaction_id', p_transaction_id);
    END IF;

    -- First delivery: credit the wallet + write the ledger row, same tx.
    UPDATE public.profiles
       SET wallet_balance = wallet_balance + p_credits,
           updated_at     = NOW()
     WHERE id = p_user_id
    RETURNING wallet_balance INTO v_new_balance;

    IF v_new_balance IS NULL THEN
        -- Bad merchant_ref: roll the event insert back so it isn't poisoned.
        RAISE EXCEPTION 'process_paymera_topup: profile % not found', p_user_id
            USING ERRCODE = 'no_data_found';
    END IF;

    INSERT INTO public.wallet_ledger (user_id, amount, balance_after, reason, ref_id)
    VALUES (p_user_id, p_credits, v_new_balance,
            'paymera:' || COALESCE(p_method, 'unknown') || ':' || p_transaction_id, NULL);

    RETURN jsonb_build_object(
        'duplicate', false,
        'credits_applied', p_credits,
        'new_balance', v_new_balance
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.process_paymera_topup(TEXT, UUID, INTEGER, INTEGER, TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.process_paymera_topup(TEXT, UUID, INTEGER, INTEGER, TEXT)
    TO service_role;
