import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Battery,
  CheckCircle2,
  ClipboardCopy,
  Copy,
  FileCheck,
  Gauge,
  HelpCircle,
  MinusCircle,
  PanelsTopLeft,
  Plug,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScoreRing, ScoreBar } from "@/components/ui-kit/ScoreVisuals";
import { StatCard } from "@/components/ui-kit/StatCard";
import { Link } from "@tanstack/react-router";
import { ReportShell } from "@/components/report/ReportPrimitives";

type Status = "inclus" | "neclar" | "lipsa";

const STATUS_META: Record<
  Status,
  { label: string; icon: typeof CheckCircle2; color: string; bg: string }
> = {
  inclus: {
    label: "Inclus",
    icon: CheckCircle2,
    color: "var(--brand-green)",
    bg: "color-mix(in oklab, var(--brand-green) 10%, white)",
  },
  neclar: {
    label: "Neclar",
    icon: MinusCircle,
    color: "#854d0e",
    bg: "color-mix(in oklab, var(--brand-sun) 15%, white)",
  },
  lipsa: {
    label: "Lipsă",
    icon: XCircle,
    color: "#991b1b",
    bg: "color-mix(in oklab, var(--danger) 10%, white)",
  },
};

const SCORES = { overall: 78, price: 82, equipment: 75, transparency: 68, risk: 85 };

export function PaidReport() {
  return (
    <ReportShell>
      <Header />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
        <div className="min-w-0 space-y-6">
          <ReportTabs />
          <p className="text-xs text-muted-foreground italic">
            Analiza este orientativă și nu înlocuiește o verificare tehnică la fața locului.
          </p>
        </div>
        <StickySummary />
      </div>
    </ReportShell>
  );
}

function Header() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border/70 shadow-soft">
      <div className="border-l-4 border-[color:var(--brand-green)] p-5 md:p-7 bg-gradient-hero">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Exemplu demonstrativ raportsolar.ro
        </div>
        <h1 className="mt-1 text-2xl md:text-4xl font-bold">Analiză ofertă sistem 5 kWp</h1>
        <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl">
          Oferta se poziționează în zona corectă a pieței pentru un sistem de 5 kWp fără baterie.
          Echipamentele sunt de calitate medie-superioară, dar există elemente contractuale care
          necesită clarificări scrise înainte de semnare.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <VerdictBadge label="Poate fi semnată cu clarificări" tone="sun" />
          <VerdictBadge label="Preț aliniat pieței" tone="green" />
          <VerdictBadge label="3 riscuri contractuale" tone="danger" />
        </div>
      </div>
    </div>
  );
}

function VerdictBadge({ label, tone }: { label: string; tone: "green" | "sun" | "danger" }) {
  const map = {
    green:
      "bg-[color-mix(in_oklab,var(--brand-green)_12%,white)] text-[color:var(--brand-green)] border-[color:var(--brand-green)]/30",
    sun: "bg-[color-mix(in_oklab,var(--brand-sun)_15%,white)] text-amber-800 border-[color:var(--brand-sun)]/30",
    danger:
      "bg-[color-mix(in_oklab,var(--danger)_10%,white)] text-red-800 border-[color:var(--danger)]/30",
  }[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${map}`}
    >
      {label}
    </span>
  );
}

function StickySummary() {
  return (
    <aside className="order-first space-y-3 self-start lg:order-none lg:sticky lg:top-[calc(var(--site-header-height)+1.5rem)] lg:space-y-4">
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft lg:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="h-4 w-4 text-[color:var(--brand-green)]" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Scor final
          </span>
        </div>
        <div className="flex items-center gap-3 lg:gap-4">
          <ScoreRing value={SCORES.overall} size={82} />
          <div>
            <div className="font-bold text-foreground">Bună</div>
            <div className="text-xs text-muted-foreground">Cu clarificări necesare</div>
          </div>
        </div>
        <div className="mt-4 space-y-2.5">
          <ScoreBar label="Preț" value={SCORES.price} />
          <ScoreBar label="Echipamente" value={SCORES.equipment} />
          <ScoreBar label="Transparență" value={SCORES.transparency} />
          <ScoreBar label="Risc" value={SCORES.risk} />
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft space-y-2 text-sm">
        <Row label="Preț" value="44.000 lei" />
        <Row label="Preț per kWp" value="8.800 lei" />
        <Row label="Amortizare" value="~6,5 ani" />
        <Row label="Risc" value="Mediu" />
      </div>

      <Link
        to="/upload-oferta"
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--brand-green)] px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:brightness-110"
      >
        Analizează oferta ta
      </Link>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}

function ReportTabs() {
  const tabs = [
    { id: "rezumat", label: "Rezumat" },
    { id: "pret", label: "Preț" },
    { id: "echipamente", label: "Echipamente" },
    { id: "baterie", label: "Baterie" },
    { id: "instalare", label: "Instalare" },
    { id: "garantii", label: "Garanții" },
    { id: "financiar", label: "Financiar" },
    { id: "intrebari", label: "Întrebări" },
  ];
  const [activeTab, setActiveTab] = useState("rezumat");
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const contentRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    triggerRefs.current[activeTab]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });

    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      contentRef.current?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });
      contentRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeTab]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="report-tab-bar overflow-x-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:px-0 lg:py-0">
        <TabsList
          aria-label="Secțiunile raportului"
          className="flex h-auto w-max min-w-full gap-1 bg-muted/60 p-1"
        >
          {tabs.map((t) => (
            <TabsTrigger
              key={t.id}
              ref={(node) => {
                triggerRefs.current[t.id] = node;
              }}
              value={t.id}
              className="min-h-10 whitespace-nowrap px-3 py-2 text-xs data-[state=active]:bg-white data-[state=active]:text-[color:var(--brand-green)] md:text-sm"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div
        ref={contentRef}
        tabIndex={-1}
        aria-label={`Conținut: ${tabs.find((tab) => tab.id === activeTab)?.label}`}
        className="report-content scroll-mt-[calc(var(--site-header-height)+3.75rem)] outline-none"
      >
        <TabsContent value="rezumat" className="mt-4">
          <TabRezumat />
        </TabsContent>
        <TabsContent value="pret" className="mt-4">
          <TabPret />
        </TabsContent>
        <TabsContent value="echipamente" className="mt-4">
          <TabEchipamente />
        </TabsContent>
        <TabsContent value="baterie" className="mt-4">
          <TabBaterie />
        </TabsContent>
        <TabsContent value="instalare" className="mt-4">
          <TabInstalare />
        </TabsContent>
        <TabsContent value="garantii" className="mt-4">
          <TabGarantii />
        </TabsContent>
        <TabsContent value="financiar" className="mt-4">
          <TabFinanciar />
        </TabsContent>
        <TabsContent value="intrebari" className="mt-4">
          <TabIntrebari />
        </TabsContent>
      </div>
    </Tabs>
  );
}

function CardBox({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-border/70 bg-card p-4 shadow-soft md:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function TabRezumat() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={Wallet} label="Preț ofertă" value="44.000 lei" hint="TVA inclus" />
        <StatCard icon={TrendingUp} label="Amortizare" value="~6,5 ani" accent="sun" />
        <StatCard icon={Zap} label="Producție estimată" value="~5.900 kWh/an" />
      </div>
      <CardBox>
        <Accordion type="multiple" defaultValue={["conteaza"]}>
          <ExplainerItem
            id="conteaza"
            title="Ce arată acest raport"
            body="Comparăm prețul cu piața, verificăm echipamentele, calculăm amortizarea și identificăm riscurile contractuale înainte de semnare."
          />
          <ExplainerItem
            id="pentru-tine"
            title="Ce înseamnă pentru tine"
            body="Oferta este viabilă, dar are câteva neclarități care merită confirmate în scris. Nu semna înainte de a primi clarificările din secțiunea Întrebări."
          />
          <ExplainerItem
            id="urmatorii-pasi"
            title="Următorii pași recomandați"
            body="Cere confirmarea scrisă a protecțiilor AC/DC, garanției manoperă și modelului exact al bateriei. După aceea, oferta se poate semna cu încredere."
          />
        </Accordion>
      </CardBox>
    </div>
  );
}

function TabPret() {
  return (
    <CardBox>
      <div className="grid gap-3 sm:grid-cols-3">
        <PriceCard label="Minim piață" value="34.000 lei" />
        <PriceCard label="Medie piață" value="44.000 lei" highlight />
        <PriceCard label="Maxim piață" value="55.000 lei" />
      </div>
      <div className="mt-5">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Poziție preț</span>
          <span>44.000 lei</span>
        </div>
        <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: "48%",
              background: "linear-gradient(90deg, var(--brand-green), var(--brand-sun))",
            }}
          />
          <div
            className="absolute -top-0.5 h-3.5 w-1 rounded-full bg-foreground"
            style={{ left: "48%" }}
          />
        </div>
      </div>
      <Accordion type="multiple" className="mt-4">
        <ExplainerItem
          id="p1"
          title="De ce contează?"
          body="Un preț sub minim = poate ascunde economii pe manoperă sau echipamente inferioare. Peste maxim = negociabil."
        />
        <ExplainerItem
          id="p2"
          title="Ce înseamnă pentru tine?"
          body="Prețul se aliniază cu media pieței pentru un 5 kWp cu baterie — rezonabil dacă toate elementele sunt confirmate."
        />
      </Accordion>
    </CardBox>
  );
}

function TabEchipamente() {
  return (
    <CardBox>
      <div className="space-y-3">
        <EquipRow icon={PanelsTopLeft} name="Panouri Tier 1 (Longi/Jinko/Trina)" status="inclus" />
        <EquipRow icon={Zap} name="Invertor hibrid, 2 MPPT" status="inclus" />
        <EquipRow icon={Battery} name="Baterie — brand exact nespecificat" status="neclar" />
        <EquipRow icon={Wrench} name="Structură prindere adecvată acoperișului" status="inclus" />
      </div>
    </CardBox>
  );
}

function EquipRow({
  icon: Icon,
  name,
  status,
}: {
  icon: typeof Zap;
  name: string;
  status: Status;
}) {
  const m = STATUS_META[status];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface p-3 min-w-0">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--brand-green)_10%,white)] text-[color:var(--brand-green)]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 text-sm font-medium">{name}</div>
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
        style={{ color: m.color, background: m.bg }}
      >
        <m.icon className="h-3 w-3" /> {m.label}
      </span>
    </div>
  );
}

function TabBaterie() {
  return (
    <CardBox>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--brand-green)_12%,white)] text-[color:var(--brand-green)]">
          <Battery className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-bold">Baterie inclusă — capacitate menționată</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Capacitatea de 5 kWh este menționată, dar brand-ul exact nu apare. Cere datasheet și
            confirmarea în scris.
          </p>
        </div>
      </div>
    </CardBox>
  );
}

function TabInstalare() {
  const items: { name: string; status: Status }[] = [
    { name: "Montaj și punere în funcțiune", status: "inclus" },
    { name: "Structură de prindere", status: "inclus" },
    { name: "Protecții AC/DC", status: "neclar" },
    { name: "Dosar prosumator", status: "neclar" },
    { name: "TVA menționat în preț", status: "inclus" },
    { name: "Transport la locație", status: "inclus" },
    { name: "Garanție manoperă", status: "lipsa" },
    { name: "Documentație ANRE / DTAC", status: "neclar" },
  ];
  return (
    <CardBox>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {items.map((it) => {
          const m = STATUS_META[it.status];
          return (
            <div
              key={it.name}
              className="flex items-center justify-between gap-2 rounded-xl border p-3 min-w-0"
              style={{
                borderColor: `color-mix(in oklab, ${m.color} 30%, transparent)`,
                background: m.bg,
              }}
            >
              <span className="text-sm font-medium min-w-0 break-words">{it.name}</span>
              <span
                className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold shrink-0"
                style={{ color: m.color }}
              >
                <m.icon className="h-3 w-3" /> {m.label}
              </span>
            </div>
          );
        })}
      </div>
    </CardBox>
  );
}

function TabGarantii() {
  const items = [
    { label: "Panouri", value: "12 ani produs / 25 performanță", ok: true },
    { label: "Invertor", value: "10 ani", ok: true },
    { label: "Baterie", value: "10 ani sau 6.000 cicluri", ok: true },
    { label: "Manoperă", value: "Nemenționată", ok: false },
  ];
  return (
    <CardBox>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((g) => (
          <div key={g.label} className="rounded-xl border border-border/60 bg-surface p-3 min-w-0">
            <div className="flex items-center gap-1.5">
              <ShieldCheck
                className="h-3.5 w-3.5"
                style={{ color: g.ok ? "var(--brand-green)" : "#854d0e" }}
              />
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                {g.label}
              </span>
            </div>
            <div
              className={`mt-1 text-sm font-semibold ${g.ok ? "" : "text-amber-800"}`}
            >
              {g.value}
            </div>
          </div>
        ))}
      </div>
      {/* Risks */}
      <div className="mt-5 space-y-2">
        {[
          "Nu este specificat termenul de execuție și penalitățile pentru întârziere.",
          "Dosarul de prosumator este menționat, dar fără costuri clare pentru refacere dacă documentația este respinsă.",
          "Nu există clauză de garanție de bună execuție a lucrării.",
        ].map((r) => (
          <div
            key={r}
            className="flex items-start gap-2 rounded-xl border border-[color:var(--brand-sun)]/30 bg-[color-mix(in_oklab,var(--brand-sun)_8%,white)] p-3"
          >
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-800" />
            <div className="text-sm">{r}</div>
          </div>
        ))}
      </div>
    </CardBox>
  );
}

function TabFinanciar() {
  return (
    <CardBox>
      <div className="grid gap-3 sm:grid-cols-3">
        <PriceCard label="Preț total" value="44.000 lei" />
        <PriceCard label="Economie anuală" value="~4.500 lei" />
        <PriceCard label="Amortizare" value="~6,5 ani" highlight />
      </div>
      <p className="mt-3 text-xs text-muted-foreground italic">
        Estimările depind de consum, amplasament, orientare, umbrire, echipamente și condițiile
        contractuale.
      </p>
    </CardBox>
  );
}

const QUESTIONS: { q: string; cat: string }[] = [
  { q: "Puteți confirma în scris că protecțiile AC/DC sunt incluse în preț?", cat: "Instalare" },
  { q: "Tabloul AC/DC este inclus în ofertă și în prețul total?", cat: "Instalare" },
  { q: "Care este brandul și modelul exact al bateriei?", cat: "Baterie" },
  {
    q: "Ce se întâmplă dacă dosarul de prosumator este respins — cine acoperă refacerea?",
    cat: "Contract",
  },
  { q: "Care este durata garanției pentru manopera efectivă?", cat: "Garanții" },
  { q: "Care este termenul de execuție și penalitățile pentru întârziere?", cat: "Contract" },
];

function TabIntrebari() {
  const [copied, setCopied] = useState<number | null>(null);
  const copy = async (i: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="grid gap-3">
      {QUESTIONS.map((q, i) => (
        <div key={i} className="rounded-xl border border-border/70 bg-card p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--brand-green)_10%,white)] text-[color:var(--brand-green)]">
              <HelpCircle className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {q.cat}
              </div>
              <div className="mt-0.5 text-sm font-medium">{q.q}</div>
            </div>
            <button
              onClick={() => copy(i, q.q)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold hover:bg-muted shrink-0"
            >
              {copied === i ? (
                <ClipboardCopy className="h-3 w-3 text-[color:var(--brand-green)]" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied === i ? "Copiat" : "Copiază"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ExplainerItem({ id, title, body }: { id: string; title: string; body: string }) {
  return (
    <AccordionItem value={id} className="border-border/60">
      <AccordionTrigger className="text-sm font-semibold">{title}</AccordionTrigger>
      <AccordionContent className="text-sm text-muted-foreground">{body}</AccordionContent>
    </AccordionItem>
  );
}

function PriceCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 min-w-0 ${highlight ? "border-[color:var(--brand-green)] bg-[color-mix(in_oklab,var(--brand-green)_8%,white)]" : "border-border/60 bg-surface"}`}
    >
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-lg md:text-xl font-bold break-words">{value}</div>
    </div>
  );
}

// unused-in-file lint hush
void FileCheck;
void Plug;
