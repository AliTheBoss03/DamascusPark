-- ============================================================
-- Migration 004 – Role-Aware Row Level Security
-- ------------------------------------------------------------
-- Replaces the permissive `allow_all_for_demo` policies and the
-- self-referential (recursion-prone) profiles policies with
-- least-privilege, role-aware RLS for every application table.
--
-- Role semantics:
--   driver  – sees/edits only their own data
--   warden  – may read sessions/fines (enforcement), issue fines
--   admin   – global visibility + management
--
-- NOTE: the API routes currently use the service role (which bypasses
-- RLS). These policies are the security boundary for the authenticated
-- *user* client (and become the boundary for the API once it is moved
-- onto the user session in the RBAC branch). Applying them does not
-- break the existing service-role routes.
-- ============================================================

-- ── 0. Trustworthy role accessor ────────────────────────────
-- SECURITY DEFINER so it bypasses RLS on `profiles` when called from
-- within a `profiles` policy — this is what prevents the
-- "infinite recursion detected in policy" error. It only ever returns
-- the CALLER'S OWN role, so exposing it to authenticated users is safe.
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.auth_role() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.auth_role() TO authenticated;

-- ── 1. PROFILES ─────────────────────────────────────────────
-- Drop the legacy recursive policies from migration 002.
DROP POLICY IF EXISTS profiles_select_own   ON public.profiles;
DROP POLICY IF EXISTS profiles_select_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own   ON public.profiles;
DROP POLICY IF EXISTS profiles_admin_all    ON public.profiles;

-- Read your own row; admins read everyone.
CREATE POLICY profiles_select ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.auth_role() = 'admin');

-- Update only your own row (column grants below restrict WHICH columns).
CREATE POLICY profiles_update_own ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Admins manage all profiles (privileged role/wallet writes go through the
-- service role; see column grants below).
CREATE POLICY profiles_admin ON public.profiles
    FOR ALL TO authenticated
    USING (public.auth_role() = 'admin')
    WITH CHECK (public.auth_role() = 'admin');

-- Column-level hardening: a user JWT may change only name + phone on its own
-- row. `role` and `wallet_balance` can NEVER be self-edited — wallet moves via
-- SECURITY DEFINER RPCs, role assignment via the service role. This closes the
-- self-promotion-to-admin vector at the data layer.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT  UPDATE (name, phone_number) ON public.profiles TO authenticated;
-- (No INSERT policy: profiles are created by the handle_new_user trigger.)

-- ── 2. PARKING_SESSIONS ─────────────────────────────────────
DROP POLICY IF EXISTS allow_all_for_demo ON public.parking_sessions;

-- Drivers see their own; wardens + admins see all (enforcement / telemetry).
CREATE POLICY sessions_select ON public.parking_sessions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.auth_role() IN ('warden', 'admin'));

-- A driver may start a session only for themselves.
CREATE POLICY sessions_insert_own ON public.parking_sessions
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- A driver may modify (e.g. end) only their own session; admins may correct any.
CREATE POLICY sessions_update ON public.parking_sessions
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR public.auth_role() = 'admin')
    WITH CHECK (user_id = auth.uid() OR public.auth_role() = 'admin');
-- (No DELETE policy: sessions are immutable history for everyone but the service role.)

-- ── 3. FINES ────────────────────────────────────────────────
DROP POLICY IF EXISTS allow_all_for_demo ON public.fines;

-- Wardens/admins read all fines (to check a plate's outstanding fines).
-- Drivers read fines tied to their own sessions or any plate they've parked under.
CREATE POLICY fines_select ON public.fines
    FOR SELECT TO authenticated
    USING (
        public.auth_role() IN ('warden', 'admin')
        OR EXISTS (
            SELECT 1 FROM public.parking_sessions s
            WHERE s.user_id = auth.uid()
              AND (s.id = fines.session_id OR s.license_plate = fines.plate_number)
        )
    );

-- Only wardens/admins issue fines, and only under their own warden_id.
CREATE POLICY fines_insert_warden ON public.fines
    FOR INSERT TO authenticated
    WITH CHECK (
        public.auth_role() IN ('warden', 'admin')
        AND warden_id = auth.uid()
    );

-- Status changes (paid/contested) are admin-only at the table layer;
-- driver-initiated payment runs through a wallet RPC (migration 005).
CREATE POLICY fines_update_admin ON public.fines
    FOR UPDATE TO authenticated
    USING (public.auth_role() = 'admin')
    WITH CHECK (public.auth_role() = 'admin');
-- (No DELETE policy.)

-- ── 4. WALLET_LEDGER (append-only audit) ────────────────────
DROP POLICY IF EXISTS allow_all_for_demo ON public.wallet_ledger;

-- Read your own ledger; admins read all. No client writes at all — entries are
-- written exclusively by SECURITY DEFINER wallet RPCs and the service role.
CREATE POLICY ledger_select ON public.wallet_ledger
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.auth_role() = 'admin');

REVOKE INSERT, UPDATE, DELETE ON public.wallet_ledger FROM anon, authenticated;

-- ── 5. SCRATCH_CARDS (secret PINs) ──────────────────────────
-- No client-facing policy by design: a readable PIN is free credit. Redemption
-- and issuance happen via SECURITY DEFINER RPC / service role only. RLS-enabled
-- with no policy = deny-all for anon/authenticated (this remains an intentional
-- "RLS enabled, no policy" advisor INFO).
REVOKE ALL ON public.scratch_cards FROM anon, authenticated;

-- ── 6. PARKING_ZONES (public reference data) ────────────────
-- Anyone (incl. the public landing map) may read active zones. Writes are admin-only.
CREATE POLICY zones_public_read ON public.parking_zones
    FOR SELECT TO anon, authenticated
    USING (is_active = TRUE);

CREATE POLICY zones_admin_write ON public.parking_zones
    FOR ALL TO authenticated
    USING (public.auth_role() = 'admin')
    WITH CHECK (public.auth_role() = 'admin');

-- ── 7. SYSTEM_SETTINGS (operational params) ─────────────────
-- Public read (pricing transparency: gas index, multipliers). Writes admin-only —
-- this is what stops an anonymous caller from zeroing the gas price.
CREATE POLICY settings_public_read ON public.system_settings
    FOR SELECT TO anon, authenticated
    USING (TRUE);

CREATE POLICY settings_admin_write ON public.system_settings
    FOR ALL TO authenticated
    USING (public.auth_role() = 'admin')
    WITH CHECK (public.auth_role() = 'admin');
