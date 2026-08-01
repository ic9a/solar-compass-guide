
ALTER TABLE public.offer_analyses
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS amount_paid_lei numeric,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS offer_analyses_stripe_session_id_key
  ON public.offer_analyses(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

ALTER TABLE public.offer_extractions
  ADD COLUMN IF NOT EXISTS token_cost_input integer,
  ADD COLUMN IF NOT EXISTS token_cost_output integer,
  ADD COLUMN IF NOT EXISTS progress_message text;

ALTER TABLE public.market_offers
  ADD COLUMN IF NOT EXISTS lei_per_kwp numeric
    GENERATED ALWAYS AS (
      CASE WHEN system_kwp > 0 AND total_price_lei IS NOT NULL
           THEN total_price_lei / system_kwp
           ELSE NULL END
    ) STORED;

CREATE INDEX IF NOT EXISTS market_offers_verified_lei_per_kwp_idx
  ON public.market_offers(lei_per_kwp)
  WHERE is_verified = true AND lei_per_kwp IS NOT NULL;

INSERT INTO public.scoring_rules (version, is_active, weights, thresholds)
SELECT 1, true,
  '{"component":0.30,"price_fairness":0.30,"completeness":0.15,"warranty":0.15,"risk":0.10}'::jsonb,
  '{
    "panel_tiers":{"tier1":100,"tier2":75,"tier3":50,"unknown":40},
    "inverter_tiers":{"tier1":100,"tier2":75,"tier3":55,"unknown":40},
    "warranty_years":{"panels_min":25,"inverter_min":10,"workmanship_min":2},
    "risk_penalty":{"missing_permit":15,"missing_commissioning":15,"missing_workmanship_warranty":10,"vague_payment_terms":10,"undisclosed_exclusions":10},
    "price_band_percentile":{"cheap":20,"fair_low":35,"fair_high":65,"expensive":85}
  }'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.scoring_rules WHERE version = 1);

INSERT INTO public.app_settings (id, report_price_lei, retention_days, business_name, business_cui, business_email, business_address)
SELECT 1, 49, 90, 'Raport Solar', NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings WHERE id = 1);
