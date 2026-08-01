import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Section, Card } from "@/components/primitives";
import { useServerFn } from "@tanstack/react-start";
import { listMyAccountHistory } from "@/lib/offers.functions";
import { useAuthSessionContext } from "@/lib/auth/AuthSessionProvider";
import {
  FileText,
  Loader2,
  ArrowRight,
  TriangleAlert,
  RefreshCw,
  ClipboardList,
} from "lucide-react";

export const Route = createFileRoute("/cont/rapoarte")({
  head: () => ({
    meta: [
      { title: "Rapoartele mele — raportsolar.ro" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

type Row = Awaited<ReturnType<typeof listMyAccountHistory>>[number];

function Page() {
  const auth = useAuthSessionContext();
  const load = useServerFn(listMyAccountHistory);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.ready) return;
    load()
      .then(setRows)
      .catch((e) => setErr(e instanceof Error ? e.message : "Nu am putut încărca rapoartele."));
  }, [auth.ready, load]);

  if (auth.loading || !auth.ready) {
    return (
      <SiteLayout>
        <Section className="!py-20">
          <div className="max-w-md mx-auto text-center inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Se pregătește sesiunea...
          </div>
        </Section>
      </SiteLayout>
    );
  }

  const isAnon = auth.isAnonymous;

  return (
    <SiteLayout>
      <Section className="!py-10 md:!py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="product-kicker">Istoricul tău</div>
              <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em] md:text-6xl">Oferte și analize</h1>
              <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
                Revino la documentele încărcate, urmărește procesarea și deschide concluziile fiecărei analize.
              </p>
            </div>
            {isAnon && (
              <Link
                to="/autentificare"
                search={{ next: "/cont/rapoarte" }}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow"
              >
                Salvează contul permanent
              </Link>
            )}
          </div>

          {err && (
            <div role="alert" className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {err}
            </div>
          )}

          {!rows ? (
            <div className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Se încarcă...
            </div>
          ) : rows.length === 0 ? (
            <Card className="mt-8 p-10 text-center">
              <div className="mx-auto h-11 w-11 rounded-xl bg-gradient-brand grid place-items-center text-white mb-3">
                <ClipboardList className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold">Prima ta analiză începe aici</h2>
              <p className="mt-2 text-sm text-muted-foreground">Încarcă o ofertă și raportsolar.ro îți explică ce conține și ce trebuie clarificat.</p>
              <Link
                to="/upload-oferta"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow"
              >
                Încarcă o ofertă <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
          ) : (
            <ul className="mt-8 grid gap-4">
              {rows.map((r) => (
                <OfferRow key={r.offerId} r={r} />
              ))}
            </ul>
          )}
        </div>
      </Section>
    </SiteLayout>
  );
}

function OfferRow({ r }: { r: Row }) {
  const title = r.supplierName ?? r.filename ?? (r.sourceMethod === "manual" ? "Ofertă introdusă manual" : "Ofertă");
  const date = new Date(r.createdAt).toLocaleDateString("ro-RO");

  return (
    <Card className="p-6 transition-shadow hover:shadow-lift">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[color:var(--brand-green)]" />
            <span className="font-semibold truncate">{title}</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Adăugată {date}
            {r.systemKwp ? ` · ${r.systemKwp} kWp` : ""}
            {r.totalPriceLei ? ` · ${r.totalPriceLei.toLocaleString("ro-RO")} lei` : ""}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <StatusPill label="Extracție" value={extractionLabel(r.extractionStatus)} tone={statusTone(r.extractionStatus)} />
            <StatusPill label="Analiză" value={analysisLabel(r.analysisStatus)} tone={statusTone(r.analysisStatus)} />
            {r.overallScore != null && (
              <StatusPill label="Scor" value={`${Math.round(r.overallScore)}/100`} tone="info" />
            )}
            {r.extractionConfidence && r.extractionConfidence !== "high" && (
              <StatusPill label="Încredere" value={r.extractionConfidence === "medium" ? "medie" : "redusă"} tone="warn" />
            )}
          </div>
          {r.extractionError && (
            <div className="mt-2 text-xs text-destructive inline-flex items-center gap-1">
              <TriangleAlert className="h-3 w-3" /> {r.extractionError}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {r.extractionStatus === "failed" || r.offerStatus === "failed" ? (
            <Link
              to="/analiza/$offerId"
              params={{ offerId: r.offerId }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold"
            >
              <RefreshCw className="h-3 w-3" /> Reîncearcă analiza
            </Link>
          ) : r.analysisStatus !== "ready" ? (
            <Link
              to="/analiza/$offerId"
              params={{ offerId: r.offerId }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold"
            >
              <Loader2 className="h-3 w-3 animate-spin" /> Continuă procesarea
            </Link>
          ) : (
            <>
              {r.analysisId && (
                <Link
                  to="/rezultat-gratuit/$analysisId"
                  params={{ analysisId: r.analysisId }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-brand px-3 py-1.5 text-xs font-semibold text-white shadow-glow"
                >
                  Vezi analiza
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function StatusPill({ label, value, tone }: { label: string; value: string; tone: "ok" | "warn" | "info" | "muted" }) {
  const cls =
    tone === "ok"
      ? "border-[color:var(--brand-green)]/40 bg-[color:var(--brand-green)]/10 text-[color:var(--brand-green)]"
      : tone === "warn"
        ? "border-[color:var(--brand-sun)]/40 bg-[color:var(--brand-sun)]/10 text-amber-800"
        : tone === "info"
          ? "border-border bg-muted text-foreground"
          : "border-border bg-transparent text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${cls}`}>
      <span className="opacity-70">{label}:</span> <span className="font-semibold">{value}</span>
    </span>
  );
}

function extractionLabel(s: string | null): string {
  if (!s) return "—";
  if (s === "pending") return "în curs";
  if (s === "success") return "gata";
  if (s === "failed") return "eșuată";
  return s;
}
function analysisLabel(s: string | null): string {
  if (!s) return "—";
  if (s === "ready") return "gata";
  if (s === "pending") return "în curs";
  return s;
}
function statusTone(s: string | null): "ok" | "warn" | "info" | "muted" {
  if (!s) return "muted";
  if (s === "failed") return "warn";
  if (s === "ready" || s === "success") return "ok";
  return "info";
}
