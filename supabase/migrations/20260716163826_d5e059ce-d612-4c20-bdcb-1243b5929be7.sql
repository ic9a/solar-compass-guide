
-- payments: authoritative purchase record
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES public.offer_analyses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  amount_expected_lei NUMERIC NOT NULL,
  amount_paid_lei NUMERIC,
  currency TEXT NOT NULL DEFAULT 'ron',
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  livemode BOOLEAN,
  price_settings_version INT,
  idempotency_key TEXT UNIQUE,
  refund_amount_lei NUMERIC,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS payments_user_idx ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_analysis_idx ON public.payments(analysis_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments(status);

GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payments_owner_read ON public.payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY payments_admin_read ON public.payments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_payments_updated
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- stripe_webhook_events: idempotency ledger
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  livemode BOOLEAN NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  safe_error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS stripe_events_type_idx ON public.stripe_webhook_events(event_type);

GRANT SELECT ON public.stripe_webhook_events TO authenticated;
GRANT ALL ON public.stripe_webhook_events TO service_role;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY stripe_events_admin_read ON public.stripe_webhook_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- admin_audit_log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_kind TEXT,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_created_idx ON public.admin_audit_log(created_at DESC);

GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_admin_read ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Extend app_settings
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS stripe_environment TEXT NOT NULL DEFAULT 'test',
  ADD COLUMN IF NOT EXISTS emails_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_from TEXT DEFAULT 'RaportSolar <no-reply@mail.raportsolar.ro>',
  ADD COLUMN IF NOT EXISTS email_reply_to TEXT DEFAULT 'contact@raportsolar.ro',
  ADD COLUMN IF NOT EXISTS admin_notify_email TEXT DEFAULT 'contact@raportsolar.ro',
  ADD COLUMN IF NOT EXISTS price_settings_version INT NOT NULL DEFAULT 1;

-- Soft delete flag on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Backfill payments from historical is_paid rows so admin/user views are consistent
INSERT INTO public.payments (user_id, analysis_id, status, amount_expected_lei, amount_paid_lei, currency, stripe_checkout_session_id, paid_at, price_settings_version)
SELECT a.user_id, a.id, 'paid', COALESCE(a.amount_paid_lei, 49), a.amount_paid_lei, 'ron', a.stripe_session_id, a.paid_at, 1
FROM public.offer_analyses a
WHERE a.is_paid = true
  AND a.stripe_session_id IS NOT NULL
ON CONFLICT (stripe_checkout_session_id) DO NOTHING;
