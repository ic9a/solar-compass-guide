-- Atomic rate limiting for expensive server functions.
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_user_id uuid,
  p_endpoint text,
  p_max_per_minute integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_count integer;
BEGIN
  IF p_user_id IS NULL OR p_endpoint IS NULL OR p_max_per_minute < 1 THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limits (user_id, endpoint, bucket_start, count)
  VALUES (p_user_id, p_endpoint, date_trunc('minute', now()), 1)
  ON CONFLICT (user_id, endpoint, bucket_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO next_count;

  RETURN next_count <= p_max_per_minute;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(uuid, text, integer) TO service_role;

-- Remove the older duplicate profile UPDATE policy. profiles_owner_update has
-- both USING and WITH CHECK and is the stricter canonical policy.
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;

-- Common foreign-key lookup indexes reported by the Supabase advisor and used
-- in account-history/analysis queries.
CREATE INDEX IF NOT EXISTS contact_messages_user_id_idx
  ON public.contact_messages (user_id);
CREATE INDEX IF NOT EXISTS offer_extractions_offer_id_idx
  ON public.offer_extractions (offer_id);
CREATE INDEX IF NOT EXISTS offer_extractions_user_id_idx
  ON public.offer_extractions (user_id);
CREATE INDEX IF NOT EXISTS offer_analyses_offer_id_idx
  ON public.offer_analyses (offer_id);
CREATE INDEX IF NOT EXISTS offer_analyses_user_id_idx
  ON public.offer_analyses (user_id);
CREATE INDEX IF NOT EXISTS recommendation_sessions_user_id_idx
  ON public.recommendation_sessions (user_id);
