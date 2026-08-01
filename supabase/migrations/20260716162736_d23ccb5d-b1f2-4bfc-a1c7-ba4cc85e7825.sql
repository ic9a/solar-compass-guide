
-- 1) New scoring rules version with the requested weights.
UPDATE public.scoring_rules SET is_active = false WHERE is_active = true;

INSERT INTO public.scoring_rules (version, is_active, weights, thresholds)
SELECT 2, true,
  '{"component":0.25,"price_fairness":0.25,"completeness":0.20,"warranty":0.15,"risk":0.15}'::jsonb,
  '{
    "panel_tiers": {"tier1":95,"tier2":75,"tier3":55,"unknown":40},
    "inverter_tiers": {"tier1":95,"tier2":78,"tier3":58,"unknown":40},
    "warranty_years": {"panels_min":25,"inverter_min":10,"workmanship_min":2},
    "risk_penalty": {"missing_permit":15,"missing_commissioning":10,"missing_workmanship_warranty":15,"vague_payment_terms":10,"undisclosed_exclusions":10,"low_confidence_field":5,"contradiction":10},
    "price_band_percentile": {"cheap":15,"fair_low":35,"fair_high":65,"expensive":80}
  }'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.scoring_rules WHERE version = 2);

-- 2) Confidence / contradiction columns on offer_extractions.
ALTER TABLE public.offer_extractions
  ADD COLUMN IF NOT EXISTS field_confidence jsonb,
  ADD COLUMN IF NOT EXISTS contradictions jsonb,
  ADD COLUMN IF NOT EXISTS overall_confidence text CHECK (overall_confidence IN ('high','medium','low','insufficient')),
  ADD COLUMN IF NOT EXISTS manually_corrected boolean NOT NULL DEFAULT false;
