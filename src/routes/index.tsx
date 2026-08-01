import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  ArrowRight,
  BarChart3,
  BatteryCharging,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  FileSearch,
  Gauge,
  Home,
  Layers3,
  MapPinned,
  PanelTop,
  Route as RouteIcon,
  ShieldCheck,
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
      { title: "raportsolar.ro — recomandare și analiză pentru sistemul tău fotovoltaic" },
      {
        name: "description",
        content:
          "Află ce sistem fotovoltaic se potrivește locuinței tale sau verifică oferta primită, cu ipoteze explicate și estimări bazate pe date.",
      },
      {
        property: "og:title",
        content: "RaportSolar — o decizie fotovoltaică explicată pentru locuința ta",
      },
      {
        property: "og:description",
        content:
          "Recomandare bazată pe consum, locuință și obiective sau analiză clară pentru oferta pe care ai primit-o.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

function HomePage() {
  useEffect(() => {
    trackAnalytics("homepage_view", { session: "unknown" });
  }, []);

  return (
    <SiteLayout>
      <Hero />
      <MainPaths />
      <HowItWorks />
      <Independence />
      <RecommendationPreview />
      <SolarMap />
      <EditorialGuides />
      <FinalCta />
    </SiteLayout>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#f4f7f1]">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-40 top-24 h-80 w-80 rounded-full bg-brand-green/10 blur-3xl" />
        <div className="absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-brand-sun/16 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 md:pb-24 md:pt-20 lg:grid-cols-[minmax(0,1.02fr)_minmax(25rem,.78fr)] lg:px-8">
        <div>
          <div className="product-kicker">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Instrument independent pentru decizia ta fotovoltaică
          </div>
          <h1 className="mt-5 max-w-4xl text-[2.65rem] font-bold leading-[1.02] tracking-[-0.055em] sm:text-6xl sm:leading-[0.98] lg:text-[4.75rem]">
            Află ce sistem fotovoltaic se potrivește
            <span className="block text-gradient-brand">locuinței tale.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg md:text-xl md:leading-8">
            RaportSolar folosește consumul, locuința și obiectivele tale pentru o recomandare
            explicată. Dacă ai deja o ofertă, verifică prețul, echipamentele și informațiile care
            lipsesc înainte să decizi.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/recomandare-sistem"
              onClick={() =>
                trackAnalytics("homepage_primary_cta_clicked", {
                  session: "unknown",
                  destinationTool: "recommendation",
                })
              }
              className="hero-action hero-action--primary !px-6 !py-3.5"
            >
              Începe recomandarea
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/upload-oferta"
              onClick={() =>
                trackAnalytics("homepage_secondary_cta_clicked", {
                  session: "unknown",
                  destinationTool: "offer_analysis",
                })
              }
              className="hero-action !px-6 !py-3.5"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Analizează o ofertă
            </Link>
          </div>

          <ul className="mt-8 grid max-w-2xl gap-3 text-sm text-foreground/70 sm:grid-cols-2">
            <TrustPoint text="Recomandare și ipoteze explicate" />
            <TrustPoint text="Estimări de producție bazate pe PVGIS" />
            <TrustPoint text="Fără obligația de a cumpăra de la un instalator" />
            <TrustPoint text="Incertitudinile rămân vizibile" />
          </ul>
        </div>

        <ProductVisual />
      </div>
    </section>
  );
}

function ProductVisual() {
  return (
    <div className="relative" aria-label="Exemplu orientativ de recomandare RaportSolar">
      <div
        className="pointer-events-none absolute -inset-8 rounded-full bg-brand-green/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-[0_36px_100px_-40px_rgba(16,42,43,.42)] sm:rounded-[2.35rem] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Exemplu orientativ
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.03em]">
              Recomandare pentru locuință
            </h2>
          </div>
          <span className="rounded-full bg-brand-green-soft px-3 py-1.5 text-xs font-bold text-brand-green">
            Ipoteze vizibile
          </span>
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-[#102a2b] p-5 text-white">
          <div className="text-xs font-semibold text-white/60">Interval recomandat</div>
          <div className="mt-2 flex items-end gap-2">
            <strong className="text-4xl tracking-[-0.05em]">5,4–6,2</strong>
            <span className="pb-1 text-sm text-white/65">kWp</span>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div className="h-full w-[72%] rounded-full bg-gradient-brand" />
          </div>
          <p className="mt-4 text-xs leading-5 text-white/60">
            Exemplul nu reprezintă o ofertă sau un rezultat garantat. Recomandarea reală depinde de
            datele locuinței.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <PreviewStat icon={PanelTop} label="Panouri" value="12–14" />
          <PreviewStat icon={Zap} label="Producție anuală" value="6,5–7,4 MWh" />
          <PreviewStat icon={BatteryCharging} label="Baterie" value="Comparată separat" />
          <PreviewStat icon={BarChart3} label="Investiție" value="Interval, nu promisiune" />
        </div>
      </div>
    </div>
  );
}

function MainPaths() {
  return (
    <section aria-labelledby="paths-title" className="px-4 py-20 sm:px-6 md:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="product-kicker">
            <RouteIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Două puncte de plecare
          </div>
          <h2 id="paths-title" className="mt-5 text-4xl font-bold tracking-[-0.055em] md:text-6xl">
            Începe de unde ești acum.
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Construiește întâi un reper pentru locuința ta sau verifică documentul pe care l-ai
            primit deja.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <PathCard
            tone="light"
            icon={Home}
            eyebrow="Nu ai încă o ofertă"
            title="Află ce configurație merită cerută instalatorilor"
            text="Estimăm un interval potrivit folosind consumul de electricitate, acoperișul, locația, consumatorii viitori și obiectivul pentru baterie."
            points={[
              "Consum și profil zilnic",
              "Acoperiș, orientare și umbrire",
              "Mașină electrică, pompă de căldură sau baterie",
            ]}
            to="/recomandare-sistem"
            cta="Construiește recomandarea"
            destination="recommendation"
          />
          <PathCard
            tone="dark"
            icon={FileSearch}
            eyebrow="Ai primit deja o ofertă"
            title="Vezi ce este clar, ce lipsește și ce trebuie întrebat"
            text="Verificăm poziționarea prețului, panourile și invertorul, bateria, transparența instalării, garanțiile și contradicțiile dintre valori."
            points={[
              "Preț și servicii incluse",
              "Echipamente și compatibilitate",
              "Lipsuri, contradicții și garanții",
            ]}
            to="/upload-oferta"
            cta="Analizează oferta"
            destination="offer_analysis"
          />
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Home,
      title: "Spui cum consumă locuința",
      text: "Adaugi datele relevante pentru cazul tău sau documentul ofertei primite.",
    },
    {
      icon: Layers3,
      title: "RaportSolar compară scenarii",
      text: "Calculăm pe baza regulilor și ipotezelor afișate, fără să ascundem incertitudinea.",
    },
    {
      icon: Gauge,
      title: "Primești o concluzie explicată",
      text: "Vezi recomandarea sau verificarea ofertei și factorii care pot schimba rezultatul.",
    },
  ];
  return (
    <section
      aria-labelledby="how-title"
      className="bg-[#102a2b] px-4 py-20 text-white sm:px-6 md:py-28 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="product-kicker product-kicker--dark">Cum funcționează</div>
          <h2 id="how-title" className="mt-5 text-4xl font-bold tracking-[-0.055em] md:text-6xl">
            Datele tale devin o decizie pe care o poți verifica.
          </h2>
        </div>
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="border-t border-white/15 pt-6">
              <div className="flex items-center gap-3 text-brand-sun">
                <step.icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-[0.15em]">
                  Pasul {index + 1}
                </span>
              </div>
              <h3 className="mt-7 text-2xl font-bold tracking-[-0.035em]">{step.title}</h3>
              <p className="mt-3 leading-7 text-white/62">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Independence() {
  return (
    <section aria-labelledby="independence-title" className="px-4 py-20 sm:px-6 md:py-28 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-center">
        <div>
          <div className="product-kicker">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Separat de vânzarea sistemului
          </div>
          <h2
            id="independence-title"
            className="mt-5 max-w-4xl text-4xl font-bold tracking-[-0.055em] md:text-6xl"
          >
            RaportSolar nu vinde panouri și nu clasifică instalatori pentru comision.
          </h2>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
            Produsul te ajută să inspectezi presupunerile din spatele unei concluzii. Vezi datele
            folosite, limitele estimării și ce informații ar putea schimba recomandarea.
          </p>
        </div>
        <div className="rounded-[2rem] border border-border bg-[#fafbf9] p-7">
          <ul className="space-y-5">
            <TrustPoint text="Ipotezele sunt afișate, nu mascate" />
            <TrustPoint text="Incertitudinea este semnalată explicit" />
            <TrustPoint text="Poți urmări cum s-a ajuns la concluzie" />
            <TrustPoint text="Decizia rămâne a ta" />
          </ul>
        </div>
      </div>
    </section>
  );
}

function RecommendationPreview() {
  const outputs = [
    ["Panouri recomandate", "interval justificat"],
    ["Puterea sistemului", "kWp potriviți scenariului"],
    ["Producție anuală", "estimare și sezonalitate"],
    ["Investiție", "interval orientativ"],
    ["Baterie", "cu și fără stocare"],
    ["Amortizare", "sensibilitate la ipoteze"],
  ];
  return (
    <section
      aria-labelledby="preview-title"
      className="bg-[#f4f7f1] px-4 py-20 sm:px-6 md:py-28 lg:px-8"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,.8fr)_minmax(30rem,1.2fr)]">
        <div>
          <div className="product-kicker">
            <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
            Recomandare explicată
          </div>
          <h2
            id="preview-title"
            className="mt-5 text-4xl font-bold tracking-[-0.055em] md:text-6xl"
          >
            Nu primești doar o cifră.
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Rezultatul pune intervalele lângă ipotezele care le susțin și arată ce se poate schimba
            dacă evoluează consumul, orientarea sau obiectivul pentru baterie.
          </p>
          <Link
            to="/exemplu-raport"
            onClick={() =>
              trackAnalytics("homepage_tool_opened", {
                session: "unknown",
                destinationTool: "offer_analysis",
              })
            }
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#102a2b] px-5 py-3 text-sm font-semibold text-white hover:bg-[#183c3d]"
          >
            Vezi cum arată analiza
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-soft">
          <div className="border-b border-border px-6 py-5 sm:px-8">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-brand-green">
              Ce poți compara
            </span>
          </div>
          <dl className="grid sm:grid-cols-2">
            {outputs.map(([term, detail]) => (
              <div
                key={term}
                className="border-b border-border p-6 last:border-b-0 sm:border-r sm:p-7 sm:[&:nth-last-child(-n+2)]:border-b-0 sm:[&:nth-child(even)]:border-r-0"
              >
                <dt className="font-bold tracking-[-0.02em]">{term}</dt>
                <dd className="mt-2 text-sm text-muted-foreground">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function SolarMap() {
  return (
    <section aria-labelledby="map-title" className="px-4 py-20 sm:px-6 md:py-28 lg:px-8">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-[#102a2b] text-white lg:grid-cols-[minmax(0,1fr)_minmax(22rem,.72fr)]">
        <div className="p-7 sm:p-10 md:p-14">
          <div className="product-kicker product-kicker--dark">
            <MapPinned className="h-3.5 w-3.5" aria-hidden="true" />
            Context local bazat pe PVGIS
          </div>
          <h2 id="map-title" className="mt-5 text-4xl font-bold tracking-[-0.055em] md:text-6xl">
            Soarele nu produce la fel în orice configurație.
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/62">
            Explorează producția pentru localitatea ta și vezi efectul locației, orientării,
            înclinației și umbririi. Harta oferă context; recomandarea completă ține cont și de
            consum.
          </p>
          <Link
            to="/harta-solara-romania"
            onClick={() =>
              trackAnalytics("homepage_tool_opened", {
                session: "unknown",
                destinationTool: "solar_map",
              })
            }
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#102a2b]"
          >
            Explorează harta solară
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div
          className="relative min-h-72 overflow-hidden bg-[radial-gradient(circle_at_70%_35%,rgba(244,183,52,.32),transparent_30%),linear-gradient(145deg,#176247,#102a2b)]"
          aria-hidden="true"
        >
          <Sun
            className="absolute right-[18%] top-[18%] h-20 w-20 text-brand-sun"
            strokeWidth={1.25}
          />
          <div className="absolute bottom-[18%] left-[14%] right-[14%] rounded-[1.4rem] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-white/55">
              Producție estimată
            </div>
            <div className="mt-2 text-3xl font-bold">lună cu lună</div>
            <div className="mt-5 flex h-20 items-end gap-2">
              {[30, 46, 62, 78, 92, 82, 70].map((height, index) => (
                <span
                  key={index}
                  className="flex-1 rounded-t bg-brand-sun"
                  style={{ height: `${height}%`, opacity: 0.48 + index * 0.06 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function EditorialGuides() {
  return (
    <section aria-labelledby="guides-title" className="px-4 py-20 sm:px-6 md:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div>
            <div className="product-kicker">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              Ghiduri selectate
            </div>
            <h2
              id="guides-title"
              className="mt-5 max-w-4xl text-4xl font-bold tracking-[-0.055em] md:text-6xl"
            >
              Înțelege opțiunile înainte să compari ofertele.
            </h2>
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
                  trackAnalytics("homepage_guide_opened", {
                    session: "unknown",
                    guideSlug: page.slug,
                    editorialCategory: page.category,
                    editorialPlacement: "homepage",
                  })
                }
                className="group flex min-h-64 flex-col rounded-[1.8rem] border border-border bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transform-none"
              >
                <span className="text-xs font-bold uppercase tracking-[0.13em] text-brand-green">
                  {page.eyebrow}
                </span>
                <h3 className="mt-7 text-2xl font-bold tracking-[-0.035em]">{page.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{page.summary}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold">
                  Citește ghidul
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#f4f7f1] p-7 sm:rounded-[2.6rem] sm:p-10 md:p-14">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <div className="text-sm font-bold text-brand-green">Primul pas poate fi simplu</div>
            <h2
              id="final-cta-title"
              className="mt-3 max-w-4xl text-3xl font-bold tracking-[-0.05em] md:text-6xl"
            >
              Construiește un reper înainte să ceri sau să accepți o ofertă.
            </h2>
          </div>
          <div className="flex flex-col items-start gap-4 lg:items-end">
            <Link
              to="/recomandare-sistem"
              onClick={() =>
                trackAnalytics("homepage_primary_cta_clicked", {
                  session: "unknown",
                  destinationTool: "recommendation",
                })
              }
              className="hero-action hero-action--primary !px-7 !py-4"
            >
              Începe recomandarea
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/upload-oferta"
              onClick={() =>
                trackAnalytics("homepage_secondary_cta_clicked", {
                  session: "unknown",
                  destinationTool: "offer_analysis",
                })
              }
              className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
            >
              Ai deja o ofertă? Analizeaz-o
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PathCard({
  tone,
  icon: Icon,
  eyebrow,
  title,
  text,
  points,
  to,
  cta,
  destination,
}: {
  tone: "light" | "dark";
  icon: typeof CircleHelp;
  eyebrow: string;
  title: string;
  text: string;
  points: string[];
  to: "/recomandare-sistem" | "/upload-oferta";
  cta: string;
  destination: "recommendation" | "offer_analysis";
}) {
  const dark = tone === "dark";
  return (
    <article
      className={`rounded-[2.2rem] p-7 sm:p-9 ${dark ? "bg-[#102a2b] text-white shadow-lift" : "border border-border bg-white shadow-soft"}`}
    >
      <div
        className={`grid h-12 w-12 place-items-center rounded-2xl ${dark ? "bg-white/10 text-brand-sun" : "bg-brand-green-soft text-brand-green"}`}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div
        className={`mt-10 text-xs font-bold uppercase tracking-[0.14em] ${dark ? "text-brand-sun" : "text-brand-green"}`}
      >
        {eyebrow}
      </div>
      <h3 className="mt-3 text-3xl font-bold tracking-[-0.045em]">{title}</h3>
      <p className={`mt-4 leading-7 ${dark ? "text-white/62" : "text-muted-foreground"}`}>{text}</p>
      <ul className="mt-6 space-y-3 text-sm">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-3">
            <Check
              className={`mt-0.5 h-4 w-4 shrink-0 ${dark ? "text-brand-sun" : "text-brand-green"}`}
              aria-hidden="true"
            />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <Link
        to={to}
        onClick={() =>
          trackAnalytics("homepage_tool_opened", {
            session: "unknown",
            destinationTool: destination,
          })
        }
        className={`mt-8 inline-flex min-h-12 items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ${dark ? "bg-white text-[#102a2b]" : "bg-[#102a2b] text-white"}`}
      >
        {cta}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

function TrustPoint({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-green-soft text-brand-green">
        <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
      </span>
      <span>{text}</span>
    </li>
  );
}

function PreviewStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof PanelTop;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-[#fafbf9] p-3.5">
      <Icon className="h-4 w-4 text-brand-green" aria-hidden="true" />
      <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-bold leading-5">{value}</div>
    </div>
  );
}
