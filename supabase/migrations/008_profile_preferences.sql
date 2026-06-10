-- ============================================================
-- Migration 008 – Profile Preferences (Settings)
-- ------------------------------------------------------------
-- Extends the canonical `profiles` table (id == auth.users.id) with
-- personalization fields rather than introducing a parallel
-- `user_profiles` table — keeping a single identity row per user.
--   • display_name  -> the existing `profiles.name`
--   • preferred_language -> drives the i18n initial locale
--   • saved_vehicles     -> array of the user's license plates
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'ar'
    CHECK (preferred_language IN ('ar', 'en')),
  ADD COLUMN IF NOT EXISTS saved_vehicles text[] NOT NULL DEFAULT '{}';

-- Let an authenticated user edit ONLY these columns on their own row.
-- role and wallet_balance remain locked (privileged) per migration 004.
GRANT UPDATE (name, phone_number, preferred_language, saved_vehicles)
  ON public.profiles TO authenticated;
