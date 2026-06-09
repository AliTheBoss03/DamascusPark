-- ============================================================
-- Migration 002 – Auth-linked Profiles & RBAC
-- Run this in Supabase SQL Editor AFTER enabling Auth.
-- ============================================================

-- ── Profiles table ──────────────────────────────────────────
-- Extends auth.users with application-level attributes.
-- id mirrors auth.users.id so joins are always fast.
CREATE TABLE IF NOT EXISTS profiles (
    id              UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    role            TEXT        NOT NULL DEFAULT 'driver'
                        CHECK (role IN ('driver', 'warden', 'admin')),
    name            TEXT        NOT NULL DEFAULT '',
    phone_number    TEXT        UNIQUE,
    wallet_balance  INTEGER     NOT NULL DEFAULT 0 CHECK (wallet_balance >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile; admins can read all
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Users can update their own profile (not role)
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Only admins can insert / change roles
CREATE POLICY "profiles_admin_all" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- ── Auto-create profile on signup ───────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, role, name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'role',  'driver'),
        COALESCE(NEW.raw_user_meta_data ->> 'name',  SPLIT_PART(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Wallet helper RPCs (called from API routes) ──────────────
CREATE OR REPLACE FUNCTION add_wallet_balance(
    p_user_id UUID,
    p_amount   INTEGER,
    p_ref_id   UUID,
    p_reason   TEXT
) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE v_new_balance INTEGER;
BEGIN
    UPDATE profiles
    SET wallet_balance = wallet_balance + p_amount,
        updated_at     = NOW()
    WHERE id = p_user_id
    RETURNING wallet_balance INTO v_new_balance;

    INSERT INTO wallet_ledger (user_id, amount, balance_after, reason, ref_id)
    VALUES (p_user_id, p_amount, v_new_balance, p_reason, p_ref_id);

    RETURN v_new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION deduct_wallet_balance(
    p_user_id UUID,
    p_amount   INTEGER,
    p_ref_id   UUID,
    p_reason   TEXT
) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE v_new_balance INTEGER;
BEGIN
    UPDATE profiles
    SET wallet_balance = GREATEST(0, wallet_balance - p_amount),
        updated_at     = NOW()
    WHERE id = p_user_id
    RETURNING wallet_balance INTO v_new_balance;

    INSERT INTO wallet_ledger (user_id, amount, balance_after, reason, ref_id)
    VALUES (p_user_id, -p_amount, v_new_balance, p_reason, p_ref_id);

    RETURN v_new_balance;
END;
$$;

-- ── Demo seed data (idempotent) ──────────────────────────────
-- NOTE: auth.users rows are created via /api/seed (requires service role).
-- This block seeds the parking_zones with Damascus GeoJSON if not already present.
INSERT INTO parking_zones (id, name, name_ar, zone_color, description, hourly_rate_peg_ratio, coordinates)
VALUES
(
    'a1b2c3d4-0001-0001-0001-000000000001',
    'Shaalan / Malki',
    'شعلان / المالكي',
    'red',
    'Premium central district – high footfall commercial area',
    3.0,
    '{"type":"Polygon","coordinates":[[[36.278,33.512],[36.292,33.512],[36.292,33.504],[36.278,33.504],[36.278,33.512]]]}'::jsonb
),
(
    'a1b2c3d4-0002-0002-0002-000000000002',
    'Mezzeh / Abu Roumaneh',
    'المزة / أبو رمانة',
    'yellow',
    'Standard zone – diplomatic quarter & residential mix',
    2.0,
    '{"type":"Polygon","coordinates":[[[36.258,33.505],[36.275,33.505],[36.275,33.494],[36.258,33.494],[36.258,33.505]]]}'::jsonb
),
(
    'a1b2c3d4-0003-0003-0003-000000000003',
    'Kafarsouseh / Qassaa',
    'كفرسوسة / القصاع',
    'green',
    'Economy zone – outer districts with lower demand',
    1.0,
    '{"type":"Polygon","coordinates":[[[36.295,33.500],[36.310,33.500],[36.310,33.490],[36.295,33.490],[36.295,33.500]]]}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
