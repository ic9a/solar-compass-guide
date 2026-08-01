import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, AlertTriangle, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Card, PageHero, Section } from "@/components/primitives";
import { useServerFn } from "@tanstack/react-start";
import { submitManualOffer } from "@/lib/analysis.functions";
import { trackAnalytics } from "@/lib/analytics";
import { useAuthSessionContext, ensureAuthAccessToken } from "@/lib/auth/AuthSessionProvider";

export const Route = createFileRoute("/introducere-manuala")({
  head: () => ({
    meta: [
      { title: "Introducere manuală ofertă — raportsolar.ro" },
      {
        name: "description",
        content: "Introdu datele ofertei tale fotovoltaice manual pentru o analiză orientativă.",
      },
      { property: "og:url", content: "/introducere-manuala" },
    ],
    links: [{ rel: "canonical", href: "/introducere-manuala" }],
  }),
  component: Page,
});

const inputCls = "field-control";

function Page() {
  const nav = useNavigate();
  const submit = useServerFn(submitManualOffer);
  const auth = useAuthSessionContext();

  useEffect(() => {
    trackAnalytics("manual_entry_started", { session: "unknown" });
  }, []);

  const [state, setState] = useState({
    supplierName: "",
    systemKwp: "",
    panelCount: "",
    panelWatt: "",
    inverter: "",
    batteryStatus: "unknown" as "none" | "present" | "unknown",
    batteryKwh: "",
    price: "",
    vatIncluded: true,
    warrantyPanels: "",
    warrantyInverter: "",
    warrantyWorkmanship: "",
    inclusions: "",
  });
  const optionalNumber = (value: string) => {
    const normalized = value.trim().replace(",", ".");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const sessionBlocked = !auth.ready;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!state.systemKwp || !state.price) {
      setErr("Puterea sistemului și prețul total sunt obligatorii.");
      return;
    }
    setBusy(true);
    try {
      await ensureAuthAccessToken();
      const res = await submit({
        data: {
          supplierName: state.supplierName || null,
          systemKwp: optionalNumber(state.systemKwp),
          totalPriceLei: optionalNumber(state.price),
          panelCount: optionalNumber(state.panelCount),
          panelWattage: optionalNumber(state.panelWatt),
          inverterBrand: state.inverter || null,
          batteryPresent:
            state.batteryStatus === "none"
              ? false
              : state.batteryStatus === "present"
                ? true
                : null,
          batteryKwh: state.batteryStatus === "present" ? optionalNumber(state.batteryKwh) : null,
          vatIncluded: state.vatIncluded,
          warrantyPanelsYears: optionalNumber(state.warrantyPanels),
          warrantyInverterYears: optionalNumber(state.warrantyInverter),
          warrantyWorkmanshipYears: optionalNumber(state.warrantyWorkmanship),
          includedServices: state.inclusions
            ? state.inclusions
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        },
      });
      nav({ to: "/rezultat-gratuit/$analysisId", params: { analysisId: res.analysisId } });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Nu am putut salva oferta.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteLayout>
      <PageHero
        className="manual-entry-hero core-tool-hero"
        eyebrow="Introducere manuală"
        title="Completează informațiile importante din ofertă."
        description="Nu este nevoie să transcrii tot documentul. Datele despre sistem, preț, echipamente și garanții sunt suficiente pentru prima analiză."
      />
      <Section className="!py-10 md:!py-16">
        <div className="max-w-3xl mx-auto">
          {auth.error && (
            <div
              role="alert"
              className="mt-6 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {auth.error}
            </div>
          )}
          {sessionBlocked && !auth.error && (
            <div className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Se pregătește sesiunea sigură...
            </div>
          )}

          <Card className="p-6 md:p-9">
            <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
              <div className="manual-form-section sm:col-span-2">
                <span>1 din 3</span>
                <h2>Sistem și preț</h2>
                <p>
                  Transcrie valorile așa cum apar în ofertă. Doar puterea și prețul sunt
                  obligatorii.
                </p>
              </div>
              <Label label="Furnizor / instalator (opțional)">
                <input
                  className={inputCls}
                  value={state.supplierName}
                  onChange={(e) => setState((s) => ({ ...s, supplierName: e.target.value }))}
                />
              </Label>
              <Label label="Puterea sistemului (kWp) *">
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  className={inputCls}
                  value={state.systemKwp}
                  placeholder="Ex.: 5"
                  onChange={(e) => setState((s) => ({ ...s, systemKwp: e.target.value }))}
                />
              </Label>
              <Label label="Preț total (lei, cu TVA) *">
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  className={inputCls}
                  value={state.price}
                  placeholder="Ex.: 30000"
                  onChange={(e) => setState((s) => ({ ...s, price: e.target.value }))}
                />
              </Label>
              <Label label="TVA inclus în preț">
                <select
                  className={inputCls}
                  value={state.vatIncluded ? "1" : "0"}
                  onChange={(e) => setState((s) => ({ ...s, vatIncluded: e.target.value === "1" }))}
                >
                  <option value="1">Da</option>
                  <option value="0">Nu</option>
                </select>
              </Label>
              <div className="manual-form-section sm:col-span-2">
                <span>2 din 3</span>
                <h2>Echipamente și baterie</h2>
                <p>Lasă câmpul gol sau alege „Nu știu” când documentul nu oferă informația.</p>
              </div>
              <Label label="Număr panouri">
                <input
                  type="number"
                  className={inputCls}
                  value={state.panelCount}
                  placeholder="Ex.: 10"
                  onChange={(e) => setState((s) => ({ ...s, panelCount: e.target.value }))}
                />
              </Label>
              <Label label="Putere per panou (W)">
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputCls}
                  value={state.panelWatt}
                  placeholder="Ex.: 450"
                  onChange={(e) => setState((s) => ({ ...s, panelWatt: e.target.value }))}
                />
              </Label>
              <Label label="Invertor (brand/model)">
                <input
                  className={inputCls}
                  value={state.inverter}
                  onChange={(e) => setState((s) => ({ ...s, inverter: e.target.value }))}
                />
              </Label>
              <Label label="Baterie">
                <select
                  className={inputCls}
                  value={state.batteryStatus}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      batteryStatus: e.target.value as "none" | "present" | "unknown",
                      batteryKwh: e.target.value === "present" ? s.batteryKwh : "",
                    }))
                  }
                >
                  <option value="unknown">Nu știu</option>
                  <option value="none">Fără baterie</option>
                  <option value="present">Cu baterie</option>
                </select>
              </Label>
              {state.batteryStatus === "present" && (
                <Label label="Capacitate baterie (kWh, opțional)">
                  <input
                    type="text"
                    inputMode="decimal"
                    className={inputCls}
                    value={state.batteryKwh}
                    placeholder="Ex.: 5"
                    onChange={(e) => setState((s) => ({ ...s, batteryKwh: e.target.value }))}
                  />
                </Label>
              )}
              <div className="manual-form-section sm:col-span-2">
                <span>3 din 3</span>
                <h2>Garanții și lucrări incluse</h2>
                <p>Aceste detalii ajută analiza să arate ce trebuie clarificat în scris.</p>
              </div>
              <Label label="Garanție panouri (ani)">
                <input
                  type="number"
                  className={inputCls}
                  value={state.warrantyPanels}
                  placeholder="Ex.: 25"
                  onChange={(e) => setState((s) => ({ ...s, warrantyPanels: e.target.value }))}
                />
              </Label>
              <Label label="Garanție invertor (ani)">
                <input
                  type="number"
                  className={inputCls}
                  value={state.warrantyInverter}
                  placeholder="Ex.: 10"
                  onChange={(e) => setState((s) => ({ ...s, warrantyInverter: e.target.value }))}
                />
              </Label>
              <Label label="Garanție manoperă (ani)">
                <input
                  type="number"
                  className={inputCls}
                  value={state.warrantyWorkmanship}
                  placeholder="Ex.: 2"
                  onChange={(e) => setState((s) => ({ ...s, warrantyWorkmanship: e.target.value }))}
                />
              </Label>
              <Label label="Elemente incluse (separate prin virgulă)">
                <input
                  className={inputCls}
                  placeholder="montaj, protecții AC/DC, dosar prosumator"
                  value={state.inclusions}
                  onChange={(e) => setState((s) => ({ ...s, inclusions: e.target.value }))}
                />
              </Label>
              <section
                className="manual-review sm:col-span-2"
                aria-labelledby="manual-review-title"
              >
                <p className="home-v2-eyebrow">Revizuire înainte de trimitere</p>
                <h2 id="manual-review-title">Verifică datele esențiale</h2>
                <dl>
                  <div>
                    <dt>Putere</dt>
                    <dd>{state.systemKwp ? `${state.systemKwp} kWp` : "De completat"}</dd>
                  </div>
                  <div>
                    <dt>Preț</dt>
                    <dd>{state.price ? `${state.price} lei` : "De completat"}</dd>
                  </div>
                  <div>
                    <dt>Baterie</dt>
                    <dd>
                      {state.batteryStatus === "present"
                        ? `Inclusă${state.batteryKwh ? ` · ${state.batteryKwh} kWh` : ""}`
                        : state.batteryStatus === "none"
                          ? "Nu este inclusă"
                          : "Informație necunoscută"}
                    </dd>
                  </div>
                  <div>
                    <dt>Furnizor</dt>
                    <dd>{state.supplierName || "Nespecificat"}</dd>
                  </div>
                </dl>
                <p>
                  Informațiile lipsă rămân vizibile în analiză; nu sunt completate automat cu
                  afirmații despre ofertă.
                </p>
              </section>
              {err && (
                <div
                  role="alert"
                  className="sm:col-span-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive inline-flex items-start gap-2"
                >
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{err}</span>
                </div>
              )}
              <div className="sm:col-span-2">
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={busy || sessionBlocked}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Vezi analiza gratuită
                </button>
              </div>
            </form>
          </Card>
        </div>
      </Section>
    </SiteLayout>
  );
}

function Label({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="form-label !mb-2">{label}</span>
      {children}
    </label>
  );
}
