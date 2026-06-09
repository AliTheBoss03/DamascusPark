-- ============================================================
-- Migration 006 – Role Source Hardening
-- ------------------------------------------------------------
-- Removes the self-promotion vector at signup. The previous trigger
-- copied `raw_user_meta_data->>'role'` (which the CLIENT controls at
-- sign-up via options.data) straight into profiles.role — meaning a
-- driver could register as 'admin'. Roles must only ever be elevated
-- by a trusted server (service role), which writes `app_metadata`.
--
--   • New profiles always default to 'driver'.
--   • An elevated role is honoured ONLY if present in app_metadata,
--     which a client cannot set (updateUser() can write user_metadata
--     but never app_metadata).
-- ============================================================

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
        -- trusted source only; client-supplied user_metadata is ignored for role
        COALESCE(NEW.raw_app_meta_data ->> 'role', 'driver'),
        COALESCE(NEW.raw_user_meta_data ->> 'name', SPLIT_PART(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Backfill: mirror each existing profile's role into app_metadata so the
-- JWT / middleware can trust app_metadata going forward. (The 3 seeded
-- accounts currently have app_metadata.role = NULL.)
UPDATE auth.users u
   SET raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb)
                           || jsonb_build_object('role', p.role)
  FROM public.profiles p
 WHERE p.id = u.id
   AND COALESCE(u.raw_app_meta_data ->> 'role', '') IS DISTINCT FROM p.role;
