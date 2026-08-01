import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertOctagon, Loader2, Pencil } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero, Section } from "@/components/primitives";
import {
  EmptyState,
  ReportConfidence,
  ReportHeader,
  ReportMetric,
  ReportMetricGrid,
  ReportSectionCard,
  ReportShell,
  ReportStrengthsRisks,
  ReportTabs,
} from "@/components/report/ReportPrimitives";
import { getAnalysisById } from "@/lib/payments.functions";

export const Route = createFileRoute("/rezultat-gratuit/$analysisId")({
  head: () => ({ meta: [{ title: "Rezultatul analizei — raportsolar.ro" }, { name: "robots", content: "noindex" }] }),
  component: Page,
  errorComponent: ({ error }) => <ErrorView message={error.message} />,
  notFoundComponent: () => <ErrorView message="Analiza nu a fost găsită." />,
});

type Snapshot = Awaited<ReturnType<typeof getAnalysisById>>;
type FreeResult = { top_strengths?: string[]; top_risks?: string[]; priority_questions?: string[] };
type Market = { lei_per_kwp?: number | null; label?: string | null; band?: { sample_size?: number | null } | null };

function Page() {
  const { analysisId } = useParams({ from: "/rezultat-gratuit/$analysisId" });
  const fetchAnalysis = useServerFn(getAnalysisById);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { fetchAnalysis({ data: { analysisId } }).then(setSnap).catch(e => setErr(e instanceof Error ? e.message : "Nu am putut încărca analiza.")); }, [analysisId, fetchAnalysis]);
  if (err) return <ErrorView message={err} />;
  if (!snap) return <LoadingView />;

  const { analysis, offer, freeConfidence } = snap;
  const free = (analysis.free_result ?? {}) as FreeResult;
  const market = (analysis.market_comparison ?? {}) as Market;
  const score = analysis.overall_score ?? null;
  const price = offer?.total_price_lei ?? null;
  const kwp = offer?.system_kwp ?? null;
  const pricePerKwp = market.lei_per_kwp ?? (price && kwp ? price / kwp : null);
  const battery = offer?.battery_present === true ? "Prezentă — capacitatea trebuie verificată în ofertă" : offer?.battery_present === false ? "Nu este inclusă" : "Statut neclar";
  const questions = Array.isArray(free.priority_questions) ? free.priority_questions.slice(0, 5) : [];

  const tabs = [
    { id: "rezumat", label: "Rezumat", content: <div className="space-y-4"><ReportMetricGrid><ReportMetric label="Preț total" value={money(price)} /><ReportMetric label="Putere instalată" value={kwp ? `${kwp} kWp` : "Indisponibil"} /><ReportMetric label="Scor general" value={typeof score === "number" ? `${score}/100` : "Indisponibil"} /></ReportMetricGrid><ReportStrengthsRisks strengths={free.top_strengths ?? []} risks={free.top_risks ?? []} /><ReportConfidence level={freeConfidence.overall ?? "low"} contradictions={(freeConfidence.contradictions ?? []).filter((x): x is string => typeof x === "string")} /></div> },
    { id: "pret", label: "Preț", content: <div className="space-y-4"><ReportMetricGrid><ReportMetric label="Total" value={money(price)} /><ReportMetric label="Preț per kWp" value={pricePerKwp ? `${Math.round(pricePerKwp).toLocaleString("ro-RO")} lei/kWp` : "Indisponibil"} /><ReportMetric label="Poziționare" value={market.label ?? "Comparație indisponibilă"} /></ReportMetricGrid><ReportSectionCard title="Limitele comparației"><p className="text-sm text-muted-foreground">{market.band?.sample_size ? `Eșantion orientativ: ${market.band.sample_size} oferte comparabile.` : "Dimensiunea eșantionului nu este disponibilă."} Prețul trebuie verificat împreună cu TVA, serviciile incluse, echipamentele și condițiile de montaj.</p></ReportSectionCard></div> },
    { id: "echipamente", label: "Echipamente", content: <div className="space-y-4"><ReportMetricGrid><ReportMetric label="Panouri" value="Detaliile complete nu sunt incluse în previzualizare" /><ReportMetric label="Invertor" value="Detaliile complete nu sunt incluse în previzualizare" /><ReportMetric label="Baterie" value={battery} /></ReportMetricGrid>{freeConfidence.contradictions?.length ? <ReportSectionCard title="Contradicții detectate"><ul className="list-disc space-y-1 pl-5 text-sm">{freeConfidence.contradictions.filter((x): x is string => typeof x === "string").map(x=><li key={x}>{x}</li>)}</ul></ReportSectionCard> : <EmptyState text="Nu au fost detectate contradicții în informațiile disponibile previzualizării." />}</div> },
    { id: "intrebari", label: "Întrebări", content: <ReportSectionCard title="Întrebări pentru instalator">{questions.length ? <ol className="list-decimal space-y-3 pl-5 text-sm">{questions.map(q=><li key={q}>{q}</li>)}</ol> : <EmptyState text="Întrebările detaliate nu sunt disponibile în această previzualizare. Clarifică în scris echipamentele, garanțiile, serviciile și condițiile de plată." />}</ReportSectionCard> },
  ];

  return <SiteLayout><PageHero eyebrow="Rezultatul analizei" title="Previzualizarea ofertei tale" description="O vedere utilă și limitată a scorului, prețului și riscurilor identificate." /><Section className="!py-8 md:!py-14"><div className="mx-auto max-w-6xl"><ReportShell><ReportHeader eyebrow="Analiză gratuită" title={`${offer?.supplier_name ?? "Oferta ta"}${kwp ? ` — ${kwp} kWp` : ""}`} description="Verifică datele extrase și clarifică în scris elementele importante înainte de semnare." score={score} /><ReportTabs tabs={tabs} /><div className="flex flex-wrap items-center justify-between gap-3"><Link to="/corectare/$offerId" params={{ offerId: analysis.offer_id }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold"><Pencil className="h-4 w-4"/>Corectează datele extrase</Link><p className="text-xs italic text-muted-foreground">Analiza este orientativă și nu înlocuiește verificarea tehnică.</p></div></ReportShell></div></Section></SiteLayout>;
}
function money(value: number | null | undefined) { return typeof value === "number" ? `${value.toLocaleString("ro-RO")} lei` : "Indisponibil"; }
function LoadingView() { return <SiteLayout><Section className="!py-20 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin"/><p className="mt-3 text-sm text-muted-foreground">Se încarcă analiza...</p></Section></SiteLayout>; }
function ErrorView({ message }: { message: string }) { return <SiteLayout><Section className="!py-20"><div className="mx-auto max-w-md text-center"><AlertOctagon className="mx-auto h-8 w-8 text-destructive"/><h1 className="mt-5 text-2xl font-bold">Nu am putut afișa analiza</h1><p className="mt-2 text-sm text-muted-foreground">{message}</p></div></Section></SiteLayout>; }
