-- Historical migration retained in the private repository without identity-based elevation.
-- Admin roles are assigned explicitly in public.user_roles through an audited operator action.
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
