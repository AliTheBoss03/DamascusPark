-- ============================================================
-- Migration 005 – RPC Lockdown, Ledger Integrity & Revenue View
-- ------------------------------------------------------------
-- Closes the wallet-RPC privilege hole, makes the ledger a faithful
-- append-only record, and rebuilds the revenue view to be both safe
-- (security_invoker) and mathematically correct (no cartesian join).
-- ============================================================

-- ── 1. add_wallet_balance — pin search_path, guard input ────
-- Logic unchanged (credit + ledger row) but now with a fixed search_path.
CREATE OR REPLACE FUNCTION public.add_wallet_balance(
    p_user_id UUID,
    p_amount   INTEGER,
    p_ref_id   UUID,
    p_reason   TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_new_balance INTEGER;
BEGIN
    IF p_amount IS NULL OR p_amount < 0 THEN
        RAISE EXCEPTION 'add_wallet_balance: amount must be non-negative (got %)', p_amount
            USING ERRCODE = 'check_violation';
    END IF;

    UPDATE public.profiles
       SET wallet_balance = wallet_balance + p_amount,
           updated_at     = NOW()
     WHERE id = p_user_id
    RETURNING wallet_balance INTO v_new_balance;

    IF v_new_balance IS NULL THEN
        RAISE EXCEPTION 'add_wallet_balance: profile % not found', p_user_id
            USING ERRCODE = 'no_data_found';
    END IF;

    INSERT INTO public.wallet_ledger (user_id, amount, balance_after, reason, ref_id)
    VALUES (p_user_id, p_amount, v_new_balance, p_reason, p_ref_id);

    RETURN v_new_balance;
END;
$$;

-- ── 2. deduct_wallet_balance — reject on insufficient funds ──
-- Previously used GREATEST(0, balance - amount): it silently clamped the
-- balance to 0 while still writing -amount to the ledger, so the running
-- ledger total diverged from balance_after. The profiles.wallet_balance
-- CHECK (>= 0) means negative balances are illegal anyway, so the correct
-- primitive is to REJECT when funds are insufficient. A row lock
-- (FOR UPDATE) serialises concurrent debits. The ledger delta now always
-- equals the real balance change — the audit trail reconciles exactly.
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(
    p_user_id UUID,
    p_amount   INTEGER,
    p_ref_id   UUID,
    p_reason   TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance     INTEGER;
    v_new_balance INTEGER;
BEGIN
    IF p_amount IS NULL OR p_amount < 0 THEN
        RAISE EXCEPTION 'deduct_wallet_balance: amount must be non-negative (got %)', p_amount
            USING ERRCODE = 'check_violation';
    END IF;

    SELECT wallet_balance INTO v_balance
      FROM public.profiles
     WHERE id = p_user_id
     FOR UPDATE;

    IF v_balance IS NULL THEN
        RAISE EXCEPTION 'deduct_wallet_balance: profile % not found', p_user_id
            USING ERRCODE = 'no_data_found';
    END IF;

    IF v_balance < p_amount THEN
        -- Surfaced to the API as a catchable, typed error.
        RAISE EXCEPTION 'insufficient_funds: balance % < amount %', v_balance, p_amount
            USING ERRCODE = 'check_violation';
    END IF;

    UPDATE public.profiles
       SET wallet_balance = wallet_balance - p_amount,
           updated_at     = NOW()
     WHERE id = p_user_id
    RETURNING wallet_balance INTO v_new_balance;

    INSERT INTO public.wallet_ledger (user_id, amount, balance_after, reason, ref_id)
    VALUES (p_user_id, -p_amount, v_new_balance, p_reason, p_ref_id);

    RETURN v_new_balance;
END;
$$;

-- ── 3. Lock down EXECUTE on privileged functions ────────────
-- These must never be callable straight from the anon/authenticated REST
-- surface (that was the "anyone can mint credits" hole). Only the service
-- role (webhook / trusted server routes) may invoke them. handle_new_user
-- is a trigger function and never needs a direct REST grant.
REVOKE EXECUTE ON FUNCTION public.add_wallet_balance(UUID, INTEGER, UUID, TEXT)    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_wallet_balance(UUID, INTEGER, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                               FROM PUBLIC, anon, authenticated;

GRANT  EXECUTE ON FUNCTION public.add_wallet_balance(UUID, INTEGER, UUID, TEXT)    TO service_role;
GRANT  EXECUTE ON FUNCTION public.deduct_wallet_balance(UUID, INTEGER, UUID, TEXT) TO service_role;

-- ── 4. revenue_summary — correct + security_invoker ─────────
-- The old view did `parking_sessions FULL OUTER JOIN fines ON TRUE`, a
-- cartesian product that multiplied every SUM by the opposite table's row
-- count. Rebuilt with independent scalar aggregates. security_invoker = on
-- means it honours the querying user's RLS (admins see global; it no longer
-- leaks city-wide revenue to every role as the old SECURITY DEFINER view did).
DROP VIEW IF EXISTS public.revenue_summary;

CREATE VIEW public.revenue_summary
WITH (security_invoker = on) AS
SELECT
    (SELECT COALESCE(SUM(total_cost_credits), 0)
       FROM public.parking_sessions WHERE status = 'completed')        AS total_session_credits,
    (SELECT COALESCE(SUM(amount_credits), 0)
       FROM public.fines WHERE status = 'paid')                        AS total_fine_credits,
    (SELECT COUNT(*) FROM public.parking_sessions WHERE status = 'active')    AS active_sessions,
    (SELECT COUNT(*) FROM public.parking_sessions WHERE status = 'completed') AS completed_sessions,
    (SELECT COUNT(*) FROM public.fines)                                AS total_fines_issued,
    (SELECT COALESCE(SUM(total_cost_credits), 0)
       FROM public.parking_sessions WHERE status = 'completed')
    + (SELECT COALESCE(SUM(amount_credits), 0)
       FROM public.fines WHERE status = 'paid')                        AS total_revenue_credits;
