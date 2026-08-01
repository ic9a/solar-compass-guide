-- ============================================================
-- raportsolar.ro Phase 1 foundation
-- Profiles, roles, calculation settings, market data, sessions,
-- offers/files/extractions/analyses, energy snapshots, PVGIS cache,
-- contact messages, app settings, rate limits.
-- ============================================================

-- ---------- ENUMS ----------
CREATE TYPE public.app_role AS ENUM ('user', 'admin');
CREATE TYPE public.offer_source_method AS ENUM ('upload', 'manual');
CREATE TYPE public.offer_status AS ENUM ('draft', 'uploaded', 'extracting', 'needs_review', 'analyzing', 'analyzed', 'paid', 'failed');
CREATE TYPE public.extraction_status AS ENUM ('pending', 'success', 'partial', 'failed');
CREATE TYPE public.analysis_status AS ENUM ('pending', 'ready', 'failed');
CREATE TYPE public.recommendation_status AS ENUM ('draft', 'complete');
CREATE TYPE public.payment_status AS ENUM ('pending', 'succeeded', 'failed', 'cancelled', 'refunded');

-- ---------- updated_at helper ----------
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  is_anonymous boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_self_select ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- user_roles (separate table, per security guidance)
-- ============================================================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_roles_self_read ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- profile + admin bootstrap trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_anonymous)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.is_anonymous, false)
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, is_anonymous = EXCLUDED.is_anonymous;

  -- default role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- calculation_settings (versioned, one active)
-- ============================================================
CREATE TABLE public.calculation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version integer NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT false,
  panel_wattage integer NOT NULL DEFAULT 450,
  panel_area_m2 numeric NOT NULL DEFAULT 2.0,
  base_system_loss_pct numeric NOT NULL DEFAULT 14,
  annual_degradation_pct numeric NOT NULL DEFAULT 0.5,
  battery_dod_pct numeric NOT NULL DEFAULT 90,
  battery_round_trip_efficiency_pct numeric NOT NULL DEFAULT 90,
  max_daily_cycles numeric NOT NULL DEFAULT 1.0,
  discount_rate_pct numeric NOT NULL DEFAULT 5,
  electricity_price_escalation_pct numeric NOT NULL DEFAULT 3,
  default_import_tariff_lei_per_kwh numeric NOT NULL DEFAULT 1.30,
  default_export_value_lei_per_kwh numeric NOT NULL DEFAULT 0.45,
  tariff_source text,
  tariff_effective_date date,
  inverter_replacement_year integer NOT NULL DEFAULT 12,
  battery_replacement_year integer NOT NULL DEFAULT 12,
  annual_maintenance_lei numeric NOT NULL DEFAULT 250,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.calculation_settings TO anon, authenticated;
GRANT ALL ON public.calculation_settings TO service_role;
ALTER TABLE public.calculation_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY calc_settings_public_read ON public.calculation_settings FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY calc_settings_admin_all ON public.calculation_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.calculation_settings (version, is_active, tariff_source, tariff_effective_date, notes)
VALUES (1, true, 'Estimare medie piață (ANRE 2024)', '2024-07-01', 'Versiune inițială — reperele publice ANRE/Transelectrica 2024.');

-- ============================================================
-- scoring_rules (versioned, seeded)
-- ============================================================
CREATE TABLE public.scoring_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version integer NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT false,
  weights jsonb NOT NULL,
  thresholds jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.scoring_rules TO anon, authenticated;
GRANT ALL ON public.scoring_rules TO service_role;
ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY scoring_rules_public_read ON public.scoring_rules FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY scoring_rules_admin_all ON public.scoring_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.scoring_rules (version, is_active, weights, thresholds) VALUES (
  1, true,
  '{"price":25,"equipment":25,"transparency":20,"installation":15,"warranties":15}'::jsonb,
  '{}'::jsonb
);

-- ============================================================
-- market_benchmark_sources + market_offers
-- ============================================================
CREATE TABLE public.market_benchmark_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  publisher text,
  url text,
  source_type text,
  retrieved_at date,
  notes text,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.market_benchmark_sources TO anon, authenticated;
GRANT ALL ON public.market_benchmark_sources TO service_role;
ALTER TABLE public.market_benchmark_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY market_sources_public_read ON public.market_benchmark_sources FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY market_sources_admin_all ON public.market_benchmark_sources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.market_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.market_benchmark_sources(id) ON DELETE SET NULL,
  supplier text,
  system_kwp numeric NOT NULL,
  system_type text,
  phase text,
  battery_nominal_kwh numeric,
  battery_usable_kwh numeric,
  total_price_lei numeric NOT NULL,
  vat_included boolean,
  installation_included boolean,
  transport_included boolean,
  ac_dc_protections_included boolean,
  prosumer_docs_included boolean,
  roof_type text,
  county text,
  equipment jsonb,
  retrieved_at date,
  is_active boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.market_offers TO anon, authenticated;
GRANT ALL ON public.market_offers TO service_role;
ALTER TABLE public.market_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY market_offers_public_read ON public.market_offers FOR SELECT TO anon, authenticated USING (is_active = true AND is_verified = true);
CREATE POLICY market_offers_admin_all ON public.market_offers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_market_offers_updated BEFORE UPDATE ON public.market_offers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed provisional (unverified) market records so the future comparator has data to migrate from
INSERT INTO public.market_benchmark_sources (name, publisher, source_type, notes, is_verified) VALUES
  ('Seed prototip', 'raportsolar.ro', 'seed', 'Repere provizorii importate din prototip; NU sunt verificate.', false);

-- ============================================================
-- recommendation_sessions
-- ============================================================
CREATE TABLE public.recommendation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.recommendation_status NOT NULL DEFAULT 'draft',
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved_lat numeric,
  resolved_lng numeric,
  monthly_consumption_kwh jsonb, -- 12 items
  annual_consumption_kwh numeric,
  scenarios jsonb,
  selected_scenario_id text,
  calculation_version integer,
  assumptions_version integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendation_sessions TO authenticated;
GRANT ALL ON public.recommendation_sessions TO service_role;
ALTER TABLE public.recommendation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY rec_sessions_owner_all ON public.recommendation_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY rec_sessions_admin_read ON public.recommendation_sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_rec_sessions_updated BEFORE UPDATE ON public.recommendation_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- offers, offer_files, offer_extractions, offer_analyses
-- ============================================================
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_method public.offer_source_method NOT NULL,
  status public.offer_status NOT NULL DEFAULT 'draft',
  supplier_name text,
  offer_date date,
  total_price_lei numeric,
  currency text DEFAULT 'RON',
  vat_included boolean,
  system_kwp numeric,
  phase text,
  battery_present boolean,
  manual_inputs jsonb,
  extraction_status public.extraction_status,
  analysis_status public.analysis_status,
  payment_status public.payment_status,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY offers_owner_all ON public.offers FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY offers_admin_read ON public.offers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_offers_updated BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.offer_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  file_size_bytes bigint NOT NULL,
  checksum text,
  uploaded_at timestamptz,
  delete_after timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_files TO authenticated;
GRANT ALL ON public.offer_files TO service_role;
ALTER TABLE public.offer_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY offer_files_owner_all ON public.offer_files FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY offer_files_admin_read ON public.offer_files FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.offer_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.extraction_status NOT NULL DEFAULT 'pending',
  raw_result jsonb,
  normalized_result jsonb,
  field_confidence jsonb,
  field_evidence jsonb,
  model text,
  prompt_version text,
  failure_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_extractions TO authenticated;
GRANT ALL ON public.offer_extractions TO service_role;
ALTER TABLE public.offer_extractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY offer_extractions_owner_all ON public.offer_extractions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY offer_extractions_admin_read ON public.offer_extractions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_offer_extractions_updated BEFORE UPDATE ON public.offer_extractions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.offer_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_session_id uuid REFERENCES public.recommendation_sessions(id) ON DELETE SET NULL,
  overall_score numeric,
  category_scores jsonb,
  free_result jsonb,
  full_report jsonb,
  market_comparison jsonb,
  calculation_version integer,
  scoring_rules_version integer,
  benchmark_dataset_version text,
  status public.analysis_status NOT NULL DEFAULT 'pending',
  is_paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_analyses TO authenticated;
GRANT ALL ON public.offer_analyses TO service_role;
ALTER TABLE public.offer_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY offer_analyses_owner_all ON public.offer_analyses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY offer_analyses_admin_read ON public.offer_analyses FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_offer_analyses_updated BEFORE UPDATE ON public.offer_analyses
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- energy_snapshots
-- ============================================================
CREATE TABLE public.energy_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload jsonb NOT NULL,
  source text NOT NULL DEFAULT 'transelectrica',
  fetched_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.energy_snapshots TO anon, authenticated;
GRANT ALL ON public.energy_snapshots TO service_role;
ALTER TABLE public.energy_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY energy_snapshots_public_read ON public.energy_snapshots FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX idx_energy_snapshots_fetched_at ON public.energy_snapshots (fetched_at DESC);

-- ============================================================
-- pvgis_cache
-- ============================================================
CREATE TABLE public.pvgis_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  kwp numeric NOT NULL,
  tilt numeric NOT NULL,
  aspect numeric NOT NULL,
  loss numeric NOT NULL,
  annual_kwh numeric NOT NULL,
  monthly_kwh jsonb NOT NULL,
  source text NOT NULL DEFAULT 'PVGIS',
  fetched_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pvgis_cache TO anon, authenticated;
GRANT ALL ON public.pvgis_cache TO service_role;
ALTER TABLE public.pvgis_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY pvgis_cache_public_read ON public.pvgis_cache FOR SELECT TO anon, authenticated USING (true);

-- ============================================================
-- contact_messages
-- ============================================================
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  ip_hash text,
  handled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO authenticated;
GRANT SELECT, UPDATE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY contact_owner_insert ON public.contact_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY contact_owner_read ON public.contact_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY contact_admin_all ON public.contact_messages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- app_settings (single-row config)
-- ============================================================
CREATE TABLE public.app_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  report_price_lei numeric NOT NULL DEFAULT 49,
  retention_days integer NOT NULL DEFAULT 90,
  business_name text,
  business_cui text,
  business_email text,
  business_address text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY app_settings_public_read ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY app_settings_admin_write ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.app_settings (id) VALUES (1);
CREATE TRIGGER trg_app_settings_updated BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- rate_limits (per-user per-endpoint per-minute)
-- ============================================================
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  bucket_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 1,
  UNIQUE (user_id, endpoint, bucket_start)
);
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No user-facing policies; service_role only.

-- ============================================================
-- Storage RLS for offer-documents (bucket created via storage_create_bucket)
-- ============================================================
-- Policies work on storage.objects; owner path = {auth.uid}/{offer_id}/{filename}
CREATE POLICY offer_docs_owner_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'offer-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY offer_docs_owner_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'offer-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY offer_docs_owner_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'offer-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY offer_docs_owner_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'offer-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY offer_docs_admin_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'offer-documents' AND public.has_role(auth.uid(), 'admin'));
