import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Compass,
  LocateFixed,
  Map,
  MousePointer2,
  Satellite,
  Sparkles,
  Sun,
  Zap,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { MonthlyProductionChart } from "@/components/solar/MonthlyProductionChart";
import { SolarExplorerMap } from "@/components/solar/SolarExplorerMap";
import { SolarLocationSearch } from "@/components/solar/SolarLocationSearch";
import { COUNTIES } from "@/data/countyPotential";
import {
  fetchPvgis,
  localPvgisEstimate,
  type Orientation,
  type PvgisResult,
  type Shading,
} from "@/services/pvgisService";
import { reverseGeocodeSolarLocation } from "@/lib/geocoding.functions";
import { createSolarLocation, type SolarLocation } from "@/lib/solarLocation";
import { trackAnalytics } from "@/lib/analytics";

export const Route = createFileRoute("/harta-solara-romania")({
  head: () => ({
    meta: [
      { title: "Harta solară interactivă a României | raportsolar.ro" },
      {
        name: "description",
        content:
          "Alege orice locație din România și estimează producția lunară și anuală a unui sistem fotovoltaic folosind date PVGIS.",
      },
      { property: "og:url", content: "/harta-solara-romania" },
    ],
    links: [{ rel: "canonical", href: "/harta-solara-romania" }],
  }),
  component: SolarMapPage,
});

const DEFAULT_COUNTY = COUNTIES.find((county) => county.code === "B") ?? COUNTIES[0];
const MONTHS = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Noi", "Dec"];

function SolarMapPage() {
  const [location, setLocation] = useState<SolarLocation>(() =>
    createSolarLocation({
      lat: DEFAULT_COUNTY.lat,
      lng: DEFAULT_COUNTY.lng,
      countyCode: DEFAULT_COUNTY.code,
      countyName: DEFAULT_COUNTY.county,
    }),
  );
  const [locationResolution, setLocationResolution] = useState<
    "idle" | "loading" | "resolved" | "failed"
  >("idle");
  const reverseRequestId = useRef(0);
  const pvgisRequestId = useRef(0);
  const locationRef = useRef(location);
  const displayedResultCoordinates = useRef(`${location.lat}:${location.lng}`);
  locationRef.current = location;
  const [systemKwp, setSystemKwp] = useState(5);
  const [countyFallbackOpen, setCountyFallbackOpen] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>("sud");
  const [shading, setShading] = useState<Shading>("deloc");
  const fallback = useMemo(
    () =>
      localPvgisEstimate({
        lat: location.lat,
        lng: location.lng,
        systemKwp,
        orientation,
        shading,
      }),
    [location.lat, location.lng, systemKwp, orientation, shading],
  );
  const [result, setResult] = useState<PvgisResult>(fallback);
  const [resultLocationLabel, setResultLocationLabel] = useState(location.displayLabel);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    trackAnalytics("solar_map_used", { session: "unknown" });
  }, []);
  const locationLabel = location.displayLabel;
  const sourceLabel =
    result.source === "Estimare locală"
      ? "Estimare orientativă"
      : result.source === "cache"
        ? "Date PVGIS actualizate"
        : "Date PVGIS";

  useEffect(() => {
    const currentRequest = ++pvgisRequestId.current;
    const requestedCoordinates = `${location.lat}:${location.lng}`;
    setLoading(true);
    fetchPvgis({
      lat: location.lat,
      lng: location.lng,
      systemKwp,
      orientation,
      shading,
    })
      .then((nextResult) => {
        if (currentRequest !== pvgisRequestId.current) return;
        setResult(nextResult);
        displayedResultCoordinates.current = requestedCoordinates;
        const latestLocation = locationRef.current;
        setResultLocationLabel(
          `${latestLocation.lat}:${latestLocation.lng}` === requestedCoordinates
            ? latestLocation.displayLabel
            : "Locația selectată",
        );
      })
      .finally(() => {
        if (currentRequest === pvgisRequestId.current) setLoading(false);
      });
    return () => {
      if (currentRequest === pvgisRequestId.current) pvgisRequestId.current += 1;
    };
  }, [location.lat, location.lng, systemKwp, orientation, shading]);

  const resolveCoordinates = (nextLocation: SolarLocation) => {
    const currentRequest = ++reverseRequestId.current;
    setLocation(nextLocation);
    setLocationResolution("loading");
    reverseGeocodeSolarLocation({
      data: { lat: nextLocation.lat, lng: nextLocation.lng },
    })
      .then((response) => {
        if (currentRequest !== reverseRequestId.current) return;
        if (response.status === "success") {
          setLocation(response.location);
          if (
            displayedResultCoordinates.current ===
            `${response.location.lat}:${response.location.lng}`
          ) {
            setResultLocationLabel(response.location.displayLabel);
          }
          setLocationResolution("resolved");
        } else {
          setLocationResolution("failed");
        }
      })
      .catch(() => {
        if (currentRequest === reverseRequestId.current) setLocationResolution("failed");
      });
  };

  const selectCounty = (countyCode: string) => {
    const county = COUNTIES.find((item) => item.code === countyCode);
    if (!county) return;
    reverseRequestId.current += 1;
    setLocationResolution("idle");
    setCountyFallbackOpen(true);
    setLocation(
      createSolarLocation({
        lat: county.lat,
        lng: county.lng,
        countyCode: county.code,
        countyName: county.county,
      }),
    );
  };

  const selectSearchResult = (nextLocation: SolarLocation) => {
    reverseRequestId.current += 1;
    setLocationResolution("resolved");
    setCountyFallbackOpen(false);
    setLocation(nextLocation);
    trackAnalytics("locality_selected", { session: "unknown" });
  };

  return (
    <SiteLayout>
      <section className="solar-map-hero core-tool-hero relative overflow-hidden border-b border-border/60 bg-[#f4f7f2]">
        <div className="solar-orb solar-orb--one" />
        <div className="solar-orb solar-orb--two" />
        <div className="relative mx-auto max-w-7xl px-4 pb-7 pt-8 sm:px-6 md:pb-14 md:pt-20 lg:px-8">
          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div>
              <div className="product-kicker">
                <Satellite className="h-3.5 w-3.5" />
                Estimare solară pentru orice locație din România
              </div>
              <h1 className="mt-4 max-w-4xl text-[2.15rem] font-bold leading-[1.03] tracking-[-0.05em] sm:text-4xl md:mt-5 md:text-6xl md:leading-[0.98] lg:text-7xl">
                Află câtă energie poate produce
                <span className="block text-gradient-brand">
                  un sistem fotovoltaic la adresa ta.
                </span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base md:mt-6 md:text-lg md:leading-7">
                Selectează locația, puterea sistemului și caracteristicile acoperișului.
                raportsolar.ro estimează producția lunară și anuală folosind date PVGIS ale Comisiei
                Europene.
              </p>
            </div>
            <div className="hidden rounded-[1.75rem] border border-white/80 bg-white/70 p-5 shadow-soft backdrop-blur-xl md:block">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-green text-white">
                  <MousePointer2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold">
                    Alege direct locul în care va fi instalat sistemul
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Mărește harta, deplaseaz-o și apasă pe poziția cât mai exactă a acoperișului.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f4f7f2] px-4 pb-10 sm:px-6 md:pb-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
            <SolarExplorerMap
              value={location}
              onCoordinateSelect={resolveCoordinates}
              resolving={locationResolution === "loading"}
              resolutionFailed={locationResolution === "failed"}
              onRetryResolution={() => resolveCoordinates(location)}
            />

            <aside
              className="solar-control-panel space-y-4"
              aria-label="Configurarea estimării solare"
            >
              <div className="rounded-[2rem] border border-border/70 bg-white p-5 shadow-soft md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Configurația ta
                    </div>
                    <div className="mt-1 break-words text-lg font-bold md:text-xl">
                      {locationLabel}
                    </div>
                  </div>
                  <div className="live-pill">
                    <span className={loading ? "animate-pulse" : ""} />
                    {loading ? "Se calculează" : sourceLabel}
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  <SolarLocationSearch
                    value={location}
                    onSelect={selectSearchResult}
                    onClear={() => setCountyFallbackOpen(false)}
                  />

                  <div>
                    <button
                      type="button"
                      className="text-sm font-semibold text-brand-green underline underline-offset-4"
                      onClick={() => setCountyFallbackOpen((open) => !open)}
                      aria-expanded={countyFallbackOpen}
                    >
                      Nu găsești localitatea? Alege județul.
                    </button>
                    {countyFallbackOpen && (
                      <label className="mt-3 block">
                        <span className="form-label">Județ — estimare aproximativă</span>
                        <select
                          value={location.countyCode}
                          onChange={(event) => selectCounty(event.target.value)}
                          className="modern-select"
                        >
                          {COUNTIES.map((county) => (
                            <option key={county.code} value={county.code}>
                              {county.county}
                            </option>
                          ))}
                        </select>
                        <span className="mt-2 block text-xs text-muted-foreground">
                          Folosim centrul județului până alegi o localitate exactă.
                        </span>
                      </label>
                    )}
                  </div>

                  <label className="block">
                    <span className="flex items-center justify-between">
                      <span className="form-label">Puterea sistemului</span>
                      <strong className="text-sm text-brand-green">{systemKwp} kWp</strong>
                    </span>
                    <input
                      type="range"
                      min={2}
                      max={15}
                      step={1}
                      value={systemKwp}
                      onChange={(event) => setSystemKwp(Number(event.target.value))}
                      className="solar-range"
                    />
                    <span className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                      <span>2 kWp</span>
                      <span>15 kWp</span>
                    </span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label>
                      <span className="form-label">Orientare</span>
                      <select
                        value={orientation}
                        onChange={(event) => setOrientation(event.target.value as Orientation)}
                        className="modern-select"
                      >
                        <option value="sud">Sud</option>
                        <option value="sud-est">Sud-est</option>
                        <option value="sud-vest">Sud-vest</option>
                        <option value="est-vest">Est–vest</option>
                        <option value="est">Est</option>
                        <option value="vest">Vest</option>
                        <option value="nord">Nord</option>
                      </select>
                    </label>
                    <label>
                      <span className="form-label">Umbrire</span>
                      <select
                        value={shading}
                        onChange={(event) => setShading(event.target.value as Shading)}
                        className="modern-select"
                      >
                        <option value="deloc">Deloc</option>
                        <option value="usoara">Ușoară</option>
                        <option value="moderata">Moderată</option>
                        <option value="semnificativa">Mare</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>

              <ProductionSummary
                result={result}
                systemKwp={systemKwp}
                loading={loading}
                locationLabel={resultLocationLabel}
              />
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-[#102a2b] px-4 py-10 text-white sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-7 md:gap-12 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div>
            <div className="product-kicker product-kicker--dark">
              <BarChart3 className="h-3.5 w-3.5" />
              Profil lunar
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] md:mt-5 md:text-5xl">
              Producția lunară pentru {resultLocationLabel}.
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/65 md:mt-5 md:text-base md:leading-7">
              Producția diferă mult între iarnă și vară. Graficul arată distribuția estimată pentru
              locația și configurația pe care le-ai selectat.
            </p>
            <div className="mt-5 space-y-3 text-sm text-white/75 md:mt-7">
              <DataPoint icon={Map} text={resultLocationLabel} />
              <DataPoint icon={Satellite} text={`Date de producție: ${sourceLabel}`} />
              <DataPoint
                icon={CheckCircle2}
                text={
                  result.annualProductionKwh >= systemKwp * 1200
                    ? "Locația are un potențial solar bun; dimensionarea corectă depinde acum de profilul tău de consum."
                    : "Producția estimată merită comparată atent cu profilul tău de consum și cu gradul real de umbrire."
                }
              />
            </div>
          </div>
          <div aria-busy={loading} aria-live="polite">
            <MonthlyProductionChart values={result.monthlyProductionKwh} />
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-3">
            <MethodCard
              index="01"
              icon={LocateFixed}
              title="Locație exactă"
              text="Calculul folosește coordonatele punctului ales pe hartă, nu doar o medie generală pentru județ."
            />
            <MethodCard
              index="02"
              icon={Compass}
              title="Configurația sistemului"
              text="Puterea instalată, orientarea și gradul de umbrire sunt incluse în estimarea afișată."
            />
            <MethodCard
              index="03"
              icon={Satellite}
              title="Sursă de date transparentă"
              text="PVGIS este sursa principală, iar raportsolar.ro indică limpede atunci când este folosită temporar o estimare locală."
            />
          </div>

          <div className="mt-16 overflow-hidden rounded-[2.25rem] bg-gradient-brand p-8 text-white shadow-lift md:p-14">
            <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white/75">
                  <Sparkles className="h-4 w-4" />
                  Următorul pas
                </div>
                <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-[-0.04em] md:text-5xl">
                  Știi cât ai putea produce. Acum verifică dacă oferta primită se potrivește
                  nevoilor tale.
                </h2>
              </div>
              <Link
                to="/upload-oferta"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#102a2b] shadow-soft transition-transform hover:-translate-y-0.5"
              >
                Verifică oferta
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function ProductionSummary({
  result,
  systemKwp,
  loading,
  locationLabel,
}: {
  result: PvgisResult;
  systemKwp: number;
  loading: boolean;
  locationLabel: string;
}) {
  const annualYield = Math.round(result.annualProductionKwh / systemKwp);
  const bestMonth = result.monthlyProductionKwh.reduce(
    (best, current) => (current.productionKwh > best.productionKwh ? current : best),
    result.monthlyProductionKwh[0],
  );

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-[#102a2b] p-6 text-white shadow-lift">
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand-sun/25 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/80">
          <Sun className="h-4 w-4 text-brand-sun" />
          Producție anuală estimată
        </div>
        <div className="mt-2 text-sm font-semibold text-white/80">{locationLabel}</div>
        <div
          className={`mt-3 text-4xl font-bold tracking-[-0.04em] transition-opacity ${loading ? "opacity-60" : ""}`}
        >
          {result.annualProductionKwh.toLocaleString("ro-RO")}
          <span className="ml-2 text-base font-medium text-white/80">kWh/an</span>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <ResultMetric
            label="Randament"
            value={`${annualYield.toLocaleString("ro-RO")} kWh/kWp`}
          />
          <ResultMetric
            label="Luna de vârf"
            value={`${MONTHS[(bestMonth?.month ?? 1) - 1]} · ${(bestMonth?.productionKwh ?? 0).toLocaleString("ro-RO")} kWh`}
          />
        </div>
        {result.errorMessage && (
          <p className="mt-4 rounded-xl bg-white/8 px-3 py-2 text-xs leading-5 text-white/60">
            PVGIS nu a răspuns momentan. Afișăm o estimare locală orientativă.
          </p>
        )}
      </div>
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/7 p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function DataPoint({ icon: Icon, text }: { icon: typeof Zap; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/8">
        <Icon className="h-4 w-4 text-brand-sun" />
      </div>
      <span>{text}</span>
    </div>
  );
}

function MethodCard({
  index,
  icon: Icon,
  title,
  text,
}: {
  index: string;
  icon: typeof Zap;
  title: string;
  text: string;
}) {
  return (
    <article className="group border-t border-border pt-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-[0.16em] text-muted-foreground">{index}</span>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-green-soft text-brand-green transition-transform group-hover:-translate-y-1">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <h3 className="mt-8 text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </article>
  );
}
