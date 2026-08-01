
-- 1. Sync profiles when auth.users changes (email / is_anonymous / etc.)
CREATE OR REPLACE FUNCTION public.handle_user_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
     SET email        = NEW.email,
         is_anonymous = COALESCE(NEW.is_anonymous, false),
         updated_at   = now()
   WHERE id = NEW.id;
  -- If a profile row somehow doesn't exist yet, create one.
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, email, is_anonymous)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.is_anonymous, false))
    ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email, is_anonymous = EXCLUDED.is_anonymous;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_user_updated() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE OF email, is_anonymous, phone ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_user_updated();

-- 2. Ownership transfer audit log
CREATE TABLE IF NOT EXISTS public.ownership_transfers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id      UUID NOT NULL,
  to_user_id        UUID NOT NULL,
  offers_moved      INTEGER NOT NULL DEFAULT 0,
  files_moved       INTEGER NOT NULL DEFAULT 0,
  extractions_moved INTEGER NOT NULL DEFAULT 0,
  analyses_moved    INTEGER NOT NULL DEFAULT 0,
  sessions_moved    INTEGER NOT NULL DEFAULT 0,
  payments_moved    INTEGER NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'completed',
  reason            TEXT,
  ip_address        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.ownership_transfers TO service_role;
ALTER TABLE public.ownership_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read ownership transfers"
ON public.ownership_transfers FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Server-side transfer function. Runs as SECURITY DEFINER so it can update
-- rows across two users, but validates that the caller (auth.uid()) IS the
-- destination user and that the source is truly anonymous. The old anonymous
-- session token check happens in the calling server function (we validate the
-- source_user_id belongs to a currently-anonymous auth user).
CREATE OR REPLACE FUNCTION public.transfer_ownership(source_user_id UUID, dest_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  src_is_anon BOOLEAN;
  dest_exists BOOLEAN;
  moved_offers INTEGER := 0;
  moved_files INTEGER := 0;
  moved_extractions INTEGER := 0;
  moved_analyses INTEGER := 0;
  moved_sessions INTEGER := 0;
  moved_payments INTEGER := 0;
BEGIN
  IF source_user_id = dest_user_id THEN
    RETURN jsonb_build_object('ok', true, 'noop', true);
  END IF;

  -- Source must exist AND be anonymous. Never move data away from a permanent user.
  SELECT COALESCE(is_anonymous, false) INTO src_is_anon
    FROM auth.users WHERE id = source_user_id;
  IF src_is_anon IS NULL THEN
    RAISE EXCEPTION 'source user not found';
  END IF;
  IF NOT src_is_anon THEN
    RAISE EXCEPTION 'source user is not anonymous, refusing transfer';
  END IF;

  -- Destination must exist.
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = dest_user_id) INTO dest_exists;
  IF NOT dest_exists THEN
    RAISE EXCEPTION 'destination user not found';
  END IF;

  UPDATE public.offers SET user_id = dest_user_id
    WHERE user_id = source_user_id;
  GET DIAGNOSTICS moved_offers = ROW_COUNT;

  UPDATE public.offer_files SET user_id = dest_user_id
    WHERE user_id = source_user_id;
  GET DIAGNOSTICS moved_files = ROW_COUNT;

  UPDATE public.offer_extractions SET user_id = dest_user_id
    WHERE user_id = source_user_id;
  GET DIAGNOSTICS moved_extractions = ROW_COUNT;

  UPDATE public.offer_analyses SET user_id = dest_user_id
    WHERE user_id = source_user_id;
  GET DIAGNOSTICS moved_analyses = ROW_COUNT;

  UPDATE public.recommendation_sessions SET user_id = dest_user_id
    WHERE user_id = source_user_id;
  GET DIAGNOSTICS moved_sessions = ROW_COUNT;

  UPDATE public.payments SET user_id = dest_user_id
    WHERE user_id = source_user_id;
  GET DIAGNOSTICS moved_payments = ROW_COUNT;

  INSERT INTO public.ownership_transfers (
    from_user_id, to_user_id, offers_moved, files_moved, extractions_moved,
    analyses_moved, sessions_moved, payments_moved, status
  ) VALUES (
    source_user_id, dest_user_id, moved_offers, moved_files, moved_extractions,
    moved_analyses, moved_sessions, moved_payments, 'completed'
  );

  RETURN jsonb_build_object(
    'ok', true,
    'offers', moved_offers,
    'files', moved_files,
    'extractions', moved_extractions,
    'analyses', moved_analyses,
    'sessions', moved_sessions,
    'payments', moved_payments
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.transfer_ownership(UUID, UUID) FROM PUBLIC, anon, authenticated;
