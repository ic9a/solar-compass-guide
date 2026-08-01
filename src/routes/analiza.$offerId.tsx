// Realtime analysis page. Owner-only (RLS enforced by server fn + realtime).
// Once analysis becomes ready, auto-navigates to /rezultat-gratuit/$analysisId.
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertOctagon } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Section } from "@/components/primitives";
import { useServerFn } from "@tanstack/react-start";
import { getOfferAnalysis, startAnalysis } from "@/lib/analysis.functions";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisJourney } from "@/components/report/AnalysisJourney";

export const Route = createFileRoute("/analiza/$offerId")({
  head: () => ({
    meta: [{ title: "Analiză ofertă — raportsolar.ro" }, { name: "robots", content: "noindex" }],
  }),
  component: Page,
});

type Snapshot = Awaited<ReturnType<typeof getOfferAnalysis>>;

function Page() {
  const { offerId } = useParams({ from: "/analiza/$offerId" });
  const nav = useNavigate();
  const fetchAnalysis = useServerFn(getOfferAnalysis);
  const kickoff = useServerFn(startAnalysis);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const s = await fetchAnalysis({ data: { offerId } });
        if (cancelled) return;
        setSnap(s);
        const needsRun =
          !s.extraction ||
          s.extraction.status === "pending" ||
          (s.offer.status === "uploaded" && !s.analysis);
        if (needsRun && !triggered) {
          setTriggered(true);
          try {
            await kickoff({ data: { offerId } });
            const s2 = await fetchAnalysis({ data: { offerId } });
            if (!cancelled) setSnap(s2);
          } catch (e) {
            if (!cancelled) setErr(e instanceof Error ? e.message : "Analiza a eșuat.");
          }
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Nu am putut încărca analiza.");
      }
    }
    load();

    const channel = supabase
      .channel(`offer-${offerId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "offers", filter: `id=eq.${offerId}` },
        () =>
          fetchAnalysis({ data: { offerId } })
            .then((s) => !cancelled && setSnap(s))
            .catch(() => {}),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "offer_extractions",
          filter: `offer_id=eq.${offerId}`,
        },
        () =>
          fetchAnalysis({ data: { offerId } })
            .then((s) => !cancelled && setSnap(s))
            .catch(() => {}),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "offer_analyses", filter: `offer_id=eq.${offerId}` },
        () =>
          fetchAnalysis({ data: { offerId } })
            .then((s) => !cancelled && setSnap(s))
            .catch(() => {}),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerId]);

  // Auto-navigate to the free-result page once the analysis is ready.
  useEffect(() => {
    if (snap?.analysis?.status === "ready" && snap.analysis.id) {
      nav({
        to: "/rezultat-gratuit/$analysisId",
        params: { analysisId: snap.analysis.id },
        replace: true,
      });
    }
  }, [snap?.analysis?.status, snap?.analysis?.id, nav]);

  if (err) return <ErrorView message={err} />;
  if (!snap) return <LoadingView label="Se pregătește analiza..." />;

  const { offer, extraction } = snap;

  if (offer.status === "failed" || extraction?.status === "failed") {
    return (
      <ErrorView message={extraction?.failure_message ?? "Extracția a eșuat. Încearcă din nou."} />
    );
  }

  const stage = offer.status;
  const label =
    stage === "extracting"
      ? (extraction?.progress_message ?? "Se citește documentul...")
      : stage === "analyzing"
        ? "Se calculează scorul..."
        : stage === "analyzed"
          ? "Se deschide rezultatul..."
          : "Se pregătește analiza...";
  const active = stage === "extracting" ? 0 : stage === "analyzing" ? 2 : 1;
  return <LoadingView label={label} active={active} />;
}

function LoadingView({ label, active = 0 }: { label: string; active?: number }) {
  return (
    <SiteLayout>
      <Section className="analysis-stage !py-12 md:!py-20" aria-live="polite" aria-busy="true">
        <div className="mx-auto max-w-3xl">
          <div className="analysis-document" aria-hidden="true">
            <span />
            <span />
            <span />
            <div>
              <Loader2 />
            </div>
          </div>
          <div className="text-center">
            <div className="product-kicker">Analiză în curs</div>
            <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] md:text-5xl">
              Cităm oferta, punct cu punct
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              {label} Poți lăsa această pagină deschisă; rezultatul apare automat când este gata.
            </p>
          </div>
          <AnalysisJourney active={active} />
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Nu modificăm documentul încărcat. Orice informație neclară va fi marcată pentru
            verificare.
          </p>
        </div>
      </Section>
    </SiteLayout>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <SiteLayout>
      <Section className="!py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 grid place-items-center text-destructive">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Nu am putut finaliza analiza</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <Link
            to="/upload-oferta"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow"
          >
            Încarcă din nou oferta
          </Link>
        </div>
      </Section>
    </SiteLayout>
  );
}
