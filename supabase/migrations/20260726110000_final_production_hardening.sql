-- Final production hardening. Keep all business behavior unchanged while
-- closing direct-table privilege gaps without changing application contracts.

REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public
  FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES
  FROM anon, authenticated;

-- `has_role` remains callable by authenticated users because it is used by
-- RLS policies and the account header. Prevent it from probing another user.
CREATE OR REPLACE FUNCTION public.has_role(
  _user_id uuid,
  _role public.app_role
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    )
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)
  TO authenticated;

-- Foreign-key indexes used by ownership and account-history paths.
CREATE INDEX IF NOT EXISTS offers_user_id_idx
  ON public.offers (user_id);
CREATE INDEX IF NOT EXISTS offer_files_user_id_idx
  ON public.offer_files (user_id);
CREATE INDEX IF NOT EXISTS offer_files_offer_id_idx
  ON public.offer_files (offer_id);
CREATE INDEX IF NOT EXISTS offer_analyses_recommendation_session_id_idx
  ON public.offer_analyses (recommendation_session_id);
CREATE INDEX IF NOT EXISTS admin_audit_log_actor_id_idx
  ON public.admin_audit_log (actor_id);
CREATE INDEX IF NOT EXISTS market_offers_source_id_idx
  ON public.market_offers (source_id);

