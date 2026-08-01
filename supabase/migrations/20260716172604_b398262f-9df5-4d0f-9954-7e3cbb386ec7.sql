
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Ensure owners can update their own profile row (so they can set / clear
-- deletion_requested_at from the settings page). Existing policies allow
-- SELECT; this makes UPDATE explicit and scoped to owner.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_owner_update'
  ) THEN
    CREATE POLICY profiles_owner_update
      ON public.profiles FOR UPDATE TO authenticated
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;
