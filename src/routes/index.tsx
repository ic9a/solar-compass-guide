import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BatteryCharging,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  FileCheck2,
  FileSearch,
  Gauge,
  MapPinned,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
  Zap,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { trackAnalytics } from "@/lib/analytics";
import { HOMEPAGE_GUIDE_SLUGS, editorialBySlug } from "@/lib/seo-content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "raportsolar.ro — verifică oferta fotovoltaică înainte să semnezi" },
      {
        name: "description",
        content:
          "Încarcă oferta fotovoltaică și află dacă prețul, echipamentele, bateria, instalarea și garanțiile sunt explicate corect.",
      },
      {
        property: "og:title",
        content: "raportsolar.ro — oferta fotovoltaică, explicată înainte de decizie",
      },
      {
        property: "og:description",
        content:
          "Primești o analiză clară a prețului, componentelor, riscurilor și informațiilor lipsă din oferta instalatorului.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

type AnalysisTab = "pret" | "echipamente" | "instalare";

const analysisDetails: Record<
  AnalysisTab,
  { label: string; score: number; title: string; text: string; note: string; tone: string }
> = {
  pret: {
    label: "Preț",
    score: 82,
    title: "Prețul este plauzibil, dar serviciile incluse trebuie confirmate.",
    text: "Valoarea totală se află într-un interval rezonabil pentru configurația declarată. Oferta nu separă însă clar montajul, dosarul de prosumator și eventualele lucrări suplimentare.",
    note: "2 elemente de clarificat înainte de semnare",
    tone: "#35b779",
  },
  echipamente: {
    label: "Echipamente",
    score: 74,
    title: "Componente bune, dar configurația nu este documentată complet.",
    text: "Modelele principale sunt identificabile, însă lipsesc raportul DC/AC, condițiile de extindere a garanției și confirmarea compatibilității dintre invertor și baterie.",
    note: "3 informații tehnice lipsă",
    tone: "#e6a828",
  },
  instalare: {
    label: "Instalare",
    score: 61,
    title: "Protecțiile și responsabilitățile sunt descrise prea generic.",
    text: "Oferta menționează protecții AC/DC, dar nu precizează modelele, schema de împământare sau cine răspunde pentru adaptarea tabloului electric existent.",
    note: "Risc contractual de verificat",
    tone: "#e77949",
  },
};

function HomePage() {
  useEffect(() => {
    trackAnalytics("homepage_view", { session: "unknown" });
  }, []);

  return (
    <SiteLayout>
      <Hero />
      <TrustStrip />
      <DecisionFlow />
      <InteractiveReport />
      <WhatWeCheck />
      <SecondaryTools />
      <EditorialGuides />
      <Independence />
      <FinalCta />
    </SiteLayout>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#f4f7f1]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-16 h-80 w-80 rounded-full bg-brand-green/10 blur-3xl" />
        <div className="absolute -right-24 top-0 h-96 w-96 rounded-full bg-brand-sun/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 md:pb-24 md:pt-20 lg:px-8">
        <div className="grid items-center gap-8 md:gap-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,.78fr)]">
          <div>
            <div className="product-kicker">
              <Sparkles className="h-3.5 w-3.5" />
              Analiză independentă pentru oferte fotovoltaice
            </div>

            <h1 className="mt-5 max-w-5xl text-[2.65rem] font-bold leading-[1] tracking-[-0.055em] sm:text-6xl sm:leading-[0.96] lg:text-[5.2rem]">
              Ai primit o ofertă.
              <span className="block text-gradient-brand">
                Află ce cumperi, înainte să semnezi.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:mt-7 md:text-xl md:leading-8">
              raportsolar.ro transformă oferta instalatorului într-o explicație clară: dacă prețul
              este corect, ce echipamente primești, ce lipsește și ce trebuie negociat.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row">
              <Link to="/upload-oferta" className="hero-action hero-action--primary !px-6 !py-3.5">
                <Upload className="h-4 w-4" />
                Încarcă oferta
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/exemplu-raport" className="hero-action !px-6 !py-3.5">
                Vezi un raport real
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-foreground/65">
              <TrustPoint text="Fără afiliere la instalatori" />
              <TrustPoint text="Concluzii explicate" />
              <TrustPoint text="Date și criterii verificabile" />
            </div>
          </div>

          <HeroReportCard />
        </div>
      </div>
    </section>
  );
}

function HeroReportCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-8 rounded-full bg-brand-green/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 p-4 shadow-[0_36px_100px_-40px_rgba(16,42,43,.45)] backdrop-blur sm:rounded-[2.35rem] sm:p-5 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Exemplu de rezultat
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.03em]">
              Ofertă sistem 6 kWp + baterie
            </h2>
          </div>
          <div className="rounded-full bg-[#102a2b] px-3 py-1.5 text-xs font-bold text-white">
            78 / 100
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-1.5 sm:mt-7 sm:gap-2">
          <ScorePill label="Preț" value="82" state="Bun" />
          <ScorePill label="Echipamente" value="74" state="De verificat" />
          <ScorePill label="Instalare" value="61" state="Atenție" />
        </div>

        <div className="mt-5 rounded-[1.5rem] bg-[#102a2b] p-5 text-white">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-brand-sun">
            <CircleAlert className="h-4 w-4" />
            Ce trebuie clarificat
          </div>
          <div className="mt-4 space-y-3">
            <Finding text="Modelele protecțiilor AC/DC nu sunt precizate" />
            <Finding text="Garanția bateriei nu indică numărul de cicluri" />
            <Finding text="Dosarul de prosumator nu apare explicit în preț" />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-[#fafbf9] px-4 py-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Concluzie
            </div>
            <div className="mt-1 text-sm font-semibold">
              Oferta poate fi bună după 3 clarificări.
            </div>
          </div>
          <BadgeCheck className="h-6 w-6 text-brand-green" />
        </div>
      </div>
    </div>
  );
}

function TrustStrip() {
  return (
    <section className="border-y border-border/70 bg-white">
      <div className="mx-auto grid max-w-7xl gap-px bg-border/70 sm:grid-cols-3">
        <Metric value="5" label="categorii analizate în fiecare ofertă" />
        <Metric value="42" label="județe acoperite de estimările solare" />
        <Metric value="100%" label="independent față de instalatori" />
      </div>
    </section>
  );
}

function DecisionFlow() {
  const steps = [
    {
      icon: Upload,
      number: "01",
      title: "Încarci oferta",
      text: "PDF, fotografie sau date introduse manual. Nu trebuie să înțelegi termenii tehnici înainte.",
    },
    {
      icon: ScanLine,
      number: "02",
      title: "Noi o desfacem pe componente",
      text: "Identificăm prețul, panourile, invertorul, bateria, protecțiile, serviciile și garanțiile.",
    },
    {
      icon: FileCheck2,
      number: "03",
      title: "Primești decizia explicată",
      text: "Vezi ce este bun, ce lipsește, ce pare scump și ce întrebări trebuie trimise instalatorului.",
    },
  ];

  return (
    <section className="px-4 py-20 sm:px-6 md:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div>
            <div className="product-kicker">
              <ChevronRight className="h-3.5 w-3.5" />
              Cum funcționează
            </div>
            <h2 className="mt-5 text-4xl font-bold tracking-[-0.055em] md:text-5xl">
              Dintr-un PDF greu de înțeles, într-o decizie clară.
            </h2>
            <p className="mt-5 leading-7 text-muted-foreground">
              Nu comparăm doar un preț pe kWp. Analizăm ce primești efectiv și cât de bine este
              documentată oferta.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-[2rem] border border-border bg-[#fafbf9] p-6 md:p-7"
              >
                <div className="flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-green text-white">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold tracking-[0.16em] text-muted-foreground">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-10 text-2xl font-bold tracking-[-0.04em]">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function InteractiveReport() {
  const [active, setActive] = useState<AnalysisTab>("pret");
  const item = useMemo(() => analysisDetails[active], [active]);

  return (
    <section className="overflow-hidden bg-[#102a2b] px-4 py-14 text-white sm:px-6 md:py-28 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[minmax(0,.82fr)_minmax(520px,1.18fr)]">
        <div>
          <div className="product-kicker product-kicker--dark">
            <Gauge className="h-3.5 w-3.5" />
            Raportul nu se oprește la un scor
          </div>
          <h2 className="mt-5 text-3xl font-bold tracking-[-0.05em] md:mt-6 md:text-6xl">
            Vezi concluzia. Înțelegi motivul. Știi ce faci mai departe.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/62">
            Fiecare observație este legată de informația din ofertă, de o regulă de analiză sau de
            un reper de piață.
          </p>
          <Link
            to="/exemplu-raport"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/12"
          >
            Explorează raportul complet
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-[2.25rem] border border-white/10 bg-white/6 p-4 backdrop-blur md:p-7">
          <div className="rounded-[1.65rem] bg-white p-5 text-[#102a2b] md:p-7">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {(Object.keys(analysisDetails) as AnalysisTab[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActive(key)}
                  className={`min-w-0 rounded-xl px-1.5 py-3 text-[11px] font-bold transition-colors sm:px-3 sm:text-xs ${
                    active === key
                      ? "bg-[#102a2b] text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {analysisDetails[key].label}
                </button>
              ))}
            </div>

            <div className="mt-7 grid gap-7 sm:grid-cols-[140px_minmax(0,1fr)]">
              <div
                className="grid aspect-square place-items-center rounded-full p-3"
                style={{
                  background: `conic-gradient(${item.tone} ${item.score * 3.6}deg, #edf0f2 0deg)`,
                }}
              >
                <div className="grid h-full w-full place-items-center rounded-full bg-white text-center">
                  <div>
                    <div className="text-4xl font-bold">{item.score}</div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
                      din 100
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-[-0.03em]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-sun-soft px-3 py-1.5 text-xs font-bold text-[#8d5d00]">
                  <CircleAlert className="h-3.5 w-3.5" />
                  {item.note}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhatWeCheck() {
  const cards = [
    {
      icon: CircleDollarSign,
      title: "Preț și valoare",
      text: "Raportăm costul la putere, baterie, servicii incluse și nivelul pieței.",
    },
    {
      icon: Sun,
      title: "Panouri și invertor",
      text: "Verificăm modelele, puterea, raportul DC/AC și informațiile de compatibilitate.",
    },
    {
      icon: BatteryCharging,
      title: "Baterie",
      text: "Analizăm capacitatea utilă, puterea, garanția, ciclurile și extensibilitatea.",
    },
    {
      icon: ShieldCheck,
      title: "Instalare și protecții",
      text: "Căutăm detalii despre AC/DC, împământare, tablouri și responsabilități.",
    },
    {
      icon: FileSearch,
      title: "Garanții și contract",
      text: "Separăm garanțiile produselor de garanția montajului și a lucrărilor.",
    },
    {
      icon: CircleAlert,
      title: "Lipsuri și contradicții",
      text: "Semnalăm valori incompatibile, formulări vagi și elemente promise, dar neincluse.",
    },
  ];

  return (
    <section className="px-4 py-20 sm:px-6 md:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="product-kicker">
            <FileSearch className="h-3.5 w-3.5" />
            Ce verificăm
          </div>
          <h2 className="mt-5 text-4xl font-bold tracking-[-0.055em] md:text-6xl">
            Oferta este bună doar dacă întregul sistem este bine explicat.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className="group rounded-[1.8rem] border border-border bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-green-soft text-brand-green">
                <card.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-7 text-xl font-bold tracking-[-0.03em]">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecondaryTools() {
  return (
    <section className="bg-[#f4f7f1] px-4 py-20 sm:px-6 md:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="product-kicker">
            <Zap className="h-3.5 w-3.5" />
            Înainte și după ofertă
          </div>
          <h2 className="mt-5 text-4xl font-bold tracking-[-0.055em] md:text-5xl">
            Instrumente care te ajută să ceri oferta potrivită.
          </h2>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <Link
            to="/recomandare-sistem"
            className="group rounded-[2.2rem] bg-white p-7 shadow-soft md:p-9"
          >
            <div className="flex items-start justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-green text-white">
                <Gauge className="h-6 w-6" />
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
            <h3 className="mt-14 text-3xl font-bold tracking-[-0.045em]">
              Află ce sistem s-ar potrivi consumului tău
            </h3>
            <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
              Primești un punct de pornire pentru putere, baterie și producție, înainte să discuți
              cu instalatorii.
            </p>
          </Link>

          <Link
            to="/harta-solara-romania"
            className="group rounded-[2.2rem] bg-[#102a2b] p-7 text-white shadow-lift md:p-9"
          >
            <div className="flex items-start justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-brand-sun">
                <MapPinned className="h-6 w-6" />
              </div>
              <ChevronRight className="h-5 w-5 text-white/45 transition-transform group-hover:translate-x-1" />
            </div>
            <h3 className="mt-14 text-3xl font-bold tracking-[-0.045em]">
              Estimează producția solară pentru locația ta
            </h3>
            <p className="mt-4 max-w-xl leading-7 text-white/62">
              Configurezi sistemul pe hartă și vezi estimarea lunară bazată pe date PVGIS.
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}


function EditorialGuides() {
  return (
    <section aria-labelledby="home-guides-title" className="px-4 py-20 sm:px-6 md:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div>
            <div className="product-kicker">
              <BookOpen className="h-3.5 w-3.5" />
              Biblioteca RaportSolar
            </div>
            <h2 id="home-guides-title" className="mt-5 max-w-4xl text-4xl font-bold tracking-[-0.055em] md:text-6xl">
              Înțelege decizia înainte să compari ofertele.
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
              Ghidurile independente leagă dimensionarea, bateria și verificarea ofertei de instrumentele pe care le poți folosi pentru cazul tău.
            </p>
          </div>
          <Link
            to="/ghid-panouri-fotovoltaice"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-white px-5 py-3 text-sm font-semibold hover:bg-muted"
          >
            Vezi toate cele 18 ghiduri
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {HOMEPAGE_GUIDE_SLUGS.map((slug) => {
            const page = editorialBySlug[slug];
            return (
              <Link
                key={slug}
                data-home-guide-slug={slug}
                to="/$slug"
                params={{ slug }}
                onClick={() =>
                  trackAnalytics("editorial_guide_opened", {
                    session: "unknown",
                    route: "/",
                    guideSlug: page.slug,
                    editorialCategory: page.category,
                    editorialPlacement: "homepage",
                  })
                }
                className="group flex min-h-64 flex-col rounded-[1.8rem] border border-border bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transform-none"
              >
                <span className="text-xs font-bold uppercase tracking-[0.13em] text-[#176247]">{page.eyebrow}</span>
                <h3 className="mt-7 text-2xl font-bold tracking-[-0.035em]">{page.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{page.summary}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-foreground">
                  Citește ghidul
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Independence() {
  return (
    <section className="px-4 py-20 sm:px-6 md:py-28 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
        <div>
          <div className="product-kicker">
            <ShieldCheck className="h-3.5 w-3.5" />
            De partea deciziei tale
          </div>
          <h2 className="mt-5 max-w-4xl text-4xl font-bold tracking-[-0.055em] md:text-6xl">
            Nu vindem panouri și nu distribuim cererea ta către instalatori.
          </h2>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
            Rolul raportsolar.ro este să te ajute să înțelegi oferta pe care ai primit-o și să intri
            în negociere cu întrebările potrivite.
          </p>
        </div>

        <div className="rounded-[2rem] border border-border bg-[#fafbf9] p-7">
          <div className="space-y-5">
            <Promise text="Aceleași criterii pentru fiecare ofertă" />
            <Promise text="Lipsurile scad scorul, chiar dacă prezentarea arată bine" />
            <Promise text="Ipotezele și sursele sunt afișate transparent" />
            <Promise text="Concluziile includ pași concreți de clarificare" />
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#102a2b] p-6 text-white sm:rounded-[2.6rem] sm:p-8 md:p-14">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <div className="text-sm font-bold text-brand-sun">Oferta este deja în inbox?</div>
            <h2 className="mt-3 max-w-4xl text-3xl font-bold tracking-[-0.05em] md:text-6xl">
              Verific-o înainte ca prețul să devină o decizie.
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-white/60">
              Încarcă documentul și vezi ce este clar, ce lipsește și ce merită negociat.
            </p>
          </div>
          <Link
            to="/upload-oferta"
            className="hero-action !border-white !bg-white !px-7 !py-4 !text-[#102a2b]"
          >
            <Upload className="h-4 w-4" />
            Încarcă oferta
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function TrustPoint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-green-soft text-brand-green">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      {text}
    </div>
  );
}

function Finding({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 text-sm leading-6 text-white/72">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-sun" />
      {text}
    </div>
  );
}

function Promise({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-green-soft text-brand-green">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <span className="text-sm font-semibold leading-6">{text}</span>
    </div>
  );
}

function ScorePill({ label, value, state }: { label: string; value: string; state: string }) {
  return (
    <div className="rounded-2xl bg-[#f5f7f4] p-3">
      <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-[-0.04em]">{value}</div>
      <div className="mt-1 text-[10px] font-semibold text-brand-green">{state}</div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white px-6 py-6">
      <div className="text-3xl font-bold tracking-[-0.045em]">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
