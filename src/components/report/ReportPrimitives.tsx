import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreRing } from "@/components/ui-kit/ScoreVisuals";

export function ReportShell({ children }: { children: ReactNode }) {
  return <div className="space-y-5" data-report-shell>{children}</div>;
}

export function ReportHeader({ eyebrow, title, description, score }: { eyebrow: string; title: string; description: string; score?: number | null }) {
  return (
    <header className="overflow-hidden rounded-2xl border border-border/70 bg-gradient-hero shadow-soft">
      <div className="border-l-4 border-[color:var(--brand-green)] p-5 md:p-7">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{eyebrow}</div>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div><h1 className="text-2xl font-bold md:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p></div>
          {typeof score === "number" && <ScoreRing value={score} size={82} label="Scor general" />}
        </div>
      </div>
    </header>
  );
}

export function ReportMetricGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
export function ReportMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft"><div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-2 text-xl font-bold">{value}</div></div>;
}
export function ReportSectionCard({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft md:p-6"><h2 className="text-lg font-bold">{title}</h2><div className="mt-4">{children}</div></section>;
}
export function ReportStrengthsRisks({ strengths, risks }: { strengths: string[]; risks: string[] }) {
  return <div className="grid gap-4 md:grid-cols-2">
    <ReportSectionCard title="Puncte bune">{strengths.length ? <ul className="space-y-2 text-sm">{strengths.map(x=><li key={x} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-green"/>{x}</li>)}</ul> : <EmptyState />}</ReportSectionCard>
    <ReportSectionCard title="De clarificat">{risks.length ? <ul className="space-y-2 text-sm">{risks.map(x=><li key={x} className="flex gap-2"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700"/>{x}</li>)}</ul> : <EmptyState />}</ReportSectionCard>
  </div>;
}
export function ReportConfidence({ level, contradictions = [] }: { level: string; contradictions?: string[] }) {
  const label = level === "high" ? "ridicată" : level === "medium" ? "medie" : "redusă";
  return <ReportSectionCard title="Încrederea în date"><p className="text-sm">Încredere {label}. Verifică în ofertă orice câmp neclar înainte de semnare.</p>{contradictions.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{contradictions.map(x=><li key={x}>{x}</li>)}</ul>}</ReportSectionCard>;
}
export function EmptyState({ text = "Informația nu este disponibilă în datele extrase." }: { text?: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

export type ReportTab = { id: string; label: string; content: ReactNode };
export function ReportTabs({ tabs }: { tabs: ReportTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const contentRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    refs.current[active]?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest", inline: "center" });
    if (!mounted.current) { mounted.current = true; return; }
    contentRef.current?.focus({ preventScroll: true });
  }, [active]);
  return <Tabs value={active} onValueChange={setActive}>
    <div className="report-tab-bar overflow-x-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:px-0">
      <TabsList aria-label="Secțiunile raportului" className="flex h-auto w-max min-w-full gap-1 bg-muted/60 p-1">
        {tabs.map(t=><TabsTrigger key={t.id} ref={node=>{refs.current[t.id]=node;}} value={t.id} className="min-h-10 whitespace-nowrap px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-brand-green">{t.label}</TabsTrigger>)}
      </TabsList>
    </div>
    <div ref={contentRef} tabIndex={-1} className="report-content scroll-mt-[calc(var(--site-header-height)+3.75rem)] outline-none">
      {tabs.map(t=><TabsContent key={t.id} value={t.id} className="mt-4">{t.content}</TabsContent>)}
    </div>
  </Tabs>;
}
