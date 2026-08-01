import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Battery,
  BatteryCharging,
  CalendarDays,
  CarFront,
  CheckCircle2,
  ChevronDown,
  Gauge,
  Home,
  Info,
  Moon,
  Receipt,
  ShieldCheck,
  Snowflake,
  Store,
  ThermometerSun,
  Wrench,
  MapPin,
  RefreshCcw,
  Sun,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { MonthlyProductionChart } from "@/components/solar/MonthlyProductionChart";
import { SolarLocationSearch } from "@/components/solar/SolarLocationSearch";
import { PageHero, Section } from "@/components/primitives";
import { StepProgress } from "@/components/ui-kit/StepProgress";
import { VisualChoiceCard } from "@/components/ui-kit/VisualChoiceCard";
import { RoofOrientationIllustration } from "@/components/recommendation/RoofOrientationIllustration";
import { RoofShadingIllustration } from "@/components/recommendation/RoofShadingIllustration";
import { COUNTIES } from "@/data/countyPotential";
import { createSolarLocation } from "@/lib/solarLocation";
import { RECOMMENDATION_ASSUMPTIONS_V2 as A } from "@/lib/recommendation-v2/assumptions";
import { recommendSystemV2 } from "@/lib/recommendation-v2/engine";
import type {
  ConsumptionMode,
  FutureLoad,
  Goal,
  LoadKind,
  LoadStatus,
  RecommendationDraftInput,
  RecommendationInputV2,
  RecommendationResultV2,
  SolarProductionProfile,
} from "@/lib/recommendation-v2/types";
import { fetchPvgis, localPvgisEstimate } from "@/services/pvgisService";
import {
  RECOMMENDATION_DRAFT_KEY,
  restoreRecommendationDraft,
  serializeRecommendationDraft,
} from "@/lib/recommendation-v2/persistence";
import { trackAnalytics } from "@/lib/analytics";

export const Route = createFileRoute("/recomandare-sistem")({
  head: () => ({
    meta: [
      { title: "Recomandare sistem fotovoltaic — raportsolar.ro" },
      {
        name: "description",
        content:
          "Recomandare fotovoltaică transparentă pe baza consumului, locației, acoperișului și datelor PVGIS.",
      },
      { property: "og:url", content: "/recomandare-sistem" },
    ],
    links: [{ rel: "canonical", href: "/recomandare-sistem" }],
  }),
  component: RecommendationPage,
});

type State = RecommendationDraftInput;
type Action =
  { type: "patch"; patch: Partial<State> } | { type: "replace"; state: State } | { type: "reset" };

const initialState: State = {
  schemaVersion: 2,
  loads: [],
  locationPrecision: "missing",
  connectionType: "unknown",
};

function validateRecommendationDraft(state: State): RecommendationInputV2 {
  if (!state.consumptionMode) throw new Error("Alege cum introduci consumul.");
  if (!state.usageProfile) throw new Error("Alege profilul obișnuit de consum.");
  if (state.noLargeLoads === undefined) throw new Error("Spune explicit dacă ai consumatori mari.");
  if (!state.batteryPreference) throw new Error("Alege cum vrei să analizăm bateria.");
  if (!state.location || !state.orientation || !state.shading || !state.buildingType || !state.goal) {
    throw new Error("Completează toate datele obligatorii înainte de calcul.");
  }
  return {
    ...state,
    consumptionMode: state.consumptionMode,
    usageProfile: state.usageProfile,
    noLargeLoads: state.noLargeLoads,
    batteryPreference: state.batteryPreference,
    location: state.location,
    orientation: state.orientation,
    shading: state.shading,
    buildingType: state.buildingType,
    goal: state.goal,
  };
}

function reducer(state: State, action: Action): State {
  if (action.type === "reset") return initialState;
  if (action.type === "replace") return action.state;
  const next = { ...state, ...action.patch };
  if (next.noLargeLoads) next.loads = [];
  return next;
}

const STEPS = [
  { id: 1, label: "Consum" },
  { id: 2, label: "Consumatori" },
  { id: 3, label: "Locație" },
  { id: 4, label: "Acoperiș" },
  { id: 5, label: "Obiectiv" },
  { id: 6, label: "Rezultat" },
];

function RecommendationPage() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string>();
  const [profile, setProfile] = useState<SolarProductionProfile>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendationResultV2>();
  const [hydrated, setHydrated] = useState(false);
  const [restorationComplete, setRestorationComplete] = useState(false);
  const [restored, setRestored] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const patch = (value: Partial<State>) => dispatch({ type: "patch", patch: value });

  useEffect(() => {
    setHydrated(true);
    const draft = restoreRecommendationDraft(
      window.sessionStorage.getItem(RECOMMENDATION_DRAFT_KEY),
    );
    if (draft) {
      dispatch({ type: "replace", state: draft.state });
      setStep(draft.step);
      setRestored(true);
    } else {
      window.sessionStorage.removeItem(RECOMMENDATION_DRAFT_KEY);
    }
    window.history.replaceState(
      { ...window.history.state, recommendationStep: draft?.step ?? 1 },
      "",
    );
    setRestorationComplete(true);
    trackAnalytics("recommendation_started", { session: "unknown" });
  }, []);

  useEffect(() => {
    if (!restorationComplete || step === 6) return;
    window.sessionStorage.setItem(
      RECOMMENDATION_DRAFT_KEY,
      serializeRecommendationDraft(state, step),
    );
  }, [restorationComplete, state, step]);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const previousStep = Number(event.state?.recommendationStep);
      if (Number.isInteger(previousStep) && previousStep >= 1 && previousStep <= 6) {
        setError(undefined);
        setStep(previousStep);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const target = contentRef.current;
      if (!target) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      target.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  const validate = () => {
    if (step === 1) {
      if (!state.consumptionMode) return "Alege cum introduci consumul.";
      const enough =
        (state.consumptionMode === "monthly-kwh" && (state.monthlyConsumptionKwh ?? 0) >= 50) ||
        (state.consumptionMode === "annual-kwh" && (state.annualConsumptionKwh ?? 0) >= 600) ||
        (state.consumptionMode === "bill" && (state.monthlyBillLei ?? 0) >= 50);
      if (!enough) return "Completează un consum realist înainte de a continua.";
      if (!state.usageProfile) return "Alege profilul obișnuit de consum.";
    }
    if (step === 2 && state.noLargeLoads === undefined)
      return "Spune explicit dacă ai consumatori mari.";
    if (step === 2 && !state.noLargeLoads && state.loads.length === 0)
      return "Selectează cel puțin un consumator sau «Nu am consumatori mari».";
    if (step === 3 && !state.location) return "Selectează localitatea exactă sau un județ.";
    if (step === 4 && (!state.orientation || !state.shading || !state.buildingType))
      return "Completează orientarea, umbrirea și tipul clădirii.";
    if (step === 5 && !state.goal) return "Selectează obiectivul principal.";
    if (step === 5 && !state.batteryPreference) return "Alege cum vrei să analizăm bateria.";
    return undefined;
  };

  const goToStep = (nextStep: number, replace = false) => {
    const safeStep = Math.min(6, Math.max(1, nextStep));
    const historyState = { ...window.history.state, recommendationStep: safeStep };
    if (replace) window.history.replaceState(historyState, "");
    else window.history.pushState(historyState, "");
    setStep(safeStep);
  };

  const calculate = async () => {
    if (!state.location) return;
    setLoading(true);
    setError(undefined);
    setResult(undefined);
    const orientationMap = {
      south: "sud",
      "south-east": "sud-est",
      "south-west": "sud-vest",
      east: "est",
      west: "vest",
      north: "nord",
      unknown: "sud",
    } as const;
    const shadingMap = {
      none: "deloc",
      light: "usoara",
      moderate: "moderata",
      severe: "semnificativa",
      unknown: "deloc",
    } as const;
    const requestBase = {
      lat: state.location.lat,
      lng: state.location.lng,
      systemKwp: 1,
      shading: state.shading ? shadingMap[state.shading] : "deloc",
      tilt: state.tiltDeg ?? 30,
    };
    let nextProfile: SolarProductionProfile;
    try {
      const responses =
        state.orientation === "east-west"
          ? await Promise.all([
              fetchPvgis({ ...requestBase, orientation: "est" }),
              fetchPvgis({ ...requestBase, orientation: "vest" }),
            ])
          : [
              await fetchPvgis({
                ...requestBase,
                orientation: state.orientation ? orientationMap[state.orientation as keyof typeof orientationMap] : "sud",
              }),
            ];
      const responseCount = responses.length;
      nextProfile = {
        source: responses.some((response) => response.source === "Estimare locală")
          ? "fallback"
          : responses.some((response) => response.source === "cache")
            ? "cache"
            : "PVGIS",
        normalizedMonthlyKwhPerKwp: responses[0].monthlyProductionKwh.map((_, index) =>
          responses.reduce((total, response) => total + response.monthlyProductionKwh[index].productionKwh, 0) / responseCount,
        ),
        normalizedAnnualKwhPerKwp:
          responses.reduce((total, response) => total + response.annualProductionKwh, 0) / responseCount,
        locationPrecision: state.locationPrecision === "precise" ? "precise" : "county",
        fetchedAt: responses[0].lastFetchedAt,
        fallbackReason: responses.map((response) => response.errorMessage).filter(Boolean).join("; ") || undefined,
        orientationIncluded: state.orientation !== "unknown",
        shadingIncluded: state.shading !== "unknown",
      };
    } catch (pvgisError) {
      const fallback = localPvgisEstimate({
        ...requestBase,
        orientation: state.orientation === "east-west"
          ? "est-vest"
          : state.orientation
            ? orientationMap[state.orientation as keyof typeof orientationMap]
            : "sud",
      });
      nextProfile = {
        source: "fallback",
        normalizedMonthlyKwhPerKwp: fallback.monthlyProductionKwh.map((month) => month.productionKwh),
        normalizedAnnualKwhPerKwp: fallback.annualProductionKwh,
        locationPrecision: state.locationPrecision === "precise" ? "precise" : "county",
        fetchedAt: fallback.lastFetchedAt,
        fallbackReason: pvgisError instanceof Error ? pvgisError.message : "PVGIS indisponibil",
        orientationIncluded: state.orientation !== "unknown",
        shadingIncluded: state.shading !== "unknown",
      };
    }
    setProfile(nextProfile);
    try {
      const recommendation = recommendSystemV2(validateRecommendationDraft(state), nextProfile);
      setResult(recommendation);
      goToStep(6);
      window.sessionStorage.removeItem(RECOMMENDATION_DRAFT_KEY);
      trackAnalytics("recommendation_completed", {
        session: "unknown",
        outcome: "success",
        confidence: recommendation.confidence.level,
        assumptionsVersion: A.version,
      });
    } catch (engineError) {
      setError(
        engineError instanceof Error
          ? engineError.message
          : "Datele introduse nu permit calcularea unei recomandări utile.",
      );
    } finally {
      setLoading(false);
    }
  };

  const next = async () => {
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      contentRef.current?.focus({ preventScroll: true });
      return;
    }
    setError(undefined);
    if (step === 5) await calculate();
    else {
      trackAnalytics("recommendation_step_completed", { session: "unknown", step });
      goToStep(step + 1);
    }
  };

  return (
    <SiteLayout>
      <PageHero
        className="wizard-page-hero"
        eyebrow="Recomandare personalizată"
        title="Găsește sistemul potrivit pentru locuința ta"
        description="Răspunde la câteva întrebări despre consum, locație și acoperiș. Comparăm variantele și îți explicăm recomandarea."
      />
      <Section className="!py-5 md:!py-12">
        <div
          className="mx-auto max-w-6xl"
          data-testid="recommendation-v2-wizard"
          data-ready={hydrated ? "true" : "false"}
        >
          <StepProgress steps={STEPS} current={step} />
          {restored && step < 6 && (
            <div
              role="status"
              className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm"
              data-testid="recommendation-restored"
            >
              <span>Am refăcut recomandarea începută în această sesiune.</span>
              <button
                type="button"
                className="font-semibold underline underline-offset-4"
                onClick={() => {
                  window.sessionStorage.removeItem(RECOMMENDATION_DRAFT_KEY);
                  dispatch({ type: "reset" });
                  goToStep(1, true);
                  setRestored(false);
                }}
              >
                Reia de la început
              </button>
            </div>
          )}
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div
              ref={contentRef}
              tabIndex={-1}
              className="min-w-0 scroll-mt-[var(--sticky-content-offset)] outline-none"
            >
              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800"
                >
                  {error}
                </div>
              )}
              {step === 1 && <ConsumptionStep state={state} patch={patch} />}
              {step === 2 && <LoadsStep state={state} patch={patch} />}
              {step === 3 && <LocationStep state={state} patch={patch} />}
              {step === 4 && <RoofStep state={state} patch={patch} />}
              {step === 5 && <GoalStep state={state} patch={patch} />}
              {step === 6 && result && (
                <ResultView
                  result={result}
                  state={state}
                  profile={profile}
                  onRestart={() => {
                    window.sessionStorage.removeItem(RECOMMENDATION_DRAFT_KEY);
                    dispatch({ type: "reset" });
                    setProfile(undefined);
                    setResult(undefined);
                    goToStep(1, true);
                    setRestored(false);
                  }}
                />
              )}

              <div className="mobile-action-bar mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={step === 1 || loading}
                  onClick={() => goToStep(step - 1)}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" /> Înapoi
                </button>
                {step < 6 && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={next}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[color:var(--brand-green)] px-5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {loading ? "Calculăm…" : step === 5 ? "Calculează recomandarea" : "Continuă"}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-[var(--sticky-content-offset)] rounded-2xl border border-border bg-white p-5 shadow-soft">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Date folosite
                </div>
                <dl className="mt-4 space-y-3 text-sm">
                  <Summary label="Consum" value={consumptionSummary(state)} />
                  <Summary label="Locație" value={state.location?.displayLabel ?? "Necompletată"} />
                  <Summary
                    label="Acoperiș"
                    value={state.orientation ? labelOrientation(state.orientation) : "Necompletat"}
                  />
                  <Summary label="Date solare" value={profile?.source ? `${profile.source} — Comisia Europeană` : "Se vor calcula"} />
                </dl>
                <p className="mt-5 text-xs leading-5 text-muted-foreground">
                  Nu afișăm o recomandare personalizată până când datele minime nu sunt complete.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-soft md:p-7">
      <h2 className="text-xl font-bold md:text-2xl">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

function ConsumptionStep({ state, patch }: StepProps) {
  const estimatedBillKwh =
    state.monthlyBillLei && state.monthlyBillLei > 0
      ? Math.round(state.monthlyBillLei / A.electricity.billConversionLeiPerKwh)
      : undefined;
  const modes = [
    { value: "monthly-kwh" as ConsumptionMode, label: "Consum lunar", description: "Din factura unei luni obișnuite, în kWh.", icon: Activity },
    { value: "annual-kwh" as ConsumptionMode, label: "Consum anual", description: "Cea mai bună bază dacă ai istoricul pe 12 luni.", icon: CalendarDays },
    { value: "bill" as ConsumptionMode, label: "Valoarea facturii", description: "Estimăm consumul și îți arătăm ipoteza folosită.", icon: Receipt },
  ];
  return (
    <Card
      title="Consumul de energie"
      subtitle="Alege informația pe care o ai. Nu folosim valori ascunse."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {modes.map((mode) => (
          <Choice
            key={mode.value}
            selected={state.consumptionMode === mode.value}
            onClick={() => patch({ consumptionMode: mode.value })}
            icon={mode.icon}
            title={mode.label}
            description={mode.description}
          />
        ))}
      </div>
      {state.consumptionMode === "monthly-kwh" && (
        <NumberField
          label="Consum mediu lunar"
          unit="kWh/lună"
          value={state.monthlyConsumptionKwh}
          min={50}
          max={5000}
          onChange={(value) => patch({ monthlyConsumptionKwh: value })}
        />
      )}
      {state.consumptionMode === "annual-kwh" && (
        <NumberField
          label="Consum anual"
          unit="kWh/an"
          value={state.annualConsumptionKwh}
          min={600}
          max={60000}
          onChange={(value) => patch({ annualConsumptionKwh: value })}
        />
      )}
      {state.consumptionMode === "bill" && (
        <div className="space-y-4">
          <NumberField
            label="Factură medie lunară"
            unit="lei/lună"
            value={state.monthlyBillLei}
            min={50}
            max={10000}
            onChange={(value) => patch({ monthlyBillLei: value, editedBillEstimateKwh: undefined })}
          />
          {estimatedBillKwh && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm">
                Estimare la <b>{A.electricity.billConversionLeiPerKwh} lei/kWh</b>: aproximativ{" "}
                <b>{estimatedBillKwh} kWh/lună</b>. Tariful este o ipoteză datată, nu o valoare
                oficială universală.
              </p>
              <div className="mt-3">
                <NumberField
                  label="Corectează estimarea, dacă știi kWh"
                  unit="kWh/lună"
                  value={state.editedBillEstimateKwh}
                  min={50}
                  max={5000}
                  onChange={(value) => patch({ editedBillEstimateKwh: value })}
                />
              </div>
              <p className="mt-3 text-sm font-medium">
                {state.editedBillEstimateKwh
                  ? <>Estimarea inițială a fost {estimatedBillKwh} kWh/lună. Pentru calcul folosim {state.editedBillEstimateKwh} kWh/lună, valoarea corectată de tine.</>
                  : <>Pentru calcul folosim estimarea automată de {estimatedBillKwh} kWh/lună. Câmpul de corecție poate rămâne gol.</>}
              </p>
            </div>
          )}
        </div>
      )}
      <fieldset>
        <legend className="text-sm font-bold">Profilul obișnuit de consum</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Profilul obișnuit de consum">
          {[
            { value: "day" as const, title: "Mai ales ziua", description: "O mare parte din consum apare când panourile produc.", icon: Sun },
            { value: "evening" as const, title: "Mai ales seara", description: "Consumul crește după apus.", icon: Moon },
            { value: "constant" as const, title: "Relativ constant", description: "Consumul este distribuit pe parcursul zilei.", icon: Gauge },
            { value: "commercial" as const, title: "Spațiu comercial", description: "Activitate și consum în principal în timpul zilei.", icon: Store },
          ].map((option) => (
            <Choice
              key={option.value}
              selected={state.usageProfile === option.value}
              onClick={() => patch({ usageProfile: option.value })}
              icon={option.icon}
              title={option.title}
              description={option.description}
            />
          ))}
        </div>
      </fieldset>
      <InfoBox>
        Un istoric pe 12 luni crește precizia rezultatului. Consumul actual și cel viitor rămân calculate separat.
      </InfoBox>
    </Card>
  );
}

const LOADS = [
  { kind: "ev" as LoadKind, label: "Mașină electrică", description: "Include încărcarea actuală sau planificată.", icon: CarFront },
  { kind: "heat-pump" as LoadKind, label: "Pompă de căldură", description: "Poate schimba semnificativ consumul anual.", icon: ThermometerSun },
  { kind: "boiler" as LoadKind, label: "Boiler electric", description: "Apă caldă produsă electric.", icon: BatteryCharging },
  { kind: "air-conditioning" as LoadKind, label: "Aer condiționat", description: "Consum sezonier, în special vara.", icon: Snowflake },
  { kind: "workshop" as LoadKind, label: "Atelier / echipamente mari", description: "Motoare, scule sau utilaje cu consum relevant.", icon: Wrench },
  { kind: "other" as LoadKind, label: "Alt consumator", description: "Un consum important care nu apare mai sus.", icon: Zap },
];

function LoadsStep({ state, patch }: StepProps) {
  const toggle = (kind: LoadKind, label: string) => {
    const exists = state.loads.some((load) => load.kind === kind);
    patch({
      noLargeLoads: false,
      loads: exists
        ? state.loads.filter((load) => load.kind !== kind)
        : [...state.loads, { id: kind, kind, label, status: "included" }],
    });
  };
  const update = (id: string, change: Partial<FutureLoad>) =>
    patch({ loads: state.loads.map((load) => (load.id === id ? { ...load, ...change } : load)) });
  return (
    <Card
      title="Consumatori mari"
      subtitle="Spune dacă sunt deja incluși în consum sau vor fi adăugați."
    >
      <Choice
        selected={state.noLargeLoads ?? false}
        onClick={() => patch({ noLargeLoads: true, loads: [] })}
        icon={Home}
        title="Nu am consumatori mari"
        description="Continuăm doar cu consumul deja declarat."
        multi
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {LOADS.map((load) => (
          <Choice
            key={load.kind}
            selected={state.loads.some((item) => item.kind === load.kind)}
            onClick={() => toggle(load.kind, load.label)}
            icon={load.icon}
            title={load.label}
            description={load.description}
            multi
          />
        ))}
      </div>
      {state.loads.map((load) => (
        <div key={load.id} className="rounded-xl border border-border p-4">
          <h3 className="font-bold">{load.label}</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Situație
              <select
                value={load.status}
                onChange={(event) => update(load.id, { status: event.target.value as LoadStatus })}
                className="mt-2 w-full rounded-lg border border-input bg-white px-3 py-2.5"
              >
                <option value="included">Există și este inclus în consum</option>
                <option value="not-included">Există, dar nu este inclus</option>
                <option value="planned">Planificat pentru viitor</option>
              </select>
            </label>
            {load.status !== "included" && (
              <NumberField
                label="Consum anual cunoscut (opțional)"
                unit="kWh/an"
                value={load.annualKwh}
                min={1}
                max={30000}
                onChange={(value) => update(load.id, { annualKwh: value })}
              />
            )}
          </div>
          {load.kind === "ev" && load.status !== "included" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <NumberField
                label="Kilometri/an"
                unit="km"
                value={load.evKmPerYear ?? 12000}
                min={1000}
                max={100000}
                onChange={(value) => update(load.id, { evKmPerYear: value })}
              />
              <NumberField
                label="Consum EV"
                unit="kWh/100 km"
                value={load.evEfficiencyKwhPer100Km ?? 18}
                min={8}
                max={40}
                onChange={(value) => update(load.id, { evEfficiencyKwhPer100Km: value })}
              />
              <NumberField
                label="Încărcare acasă"
                unit="%"
                value={load.evHomeChargingPercent ?? 80}
                min={0}
                max={100}
                onChange={(value) => update(load.id, { evHomeChargingPercent: value })}
              />
            </div>
          )}
          {load.kind === "heat-pump" && load.status !== "included" && (
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={load.primaryHeating ?? true}
                onChange={(event) => update(load.id, { primaryHeating: event.target.checked })}
              />
              Încălzire principală
            </label>
          )}
        </div>
      ))}
      <InfoBox>
        Un consumator marcat „inclus” nu este adăugat din nou. Valorile implicite pentru EV și pompă
        de căldură sunt editabile și reduc încrederea dacă nu sunt confirmate.
      </InfoBox>
    </Card>
  );
}

function LocationStep({ state, patch }: StepProps) {
  const [countyOpen, setCountyOpen] = useState(state.locationPrecision === "county");
  return (
    <Card
      title="Locația sistemului"
      subtitle="Locația ne ajută să estimăm producția solară specifică zonei tale."
    >
      <SolarLocationSearch
        value={state.locationPrecision === "precise" ? state.location : undefined}
        onSelect={(location) => { patch({ location, locationPrecision: "precise" }); setCountyOpen(false); }}
        onClear={() => patch({ location: undefined, locationPrecision: "missing" })}
      />
      <div>
        <button type="button" className="text-sm font-semibold text-brand-green underline underline-offset-4" onClick={() => setCountyOpen((open) => !open)} aria-expanded={countyOpen}>
          Nu găsești localitatea? Alege județul.
        </button>
        {countyOpen && (
          <label className="mt-3 block">
            <FieldLabel>Județ — estimare provizorie</FieldLabel>
            <select
              aria-label="Județ — estimare provizorie"
              value={state.locationPrecision === "county" ? (state.location?.countyCode ?? "") : ""}
              onChange={(event) => {
                const county = COUNTIES.find((item) => item.code === event.target.value);
                if (!county) return;
                patch({
                  location: createSolarLocation({
                    lat: county.lat,
                    lng: county.lng,
                    countyCode: county.code,
                    countyName: county.county,
                  }),
                  locationPrecision: "county",
                });
              }}
              className="mt-2 w-full rounded-xl border border-input bg-white px-3 py-3"
            >
              <option value="">Alege județul</option>
              {COUNTIES.map((county) => <option key={county.code} value={county.code}>{county.county}</option>)}
            </select>
            <span className="mt-2 block text-xs text-muted-foreground">Estimarea folosește centrul județului și are precizie mai redusă.</span>
          </label>
        )}
      </div>
      {state.location && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
          <div className="flex items-center gap-2 font-bold">
            <MapPin className="h-4 w-4" /> {state.location.displayLabel}
          </div>
          <p className="mt-1 text-muted-foreground">
            {state.locationPrecision === "precise"
              ? "Locație exactă selectată."
              : "Folosim temporar o estimare reprezentativă pentru județ; încrederea rezultatului va fi redusă."}
          </p>
        </div>
      )}
    </Card>
  );
}

function RoofStep({ state, patch }: StepProps) {
  const propertyOptions = [
    { value: "house" as const, title: "Casă", description: "Acoperiș individual, cu acces direct pentru verificări.", icon: Home },
    { value: "apartment" as const, title: "Apartament / acoperiș comun", description: "Necesită acorduri și verificarea dreptului de utilizare.", icon: Store },
    { value: "small-commercial" as const, title: "Spațiu comercial mic", description: "Consum și branșament care trebuie confirmate separat.", icon: Wrench },
  ];
  const orientationOptions = [
    ["south", "Sud", "Producție anuală de regulă favorabilă."],
    ["south-east", "Sud-est", "Mai multă producție în prima parte a zilei."],
    ["south-west", "Sud-vest", "Mai multă producție după-amiaza."],
    ["east-west", "Est–vest", "Producție distribuită pe două versante."],
    ["east", "Est", "Producție concentrată dimineața."],
    ["west", "Vest", "Producție concentrată după-amiaza."],
    ["north", "Nord", "Potențial redus; necesită verificare atentă."],
    ["unknown", "Nu știu", "Nu presupunem o direcție; estimarea va fi prudentă."],
  ] as const;
  const shadingOptions = [
    ["none", "Fără umbrire", "Acoperișul primește soare direct aproape toată ziua."],
    ["light", "Ușoară", "Umbra apare pentru scurt timp, de regulă dimineața sau seara."],
    ["moderate", "Moderată", "O parte a acoperișului este umbrită câteva ore."],
    ["severe", "Severă", "O suprafață importantă rămâne umbrită o mare parte din zi."],
    ["unknown", "Nu știu", "Vom folosi o estimare prudentă și vom reduce nivelul de încredere."],
  ] as const;
  return (
    <Card
      title="Acoperiș și limitări"
      subtitle="Alegem configurația în ordinea în care influențează recomandarea."
    >
      <fieldset>
        <legend className="text-sm font-bold">Tipul proprietății</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Tipul proprietății">
          {propertyOptions.map((option) => (
            <Choice key={option.value} selected={state.buildingType === option.value} onClick={() => patch({ buildingType: option.value })} icon={option.icon} title={option.title} description={option.description} />
          ))}
        </div>
      </fieldset>

      {state.buildingType && (
        <fieldset>
          <legend className="text-sm font-bold">Orientarea principală</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Orientarea principală">
            {orientationOptions.map(([value, title, description]) => (
              <Choice key={value} selected={state.orientation === value} onClick={() => patch({ orientation: value })} illustration={<RoofOrientationIllustration orientation={value} selected={state.orientation === value} />} title={title} description={description} />
            ))}
          </div>
        </fieldset>
      )}

      {state.orientation && (
        <fieldset>
          <legend className="text-sm font-bold">Umbrirea acoperișului</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Umbrirea acoperișului">
            {shadingOptions.map(([value, title, description]) => (
              <Choice key={value} selected={state.shading === value} onClick={() => patch({ shading: value })} illustration={<RoofShadingIllustration shading={value} selected={state.shading === value} />} title={title} description={description} />
            ))}
          </div>
        </fieldset>
      )}

      {state.shading && (
        <fieldset>
          <legend className="text-sm font-bold">Branșament</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Branșament">
            {[
              ["single-phase", "Monofazat"],
              ["three-phase", "Trifazat"],
              ["unknown", "Nu știu"],
            ].map(([value, title]) => (
              <Choice key={value} selected={state.connectionType === value} onClick={() => patch({ connectionType: value as State["connectionType"] })} icon={Zap} title={title} description={value === "unknown" ? "Încrederea rezultatului va fi mai redusă." : "Va fi verificat față de puterea sistemului."} />
            ))}
          </div>
        </fieldset>
      )}

      {state.buildingType === "apartment" && (
        <InfoBox>
          Pentru un acoperiș comun sunt necesare acordurile aplicabile și o verificare tehnică a suprafeței disponibile. Estimarea rămâne preliminară.
        </InfoBox>
      )}

      <details className="rounded-xl border border-border p-4">
        <summary className="cursor-pointer font-bold">Detalii opționale pentru o recomandare mai precisă</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <NumberField label="Înclinație aproximativă" unit="grade" value={state.tiltDeg} min={0} max={70} onChange={(value) => patch({ tiltDeg: value })} />
          <NumberField label="Suprafață utilă" unit="m²" value={state.usableRoofAreaM2} min={1} max={1000} onChange={(value) => patch({ usableRoofAreaM2: value })} />
          <NumberField label="Număr maxim panouri" unit="panouri" value={state.maxPanelCount} min={1} max={200} onChange={(value) => patch({ maxPanelCount: value })} />
        </div>
      </details>
      <InfoBox>
        Dacă suprafața sau numărul de panouri nu sunt cunoscute, recomandarea rămâne provizorie și va cere verificarea acoperișului.
      </InfoBox>
    </Card>
  );
}

function GoalStep({ state, patch }: StepProps) {
  const goals = [
    { value: "bill" as Goal, label: "Factură mai mică", description: "Prioritizăm reducerea costului energiei.", icon: Wallet },
    { value: "payback" as Goal, label: "Amortizare rezonabilă", description: "Echilibrăm investiția și economiile estimate.", icon: TrendingUp },
    { value: "independence" as Goal, label: "Mai multă independență", description: "Reducem dependența de energia din rețea.", icon: Sun },
    { value: "backup" as Goal, label: "Backup la întreruperi", description: "Analizăm autonomia pentru circuitele esențiale.", icon: ShieldCheck },
    { value: "ev" as Goal, label: "Pregătire pentru mașină electrică", description: "Luăm în calcul încărcarea viitoare acasă.", icon: CarFront },
  ];
  return (
    <Card
      title="Obiectiv și baterie"
      subtitle="Alegerea ta ne ajută să prioritizăm costul, amortizarea, autonomia sau backup-ul."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {goals.map((goal) => (
          <Choice
            key={goal.value}
            selected={state.goal === goal.value}
            onClick={() => patch({ goal: goal.value })}
            icon={goal.icon}
            title={goal.label}
            description={goal.description}
          />
        ))}
      </div>
      <fieldset>
        <legend className="text-sm font-bold">Cum analizăm bateria?</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Scenariu baterie">
          {[
            { value: "compare" as const, title: "Compară ambele variante", description: "Vezi separat investiția și amortizarea cu și fără baterie.", icon: Gauge },
            { value: "none" as const, title: "Fără baterie", description: "Investiție inițială mai mică și, de regulă, amortizare mai rapidă.", icon: Sun },
            { value: "practical" as const, title: "Pentru autoconsum", description: "Mută o parte din surplus către seară, dar crește investiția.", icon: BatteryCharging },
            { value: "backup" as const, title: "Pentru backup", description: "Păstrează circuite esențiale alimentate în timpul unei pene de curent.", icon: ShieldCheck },
          ].map((option) => (
            <Choice key={option.value} selected={state.batteryPreference === option.value} onClick={() => patch({ batteryPreference: option.value })} icon={option.icon} title={option.title} description={option.description} />
          ))}
        </div>
      </fieldset>
      {state.batteryPreference === "backup" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label="Putere simultană esențială"
            unit="kW"
            value={state.backupEssentialLoadKw}
            min={0.1}
            max={20}
            onChange={(value) => patch({ backupEssentialLoadKw: value })}
          />
          <NumberField
            label="Autonomie dorită"
            unit="ore"
            value={state.backupHours}
            min={1}
            max={48}
            onChange={(value) => patch({ backupHours: value })}
          />
        </div>
      )}
      <InfoBox>
        Un invertor hibrid nu menține automat întreaga locuință alimentată în timpul unei pene de curent. Pentru funcția de backup sunt necesare o ieșire EPS compatibilă, o baterie dimensionată corect și circuite esențiale dedicate.
      </InfoBox>
    </Card>
  );
}

function ResultView({
  result,
  state,
  profile,
  onRestart,
}: {
  result: RecommendationResultV2;
  state: State;
  profile?: SolarProductionProfile;
  onRestart: () => void;
}) {
  const p = result.preferred;
  const confidence =
    result.confidence.level === "high"
      ? "bună"
      : result.confidence.level === "medium"
        ? "medie"
        : "redusă";
  const money = (range: { min: number; max: number }) =>
    `${Math.round(range.min / 1000)}–${Math.round(range.max / 1000)} mii lei`;
  return (
    <div className="space-y-5" data-testid="recommendation-v2-result">
      <section className="rounded-2xl border border-green-200 bg-gradient-hero p-5 shadow-soft md:p-7">
        <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--brand-green)]">
          Recomandarea ta orientativă
        </div>
        <h2 className="mt-3 text-3xl font-black md:text-5xl">
          {p.capacityKwp} kWp
        </h2>
        <p className="mt-2 text-lg font-bold">
          Recomandarea principală · aproximativ {p.panelCount} panouri
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric
            icon={Gauge}
            label="Precizia estimării"
            value={`${confidence} (${result.confidence.score}/100)`}
          />
          <Metric
            icon={Sun}
            label="Producție estimată"
            value={`${p.annualProductionKwh.toLocaleString("ro-RO")} kWh/an`}
          />
          <Metric icon={Wallet} label="Investiție de bază" value={`${p.economics.base.investmentLei.toLocaleString("ro-RO")} lei`} />
          <Metric
            icon={TrendingUp}
            label="Economie anuală de bază"
            value={`${p.economics.base.annualSavingsLei.toLocaleString("ro-RO")} lei`}
          />
          <Metric
            icon={Zap}
            label="Amortizare simplă estimată"
            value={`aprox. ${p.economics.base.paybackYears.toLocaleString("ro-RO")} ani`}
          />
          <Metric
            icon={Battery}
            label="Baterie"
            value={
              state.batteryPreference === "compare"
                ? "Comparăm ambele variante"
                : p.battery.kind === "none"
                  ? "Fără baterie"
                  : `${p.battery.usableCapacityKwh.min}–${p.battery.usableCapacityKwh.max} kWh utili`
            }
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Intervale și incertitudini">
        <ResultDetails title="Sensibilitatea producției">
          <Summary label="Estimare centrală" value={`${p.annualProductionKwh.toLocaleString("ro-RO")} kWh/an`} />
          <Summary label="Interval orientativ" value={`${result.uncertainty.productionKwh.min.toLocaleString("ro-RO")}–${result.uncertainty.productionKwh.max.toLocaleString("ro-RO")} kWh/an`} />
          <Summary label="Poate varia din cauza" value={result.uncertainty.productionDrivers.join(", ")} />
        </ResultDetails>
        <ResultDetails title="Intervalul costului de piață">
          <Summary label="Scenariu central" value={`${p.economics.base.investmentLei.toLocaleString("ro-RO")} lei`} />
          <Summary label="Interval realist" value={money(result.uncertainty.marketCostLei)} />
          <Summary label="Poate varia din cauza" value="echipamentelor, montajului și serviciilor incluse" />
        </ResultDetails>
        <ResultDetails title="Sensibilitatea economică">
          <Summary label="Amortizare centrală" value={`${p.economics.base.paybackYears} ani`} />
          <Summary label="Scenarii" value={`${result.uncertainty.economicPaybackYears.min}–${result.uncertainty.economicPaybackYears.max} ani`} />
          <Summary label="Poate varia din cauza" value="tarifelor și orelor de autoconsum" />
        </ResultDetails>
      </section>

      {state.batteryPreference === "compare" && (
        <section className="rounded-2xl border border-border bg-white p-5 md:p-6" data-testid="battery-comparison">
          <h3 className="text-xl font-bold">Comparație cu și fără baterie</h3>
          <p className="mt-2 text-sm text-muted-foreground">Scenariu financiar de bază: fără baterie. Capacitatea fotovoltaică rămâne {p.capacityKwp} kWp; bateria schimbă fluxul energiei și economia, nu producția panourilor.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[
              ["Fără baterie", p.scenarios.withoutBattery],
              ["Cu baterie practică", p.scenarios.withBattery],
            ].map(([label, scenario]) => {
              const item = scenario as typeof p.scenarios.withoutBattery;
              const other = item.kind === "none" ? p.scenarios.withBattery : p.scenarios.withoutBattery;
              const badge =
                item.economics.base.paybackYears < other.economics.base.paybackYears
                  ? "Amortizare mai rapidă"
                  : item.flow.gridImportKwh < other.flow.gridImportKwh
                    ? "Autoconsum mai mare"
                    : "Investiție mai mică";
              return (
                <div key={label as string} className="rounded-xl border border-border p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-brand-green">{badge}</div>
                  <h4 className="mt-2 font-bold">{label as string}</h4>
                  <dl className="mt-3 space-y-2 text-sm">
                    <Summary label="Investiție" value={money(item.investmentLei)} />
                    <Summary label="Economii/an" value={`${item.annualSavingsLei.min.toLocaleString("ro-RO")}–${item.annualSavingsLei.max.toLocaleString("ro-RO")} lei`} />
                    <Summary label="Amortizare simplă" value={`${item.paybackYears.min}–${item.paybackYears.max} ani`} />
                    <Summary label="Backup" value={item.kind === "none" ? "Nu" : "Doar cu EPS și circuite dedicate"} />
                  </dl>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-white p-5 md:p-6">
        <h3 className="text-xl font-bold">Concluzie și motivare</h3>
        <ul className="mt-4 space-y-2 text-sm">
          {result.reasons.map((reason) => (
            <li key={reason} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--brand-green)]" />
              {reason}
            </li>
          ))}
        </ul>
      </section>

      <details className="rounded-2xl border border-border bg-white p-5">
        <summary className="flex cursor-pointer items-center justify-between font-bold">
          Producție și consum lunar <ChevronDown className="h-4 w-4" />
        </summary>
        <div className="mt-5 rounded-2xl bg-[#102b23] p-3 md:p-6">
          <MonthlyProductionChart
            values={p.monthlyProductionKwh.map((productionKwh, index) => ({
              month: index + 1,
              productionKwh,
            }))}
          />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Consum proiectat: {result.consumption.projectedAnnualKwh.toLocaleString("ro-RO")} kWh/an,
          din care {result.consumption.futureAnnualKwh.toLocaleString("ro-RO")} kWh/an adăugați
          pentru consumatori viitori sau neincluși.
        </p>
      </details>

      <section className="grid gap-4 md:grid-cols-2">
        <ResultDetails title="Fluxuri de energie">
          <Summary
            label="Autoconsum direct"
            value={`${p.flow.directSelfConsumedKwh.toLocaleString("ro-RO")} kWh`}
          />
          <Summary
            label="Energie prin baterie"
            value={`${p.flow.batteryDischargeKwh.toLocaleString("ro-RO")} kWh`}
          />
          <Summary label="Export" value={`${p.flow.exportedKwh.toLocaleString("ro-RO")} kWh`} />
          <Summary
            label="Import rămas"
            value={`${p.flow.gridImportKwh.toLocaleString("ro-RO")} kWh`}
          />
        </ResultDetails>
        <ResultDetails title="Alternative comparate">
          <Summary
            label="Mai mică"
            value={
              result.smaller
                ? `${result.smaller.capacityKwp} kWp · ${money(result.smaller.investmentLei)}`
                : "Nu există"
            }
          />
          <Summary label="Preferată" value={`${p.capacityKwp} kWp · ${money(p.investmentLei)}`} />
          <Summary
            label="Mai mare"
            value={
              result.larger
                ? `${result.larger.capacityKwp} kWp · ${money(result.larger.investmentLei)}`
                : "Nu este justificată"
            }
          />
        </ResultDetails>
      </section>

      {(result.warnings.length > 0 || result.confidence.improvements.length > 0) && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="flex items-center gap-2 font-bold">
            <AlertTriangle className="h-5 w-5" /> Ce poate îmbunătăți estimarea
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {[...result.warnings, ...result.confidence.improvements].map((warning) => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </section>
      )}

      <details className="rounded-2xl border border-border bg-white p-5">
        <summary className="cursor-pointer font-bold">Cum am calculat</summary>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <p>
            Versiune model: <b>{result.assumptionsVersion}</b> · benchmark: <b>{result.benchmarkVersion}</b>
          </p>
          <p>
            Locație: <b>{state.location?.displayLabel}</b> · precizie{" "}
            {result.locationPrecision === "precise" ? "exactă" : "județ"}
          </p>
          <p>
            Date solare: <b>{result.productionSource} — Comisia Europeană</b>
            {profile?.fallbackReason ? ` — ${profile.fallbackReason}` : ""}
          </p>
          <p>Calculat la: {new Date(result.calculatedAt).toLocaleString("ro-RO")}</p>
          <p>Prețurile sunt intervale orientative, nu oferte. Amortizarea simplă nu include finanțare, rată de actualizare, schimbări viitoare de tarif, mentenanță sau înlocuiri. Rezultatul nu este proiect tehnic.</p>
        </div>
      </details>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border bg-white px-5 font-semibold"
        >
          <RefreshCcw className="h-4 w-4" /> Reia de la început
        </button>
        <Link
          to="/upload-oferta"
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[color:var(--brand-green)] px-5 font-semibold text-white"
        >
          Verifică o ofertă reală <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

type StepProps = { state: State; patch: (patch: Partial<State>) => void };
function Choice({
  selected,
  onClick,
  icon = Home,
  illustration,
  title,
  description,
  multi = false,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: typeof Home;
  illustration?: React.ReactNode;
  title?: string;
  description?: string;
  multi?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <VisualChoiceCard
      selected={selected}
      onClick={onClick}
      icon={illustration ? undefined : icon}
      illustration={illustration}
      title={title ?? String(children)}
      description={description}
      multi={multi}
    />
  );
}
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-bold">{children}</span>;
}
function NumberField({
  label,
  unit,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  unit: string;
  value?: number;
  min: number;
  max: number;
  onChange: (value?: number) => void;
}) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          value={value ?? ""}
          min={min}
          max={max}
          onChange={(event) =>
            onChange(event.target.value ? Number(event.target.value) : undefined)
          }
          className="min-w-0 flex-1 rounded-xl border border-input bg-white px-3 py-3 font-normal"
        />
        <span className="shrink-0 text-xs font-normal text-muted-foreground">{unit}</span>
      </div>
    </label>
  );
}
function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-input bg-white px-3 py-3 font-normal"
      >
        {children}
      </select>
    </label>
  );
}
function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-xl bg-muted p-4 text-sm leading-6">
      <Info className="mt-1 h-4 w-4 shrink-0 text-[color:var(--brand-green)]" />
      <p>{children}</p>
    </div>
  );
}
function Metric({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/80 p-4">
      <Icon className="h-4 w-4 text-[color:var(--brand-green)]" />
      <div className="mt-2 text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-bold">{value}</div>
    </div>
  );
}
function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
function ResultDetails({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5">
      <h3 className="font-bold">{title}</h3>
      <dl className="mt-4 space-y-3 text-sm">{children}</dl>
    </section>
  );
}
function consumptionSummary(state: State) {
  if (state.consumptionMode === "monthly-kwh" && state.monthlyConsumptionKwh)
    return `${state.monthlyConsumptionKwh} kWh/lună`;
  if (state.consumptionMode === "annual-kwh" && state.annualConsumptionKwh)
    return `${state.annualConsumptionKwh} kWh/an`;
  if (state.consumptionMode === "bill" && state.monthlyBillLei)
    return `${state.monthlyBillLei} lei/lună (estimat)`;
  return "Necompletat";
}
function labelOrientation(value: NonNullable<State["orientation"]>) {
  return {
    south: "Sud",
    "south-east": "Sud-est",
    "south-west": "Sud-vest",
    "east-west": "Est–vest",
    east: "Est",
    west: "Vest",
    north: "Nord",
    unknown: "Nu știu",
  }[value];
}
