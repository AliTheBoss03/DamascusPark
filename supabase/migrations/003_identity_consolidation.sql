-- ============================================================
-- Migration 003 – Identity Consolidation
-- ------------------------------------------------------------
-- Collapses the legacy `public.users` table into `public.profiles`
-- (which is keyed 1:1 to auth.users.id). After this migration,
-- `profiles` is the SINGLE source of truth for application identity.
--
-- Safe to run now:
--   • public.users        = 0 rows   (nothing to migrate)
--   • public.profiles     = 3 rows   (seeded admin/warden/driver)
--   • No application code references .from("users")
--
-- Runs inside the migration runner's implicit transaction.
-- ============================================================

-- ── 1. Drop the foreign keys that point at the legacy users table ──
ALTER TABLE public.parking_sessions DROP CONSTRAINT IF EXISTS parking_sessions_user_id_fkey;
ALTER TABLE public.fines            DROP CONSTRAINT IF EXISTS fines_warden_id_fkey;
ALTER TABLE public.wallet_ledger    DROP CONSTRAINT IF EXISTS wallet_ledger_user_id_fkey;
ALTER TABLE public.scratch_cards    DROP CONSTRAINT IF EXISTS scratch_cards_used_by_fkey;

-- ── 2. Repoint every identity FK at profiles(id) ──
-- ON DELETE policy is deliberate:
--   • Financial / audit rows (sessions, fines, ledger) → RESTRICT:
--     a profile cannot be deleted while it still owns billable history.
--     This protects the append-only audit trail and revenue integrity.
--   • scratch_cards.used_by → SET NULL: the voucher record (and its
--     redeemed state) must survive even if the redeeming user is removed.
ALTER TABLE public.parking_sessions
    ADD CONSTRAINT parking_sessions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE RESTRICT;

ALTER TABLE public.fines
    ADD CONSTRAINT fines_warden_id_fkey
    FOREIGN KEY (warden_id) REFERENCES public.profiles (id) ON DELETE RESTRICT;

ALTER TABLE public.wallet_ledger
    ADD CONSTRAINT wallet_ledger_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE RESTRICT;

ALTER TABLE public.scratch_cards
    ADD CONSTRAINT scratch_cards_used_by_fkey
    FOREIGN KEY (used_by) REFERENCES public.profiles (id) ON DELETE SET NULL;

-- ── 3. Drop the now-orphaned legacy table ──
-- All inbound FKs have been repointed; its permissive demo policy and
-- indexes are dropped automatically with the table.
DROP TABLE IF EXISTS public.users;

-- ── 4. Document the canonical identity column for downstream readers ──
COMMENT ON TABLE public.profiles IS
    'Canonical application identity. id == auth.users.id. Replaces the removed public.users table (migration 003).';
