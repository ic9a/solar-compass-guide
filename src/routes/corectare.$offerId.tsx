// Optional manual correction editor. Never required to obtain the free analysis.
import { createFileRoute, Link, useParams, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ArrowLeft, Save, AlertOctagon } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Card, Section } from "@/components/primitives";
import { getOfferCorrectionData, applyManualCorrection } from "@/lib/analysis.functions";

export const Route = createFileRoute("/corectare/$offerId")({
  head: () => ({
    meta: [
      { title: "Corectează datele extrase — raportsolar.ro" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
  errorComponent: ({ error }) => <Err msg={error.message} />,
  notFoundComponent: () => <Err msg="Oferta nu a fost găsită." />,
});

type Fields = {
  supplier_name: string;
  system_kwp: string;
  panel_brand: string;
  panel_model: string;
  panel_count: string;
  panel_wattage: string;
  inverter_brand: string;
  inverter_model: string;
  inverter_kva: string;
  battery_present: boolean;
  battery_kwh: string;
  total_price_lei: string;
  vat_included: boolean;
  warranty_panels_years: string;
  warranty_inverter_years: string;
  warranty_workmanship_years: string;
  payment_terms: string;
};

const empty: Fields = {
  supplier_name: "",
  system_kwp: "",
  panel_brand: "",
  panel_model: "",
  panel_count: "",
  panel_wattage: "",
  inverter_brand: "",
  inverter_model: "",
  inverter_kva: "",
  battery_present: false,
  battery_kwh: "",
  total_price_lei: "",
  vat_included: false,
  warranty_panels_years: "",
  warranty_inverter_years: "",
  warranty_workmanship_years: "",
  payment_terms: "",
};

function Page() {
  const { offerId } = useParams({ from: "/corectare/$offerId" });
  const fetchCorrection = useServerFn(getOfferCorrectionData);
  const apply = useServerFn(applyManualCorrection);
  const router = useRouter();
  const [form, setForm] = useState<Fields>(empty);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCorrection({ data: { offerId } })
      .then((snap) => {
        const e = (snap.extraction ?? {}) as Record<string, unknown>;
        const w = (e.warranties ?? {}) as Record<string, unknown>;
        setForm({
          supplier_name: str(e.supplier_name),
          system_kwp: num(e.system_kwp),
          panel_brand: str(e.panel_brand),
          panel_model: str(e.panel_model),
          panel_count: num(e.panel_count),
          panel_wattage: num(e.panel_wattage),
          inverter_brand: str(e.inverter_brand),
          inverter_model: str(e.inverter_model),
          inverter_kva: num(e.inverter_kva),
          battery_present: Boolean(e.battery_present),
          battery_kwh: num(e.battery_kwh),
          total_price_lei: num(e.total_price_lei),
          vat_included: Boolean(e.vat_included),
          warranty_panels_years: num(w.panels_years),
          warranty_inverter_years: num(w.inverter_years),
          warranty_workmanship_years: num(w.workmanship_years),
          payment_terms: str(e.payment_terms),
        });
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Nu am putut încărca oferta."))
      .finally(() => setLoading(false));
  }, [offerId, fetchCorrection]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const res = await apply({
        data: {
          offerId,
          corrections: {
            supplier_name: form.supplier_name || null,
            system_kwp: nnum(form.system_kwp),
            panel_brand: form.panel_brand || null,
            panel_model: form.panel_model || null,
            panel_count: nint(form.panel_count),
            panel_wattage: nnum(form.panel_wattage),
            inverter_brand: form.inverter_brand || null,
            inverter_model: form.inverter_model || null,
            inverter_kva: nnum(form.inverter_kva),
            battery_present: form.battery_present,
            battery_kwh: nnum(form.battery_kwh),
            total_price_lei: nnum(form.total_price_lei),
            vat_included: form.vat_included,
            warranties: {
              panels_years: nnum(form.warranty_panels_years),
              inverter_years: nnum(form.warranty_inverter_years),
              workmanship_years: nnum(form.warranty_workmanship_years),
            },
            payment_terms: form.payment_terms || null,
          },
        },
      });
      router.navigate({
        to: "/rezultat-gratuit/$analysisId",
        params: { analysisId: res.analysisId },
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Nu am putut salva corecțiile.");
      setSaving(false);
    }
  }

  if (loading)
    return (
      <SiteLayout>
        <Section className="!py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
        </Section>
      </SiteLayout>
    );
  if (err) return <Err msg={err} />;

  return (
    <SiteLayout>
      <Section className="!py-10">
        <div className="correction-shell max-w-3xl mx-auto">
          <Link
            to="/analiza/$offerId"
            params={{ offerId }}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Înapoi la analiză
          </Link>
          <div className="product-kicker mt-8">Verificare înainte de rezultat</div>
          <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] md:text-5xl">
            Corectează doar ce nu corespunde ofertei
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Editează doar câmpurile pe care extracția automată le-a interpretat greșit. Restul rămân
            neschimbate.
          </p>

          <div className="correction-note" role="note">
            <strong>Datele originale rămân păstrate.</strong>
            <span>Recalculăm analiza numai după ce salvezi modificările.</span>
          </div>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <Card className="correction-section p-5 space-y-3 md:p-7">
              <h2>Ofertă și preț</h2>
              <F
                label="Instalator"
                v={form.supplier_name}
                on={(v) => setForm({ ...form, supplier_name: v })}
              />
              <F
                label="Preț total (lei)"
                v={form.total_price_lei}
                on={(v) => setForm({ ...form, total_price_lei: v })}
                type="number"
              />
              <Check
                label="Preț include TVA"
                v={form.vat_included}
                on={(v) => setForm({ ...form, vat_included: v })}
              />
              <F
                label="Putere sistem (kWp)"
                v={form.system_kwp}
                on={(v) => setForm({ ...form, system_kwp: v })}
                type="number"
              />
            </Card>
            <Card className="correction-section p-5 space-y-3 md:p-7">
              <h2>Panouri</h2>
              <div className="grid grid-cols-2 gap-3">
                <F
                  label="Brand"
                  v={form.panel_brand}
                  on={(v) => setForm({ ...form, panel_brand: v })}
                />
                <F
                  label="Model"
                  v={form.panel_model}
                  on={(v) => setForm({ ...form, panel_model: v })}
                />
                <F
                  label="Număr"
                  v={form.panel_count}
                  on={(v) => setForm({ ...form, panel_count: v })}
                  type="number"
                />
                <F
                  label="Wattage (W)"
                  v={form.panel_wattage}
                  on={(v) => setForm({ ...form, panel_wattage: v })}
                  type="number"
                />
              </div>
            </Card>
            <Card className="correction-section p-5 space-y-3 md:p-7">
              <h2>Invertor</h2>
              <div className="grid grid-cols-2 gap-3">
                <F
                  label="Brand"
                  v={form.inverter_brand}
                  on={(v) => setForm({ ...form, inverter_brand: v })}
                />
                <F
                  label="Model"
                  v={form.inverter_model}
                  on={(v) => setForm({ ...form, inverter_model: v })}
                />
                <F
                  label="Putere (kVA)"
                  v={form.inverter_kva}
                  on={(v) => setForm({ ...form, inverter_kva: v })}
                  type="number"
                />
              </div>
            </Card>
            <Card className="correction-section p-5 space-y-3 md:p-7">
              <h2>Baterie</h2>
              <Check
                label="Sistem cu baterie"
                v={form.battery_present}
                on={(v) => setForm({ ...form, battery_present: v })}
              />
              {form.battery_present && (
                <F
                  label="Capacitate baterie (kWh)"
                  v={form.battery_kwh}
                  on={(v) => setForm({ ...form, battery_kwh: v })}
                  type="number"
                />
              )}
            </Card>
            <Card className="correction-section p-5 space-y-3 md:p-7">
              <h2>Garanții și plată</h2>
              <div className="grid grid-cols-3 gap-3">
                <F
                  label="Panouri"
                  v={form.warranty_panels_years}
                  on={(v) => setForm({ ...form, warranty_panels_years: v })}
                  type="number"
                />
                <F
                  label="Invertor"
                  v={form.warranty_inverter_years}
                  on={(v) => setForm({ ...form, warranty_inverter_years: v })}
                  type="number"
                />
                <F
                  label="Manoperă"
                  v={form.warranty_workmanship_years}
                  on={(v) => setForm({ ...form, warranty_workmanship_years: v })}
                  type="number"
                />
              </div>
              <F
                label="Termeni de plată"
                v={form.payment_terms}
                on={(v) => setForm({ ...form, payment_terms: v })}
              />
            </Card>

            <div className="sticky-action-bar">
              <p>Verifică încă o dată valorile modificate.</p>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Recalculează scorul cu datele corectate
              </button>
            </div>
          </form>
        </div>
      </Section>
    </SiteLayout>
  );
}

function F({
  label,
  v,
  on,
  type = "text",
}: {
  label: string;
  v: string;
  on: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        type={type}
        value={v}
        onChange={(e) => on(e.target.value)}
        className="field-control mt-1 w-full"
      />
    </label>
  );
}
function Check({ label, v, on }: { label: string; v: boolean; on: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={v} onChange={(e) => on(e.target.checked)} />
      {label}
    </label>
  );
}
function Err({ msg }: { msg: string }) {
  return (
    <SiteLayout>
      <Section className="!py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 grid place-items-center text-destructive">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{msg}</p>
        </div>
      </Section>
    </SiteLayout>
  );
}
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function num(v: unknown): string {
  return typeof v === "number" && Number.isFinite(v) ? String(v) : "";
}
function nnum(s: string): number | null {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}
function nint(s: string): number | null {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}
