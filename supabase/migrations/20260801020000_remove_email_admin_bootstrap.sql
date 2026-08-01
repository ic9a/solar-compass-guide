-- Forward-only correction for environments where the historical trigger was already applied.
-- Existing role assignments are intentionally preserved; new users receive only the default role.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_anonymous)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.is_anonymous, false))
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        is_anonymous = EXCLUDED.is_anonymous;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
