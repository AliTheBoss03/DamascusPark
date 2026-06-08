-- ============================================================
-- Mawqif (موقف) – Damascus Smart Parking Platform
-- Initial Database Schema
-- ============================================================

-- Enable PostGIS for geospatial queries (available on Supabase by default)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- SYSTEM SETTINGS
-- Key-value store for globally configurable parameters
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
    key         TEXT PRIMARY KEY,
    value       TEXT        NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings
INSERT INTO system_settings (key, value) VALUES
    ('gas_price_per_liter_syp',        '5000'),
    ('revenue_split_government_pct',   '60'),
    ('fine_multiplier_red',            '5'),
    ('fine_multiplier_yellow',         '3'),
    ('fine_multiplier_green',          '2'),
    ('offline_grace_period_minutes',   '5')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- USERS
-- Covers drivers, wardens, and admins
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    role            TEXT        NOT NULL CHECK (role IN ('driver', 'warden', 'admin')),
    name            TEXT        NOT NULL,
    phone_number    TEXT        NOT NULL UNIQUE,
    wallet_balance  INTEGER     NOT NULL DEFAULT 0 CHECK (wallet_balance >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users (phone_number);
CREATE INDEX idx_users_role  ON users (role);

-- ============================================================
-- PARKING ZONES
-- Color-coded geo-fenced zones with inflation-pegged rates
-- ============================================================
CREATE TABLE IF NOT EXISTS parking_zones (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    TEXT        NOT NULL,
    name_ar                 TEXT        NOT NULL,
    zone_color              TEXT        NOT NULL CHECK (zone_color IN ('red', 'yellow', 'green')),
    description             TEXT,
    -- GeoJSON polygon stored as JSONB; use PostGIS geometry column for production queries
    coordinates             JSONB       NOT NULL,
    geom                    GEOMETRY(POLYGON, 4326),
    -- Rate multiplier: hourly_credits = (gas_price_syp / 1000) * hourly_rate_peg_ratio
    hourly_rate_peg_ratio   NUMERIC     NOT NULL CHECK (hourly_rate_peg_ratio > 0),
    is_active               BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zones_color  ON parking_zones (zone_color);
CREATE INDEX idx_zones_geom   ON parking_zones USING GIST (geom);

-- ============================================================
-- PARKING SESSIONS
-- One row per parking event; cost calculated at end-time
-- ============================================================
CREATE TABLE IF NOT EXISTS parking_sessions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES users (id),
    zone_id             UUID        NOT NULL REFERENCES parking_zones (id),
    license_plate       TEXT        NOT NULL,
    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at            TIMESTAMPTZ,
    total_cost_credits  INTEGER,
    -- gas snapshot at session start – ensures fair billing even if price changes mid-park
    gas_price_snapshot  INTEGER     NOT NULL DEFAULT 5000,
    status              TEXT        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'completed', 'expired')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id       ON parking_sessions (user_id);
CREATE INDEX idx_sessions_zone_id       ON parking_sessions (zone_id);
CREATE INDEX idx_sessions_plate         ON parking_sessions (license_plate);
CREATE INDEX idx_sessions_status        ON parking_sessions (status);
CREATE INDEX idx_sessions_active_plate  ON parking_sessions (license_plate, status)
    WHERE status = 'active';

-- ============================================================
-- FINES
-- Issued by wardens for non-compliant vehicles
-- ============================================================
CREATE TABLE IF NOT EXISTS fines (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID        REFERENCES parking_sessions (id),
    plate_number    TEXT        NOT NULL,
    warden_id       UUID        NOT NULL REFERENCES users (id),
    zone_id         UUID        NOT NULL REFERENCES parking_zones (id),
    amount_credits  INTEGER     NOT NULL CHECK (amount_credits > 0),
    status          TEXT        NOT NULL DEFAULT 'unpaid'
                        CHECK (status IN ('unpaid', 'paid', 'contested')),
    notes           TEXT,
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at         TIMESTAMPTZ
);

CREATE INDEX idx_fines_plate    ON fines (plate_number);
CREATE INDEX idx_fines_warden   ON fines (warden_id);
CREATE INDEX idx_fines_status   ON fines (status);

-- ============================================================
-- SCRATCH CARDS / VOUCHERS
-- Pre-issued top-up vouchers sold via telecom agents
-- ============================================================
CREATE TABLE IF NOT EXISTS scratch_cards (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    pin             TEXT        NOT NULL UNIQUE,
    credit_value    INTEGER     NOT NULL CHECK (credit_value > 0),
    is_used         BOOLEAN     NOT NULL DEFAULT FALSE,
    used_by         UUID        REFERENCES users (id),
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WALLET LEDGER
-- Append-only transaction log for audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS wallet_ledger (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users (id),
    amount          INTEGER     NOT NULL,  -- positive = credit, negative = debit
    balance_after   INTEGER     NOT NULL,
    reason          TEXT        NOT NULL,  -- 'scratch_card', 'session_charge', 'fine_payment'
    ref_id          UUID,                  -- references session or fine id
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ledger_user ON wallet_ledger (user_id, created_at DESC);

-- ============================================================
-- COMPUTED VIEW: Revenue Dashboard
-- ============================================================
CREATE OR REPLACE VIEW revenue_summary AS
SELECT
    SUM(ps.total_cost_credits)                        AS total_session_credits,
    SUM(f.amount_credits) FILTER (WHERE f.status = 'paid') AS total_fine_credits,
    COUNT(DISTINCT ps.id) FILTER (WHERE ps.status = 'active') AS active_sessions,
    COUNT(DISTINCT ps.id) FILTER (WHERE ps.status = 'completed') AS completed_sessions,
    COUNT(DISTINCT f.id)                              AS total_fines_issued,
    SUM(ps.total_cost_credits) +
        COALESCE(SUM(f.amount_credits) FILTER (WHERE f.status = 'paid'), 0)
                                                      AS total_revenue_credits
FROM parking_sessions ps
FULL OUTER JOIN fines f ON TRUE;

-- ============================================================
-- ROW-LEVEL SECURITY (enable for production)
-- ============================================================
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines             ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_ledger     ENABLE ROW LEVEL SECURITY;

-- Permissive policy for the demo (restrict in production by role)
CREATE POLICY "allow_all_for_demo" ON users             FOR ALL USING (TRUE);
CREATE POLICY "allow_all_for_demo" ON parking_sessions  FOR ALL USING (TRUE);
CREATE POLICY "allow_all_for_demo" ON fines             FOR ALL USING (TRUE);
CREATE POLICY "allow_all_for_demo" ON wallet_ledger     FOR ALL USING (TRUE);
