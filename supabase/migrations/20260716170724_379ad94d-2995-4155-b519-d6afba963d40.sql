-- 1) app_settings: remove broad anon read; keep authenticated (all app users have a session).
DROP POLICY IF EXISTS app_settings_public_read ON public.app_settings;
CREATE POLICY app_settings_authenticated_read ON public.app_settings
  FOR SELECT TO authenticated USING (true);

-- 2) tg_set_updated_at: pin search_path.
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- 3) SECURITY DEFINER function exposure:
-- handle_new_user is only invoked by a trigger; revoke all EXECUTE.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- has_role is used by RLS admin policies; anon has no admin role and never needs to call it.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 4) storage.objects offer_docs: exclude anonymous (is_anonymous) sessions from the
-- admin/owner policies; permanent-account (non-anonymous) authenticated users only.
DROP POLICY IF EXISTS offer_docs_admin_read ON storage.objects;
CREATE POLICY offer_docs_admin_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'offer-documents'
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );

DROP POLICY IF EXISTS offer_docs_owner_read ON storage.objects;
CREATE POLICY offer_docs_owner_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'offer-documents'
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS offer_docs_owner_update ON storage.objects;
CREATE POLICY offer_docs_owner_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'offer-documents'
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS offer_docs_owner_delete ON storage.objects;
CREATE POLICY offer_docs_owner_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'offer-documents'
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Uploads keep allowing anonymous sessions (the app relies on anonymous
-- visitors uploading offers before signing up); no change to
-- offer_docs_owner_insert.