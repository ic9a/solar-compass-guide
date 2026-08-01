-- Private storage bucket for uploaded photovoltaic offers.
-- Kept in sync with the application's 20 MB upload limit and accepted MIME types.
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'offer-documents',
  'offer-documents',
  false,
  20971520,
  ARRAY['application/pdf','image/png','image/jpeg','image/jpg','image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
