import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { trackAnalytics } from "@/lib/analytics";
import { editorialPages } from "@/lib/seo-content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sistem fotovoltaic potrivit pentru casa ta | raportsolar.ro" },
      {
        name: "description",
        content:
          "Află ce putere, producție și baterie se potrivesc casei tale sau verifică oferta fotovoltaică primită înainte să iei o decizie.",
      },
      {
        property: "og:title",
        content: "Sistem fotovoltaic potrivit pentru casa ta | raportsolar.ro",
      },
      {
        property: "og:description",
        content:
          "Calculează sistemul potrivit pentru casa ta sau verifică, punct cu punct, oferta primită.",
      },
      { property: "og:url", content: "/" },
      { property: "og:image", content: "/brand/raportsolar-og.png" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

function HomePage() {
  useEffect(() => {
    trackAnalytics("homepage_view", { session: "unknown" });
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach((element) => element.setAttribute("data-visible", "true"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).setAttribute("data-visible", "true");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <SiteLayout>
      <Hero />
      <Choice />
      <Journey />
      <RecommendationShowcase />
      <OfferAnalysis />
      <SolarMapStory />
      <Trust />
      <Guides />
      <Closing />
    </SiteLayout>
  );
}

function Hero() {
  return (
    <section className="home-v2-hero">
      <div className="home-v2-hero__glow" aria-hidden="true" />
      <div className="home-v2-shell home-v2-hero__grid">
        <div className="home-v2-hero__copy">
          <p className="home-v2-eyebrow">Recomandare fotovoltaică pentru casa ta</p>
          <h1>
            Află ce sistem fotovoltaic ți se potrivește înainte să ceri sau să accepți o ofertă.
          </h1>
          <p className="home-v2-lead">
            RaportSolar estimează puterea sistemului, producția și rolul bateriei pe baza consumului
            și a locuinței tale. Ai primit deja o ofertă? O poți verifica punct cu punct înainte să
            iei o decizie.
          </p>
          <div className="home-v2-actions">
            <TrackedLink
              to="/recomandare-sistem"
              event="homepage_primary_cta_clicked"
              destination="recommendation"
              primary
            >
              Calculează sistemul potrivit <ArrowRight aria-hidden="true" />
            </TrackedLink>
            <TrackedLink
              to="/upload-oferta"
              event="homepage_secondary_cta_clicked"
              destination="offer_analysis"
            >
              Verifică oferta primită
            </TrackedLink>
          </div>
          <p className="home-v2-proof">
            Estimări bazate pe PVGIS <span>·</span> explicații clare <span>·</span> fără vânzare de
            echipamente
          </p>
        </div>
        <HeroScene />
      </div>
      <SolarCurve />
    </section>
  );
}

function HeroScene() {
  return (
    <div
      className="hero-scene"
      role="img"
      aria-label="Ilustrație: energia solară este transformată într-o recomandare pentru casă"
    >
      <svg viewBox="0 0 720 620" role="img" aria-hidden="true" className="hero-scene__svg">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e9f7dc" />
            <stop offset="1" stopColor="#f8f5e9" />
          </linearGradient>
          <linearGradient id="roof" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#174d42" />
            <stop offset="1" stopColor="#0b2f29" />
          </linearGradient>
          <filter id="softShadow" x="-30%" y="-30%" width="160%" height="180%">
            <feDropShadow
              dx="0"
              dy="18"
              stdDeviation="18"
              floodColor="#0c332a"
              floodOpacity=".16"
            />
          </filter>
        </defs>
        <path d="M48 468C110 307 226 179 389 91c104-56 202-66 283-43v520H48Z" fill="url(#sky)" />
        <circle className="hero-sun" cx="563" cy="116" r="59" fill="#ffb511" />
        <g filter="url(#softShadow)">
          <path d="M100 378 286 222l186 156v157H100Z" fill="#fffdf7" />
          <path d="m68 381 218-182 219 182-35 31-184-154-184 154Z" fill="url(#roof)" />
          <path d="M159 330 276 235l90 75-119 91Z" fill="#123f37" />
          <g transform="translate(173 292) skewX(-13)">
            <rect width="142" height="82" rx="5" fill="#1f6e63" stroke="#9ed9c7" strokeWidth="3" />
            <path
              d="M47 0v82M94 0v82M0 27h142M0 55h142"
              stroke="#9ed9c7"
              strokeWidth="2"
              opacity=".72"
            />
          </g>
          <rect x="309" y="397" width="81" height="138" rx="6" fill="#e9d3ad" />
          <rect x="140" y="421" width="98" height="66" rx="6" fill="#c6e8dc" />
          <path d="M148 487h84M189 424v60" stroke="#6fae9d" strokeWidth="5" />
        </g>
        <path
          className="energy-path"
          d="M557 185c-35 55-86 75-135 80-55 6-97 25-120 63"
          fill="none"
          stroke="#ffb511"
          strokeLinecap="round"
          strokeWidth="8"
        />
        <path
          className="energy-path energy-path--two"
          d="M319 370c58 48 109 61 156 40 45-20 84-12 113 25"
          fill="none"
          stroke="#0e9f61"
          strokeLinecap="round"
          strokeWidth="7"
        />
        <g className="hero-battery" transform="translate(523 405)">
          <rect x="0" y="0" width="91" height="126" rx="18" fill="#103d35" />
          <rect x="33" y="-9" width="25" height="12" rx="5" fill="#103d35" />
          <path d="m51 28-19 34h18l-11 34 27-44H48Z" fill="#ffb511" />
        </g>
      </svg>
      <div className="hero-result">
        <span>Exemplu de rezultat</span>
        <strong>Sistem recomandat</strong>
        <div>
          <b>5,4–6,2</b> kWp
        </div>
        <p>12–14 panouri · 6.500–7.400 kWh/an</p>
      </div>
      <div className="hero-offer">
        <img src="/brand/raportsolar-mark-512.png" width="32" height="32" alt="" />
        <div>
          <span>Oferta primită</span>
          <strong>7 lucruri verificate</strong>
        </div>
        <i aria-hidden="true">✓</i>
      </div>
    </div>
  );
}

function Choice() {
  return (
    <section className="home-v2-choice" aria-labelledby="choice-title">
      <div className="home-v2-shell" data-reveal>
        <p className="home-v2-section-number">01</p>
        <h2 id="choice-title">Cu ce te poate ajuta RaportSolar?</h2>
        <div className="choice-scenes">
          <article className="choice-scene choice-scene--home">
            <div className="choice-scene__art" aria-hidden="true">
              <span className="choice-roof">
                <i />
                <i />
                <i />
              </span>
              <span className="choice-meter">324 kWh</span>
            </div>
            <div>
              <span>Înainte să ceri oferte</span>
              <h3>Vrei să afli ce sistem să ceri</h3>
              <p>
                Răspunzi la câteva întrebări despre consum, locuință și planurile tale. Primești o
                estimare pentru puterea sistemului, producție și baterie.
              </p>
              <TrackedLink
                to="/recomandare-sistem"
                event="homepage_tool_opened"
                destination="recommendation"
              >
                Află ce sistem ți se potrivește <ChevronRight aria-hidden="true" />
              </TrackedLink>
            </div>
          </article>
          <article className="choice-scene choice-scene--offer">
            <div className="choice-document" aria-hidden="true">
              <span>OFERTĂ FOTOVOLTAICĂ</span>
              <i />
              <i />
              <i />
              <b>?</b>
            </div>
            <div>
              <span>După ce ai primit o propunere</span>
              <h3>Ai deja o ofertă</h3>
              <p>
                Încarci documentul și vezi dacă prețul, echipamentele, garanțiile și lucrările
                incluse sunt explicate suficient.
              </p>
              <TrackedLink
                to="/upload-oferta"
                event="homepage_tool_opened"
                destination="offer_analysis"
              >
                Verifică oferta <ChevronRight aria-hidden="true" />
              </TrackedLink>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function Journey() {
  return (
    <section className="home-v2-journey" aria-labelledby="journey-title">
      <div className="home-v2-shell" data-reveal>
        <p className="home-v2-section-number">02</p>
        <h2 id="journey-title">De la consumul casei la o recomandare pe care o înțelegi</h2>
        <ol className="journey-line">
          <JourneyStep
            number="1"
            title="Ne spui cum consumă locuința"
            text="Alegi consumul lunar sau anual și adaugi informațiile care contează pentru casa ta."
          />
          <JourneyStep
            number="2"
            title="Comparăm producția și scenariile potrivite"
            text="Calculăm producția lună cu lună și comparăm variante cu sau fără baterie."
          />
          <JourneyStep
            number="3"
            title="Vezi recomandarea și ce poate schimba rezultatul"
            text="Primești valori orientative, explicații și întrebările pe care merită să le pui instalatorului."
          />
        </ol>
      </div>
    </section>
  );
}

function JourneyStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <li>
      <span>{number}</span>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </li>
  );
}

function RecommendationShowcase() {
  return (
    <section className="home-v2-result" aria-labelledby="result-title">
      <div className="home-v2-shell home-v2-result__grid" data-reveal>
        <div>
          <p className="home-v2-section-number">03</p>
          <h2 id="result-title">Vezi sistemul recomandat, nu doar o cifră scoasă din context</h2>
          <p className="home-v2-copy">
            Rezultatul îți arată cât ar putea produce sistemul, ce costuri sunt plauzibile și dacă
            bateria are sens pentru felul în care consumi energia.
          </p>
          <TrackedLink
            to="/exemplu-raport"
            event="homepage_tool_opened"
            destination="offer_analysis"
            primary
          >
            Vezi un exemplu complet <ArrowRight aria-hidden="true" />
          </TrackedLink>
        </div>
        <div className="result-board">
          <header>
            <span>Exemplu de rezultat</span>
            <strong>Sistem recomandat</strong>
          </header>
          <div className="result-board__main">
            <strong>5,4–6,2 kWp</strong>
            <span>12–14 panouri</span>
          </div>
          <dl>
            <div>
              <dt>Producție anuală estimată</dt>
              <dd>6.500–7.400 kWh</dd>
            </div>
            <div>
              <dt>Cost estimat</dt>
              <dd>
                27.000–34.000 lei
                <small>în funcție de echipamente, montaj și lucrările incluse</small>
              </dd>
            </div>
            <div>
              <dt>Perioadă estimată de recuperare</dt>
              <dd>7–10 ani</dd>
            </div>
            <div>
              <dt>Baterie</dt>
              <dd>Vezi dacă merită pentru felul în care consumi energia</dd>
            </div>
          </dl>
          <div className="production-chart" role="img" aria-label="Exemplu de producție lunară">
            {[32, 42, 60, 76, 91, 100, 98, 89, 68, 50, 31, 25].map((height, index) => (
              <i
                key={index}
                style={{ "--bar": `${height}%`, "--delay": `${index * 55}ms` } as CSSProperties}
              />
            ))}
          </div>
          <p className="result-board__note">
            Valorile sunt orientative. Orientarea, înclinarea, umbrirea și lucrările necesare la
            fața locului pot schimba rezultatul.
          </p>
        </div>
      </div>
    </section>
  );
}

function OfferAnalysis() {
  return (
    <section className="home-v2-offer" aria-labelledby="offer-title">
      <div className="home-v2-shell home-v2-offer__grid" data-reveal>
        <div className="offer-paper" aria-label="Exemplu fictiv de ofertă fotovoltaică analizată">
          <header>
            <img src="/brand/raportsolar-mark-512.png" width="46" height="46" alt="" />
            <div>
              <span>Exemplu fictiv</span>
              <strong>Ofertă fotovoltaică</strong>
            </div>
          </header>
          <p className="offer-paper__line">
            <span>Putere sistem</span>
            <b>6 kWp</b>
          </p>
          <p className="offer-paper__line is-good">
            <span>Panouri</span>
            <b>14 × 430 W</b>
            <em>clar</em>
          </p>
          <p className="offer-paper__line is-warn">
            <span>Invertor</span>
            <b>model neprecizat</b>
            <em>lipsește</em>
          </p>
          <p className="offer-paper__line">
            <span>Preț total</span>
            <b>34.800 lei</b>
          </p>
          <p className="offer-paper__line is-warn">
            <span>Lucrări incluse</span>
            <b>„montaj standard”</b>
            <em>de clarificat</em>
          </p>
          <p className="offer-paper__line is-good">
            <span>Garanție panouri</span>
            <b>25 ani</b>
            <em>clar</em>
          </p>
        </div>
        <div>
          <p className="home-v2-section-number">04</p>
          <h2 id="offer-title">Nu trebuie să compari ofertele doar după preț</h2>
          <p className="home-v2-copy">
            RaportSolar caută informațiile care te ajută să înțelegi ce cumperi: puterea sistemului,
            modelele echipamentelor, bateria, lucrările incluse și garanțiile.
          </p>
          <ul className="offer-checks">
            <li>
              <Check aria-hidden="true" /> vezi ce lipsește din ofertă
            </li>
            <li>
              <Check aria-hidden="true" /> observi valorile care se contrazic
            </li>
            <li>
              <Check aria-hidden="true" /> pregătești întrebări concrete pentru instalator
            </li>
          </ul>
          <TrackedLink
            to="/upload-oferta"
            event="homepage_tool_opened"
            destination="offer_analysis"
            primary
          >
            Verifică oferta primită <ArrowRight aria-hidden="true" />
          </TrackedLink>
        </div>
      </div>
    </section>
  );
}

function SolarMapStory() {
  return (
    <section className="home-v2-map" aria-labelledby="map-title">
      <div className="home-v2-shell home-v2-map__grid" data-reveal>
        <div>
          <p className="home-v2-section-number">05</p>
          <h2 id="map-title">Vezi cât poate produce un sistem în localitatea ta</h2>
          <p className="home-v2-copy">
            Locația este doar începutul. Orientarea și înclinarea acoperișului, umbrirea și felul în
            care este proiectat sistemul pot schimba producția.
          </p>
          <p className="map-source">
            Estimările de producție folosesc date PVGIS ale Comisiei Europene.
          </p>
          <TrackedLink
            to="/harta-solara-romania"
            event="homepage_tool_opened"
            destination="solar_map"
          >
            Explorează harta solară <ArrowRight aria-hidden="true" />
          </TrackedLink>
        </div>
        <div className="map-visual" aria-hidden="true">
          <svg viewBox="0 0 560 420">
            <path
              d="m208 50 42 15 31-19 37 24 53-3 41 41-2 45 40 35-28 48 5 50-44 16-27 60-51 9-35-26-63 24-37-39-48-10 5-54-38-30 20-52-11-51 41-32 33 8 34-39Z"
              fill="#176a58"
              opacity=".96"
            />
            <path
              d="M125 263c66-30 139-43 217-37 56 4 104 19 144 43"
              fill="none"
              stroke="#ffd04d"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle cx="302" cy="235" r="13" fill="#ffb511" />
            <circle
              cx="302"
              cy="235"
              r="28"
              fill="none"
              stroke="#ffb511"
              strokeWidth="4"
              opacity=".55"
            />
          </svg>
          <div className="map-tooltip">
            <span>Iași</span>
            <strong>1.240 kWh/kWp</strong>
            <small>producție anuală estimată</small>
          </div>
        </div>
      </div>
    </section>
  );
}

function Trust() {
  const points = [
    "RaportSolar nu vinde panouri.",
    "Nu primești recomandarea unui instalator care încearcă să îți vândă propriul sistem.",
    "Vezi pe ce date se bazează estimarea și ce informații pot schimba rezultatul.",
    "Pentru proiectarea finală este necesară verificarea acoperișului și a instalației electrice.",
  ];
  return (
    <section className="home-v2-trust">
      <div className="home-v2-shell" data-reveal>
        <img src="/brand/raportsolar-mark-512.png" width="110" height="110" alt="" />
        <div>
          <p className="home-v2-section-number">06</p>
          <h2>Un reper pentru tine, nu o ofertă mascată</h2>
        </div>
        <ul>
          {points.map((point) => (
            <li key={point}>
              <Check aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const guideGroups = [
  { title: "Înainte să ceri oferte", categories: ["incepe"] },
  { title: "Cum alegi puterea sistemului", categories: ["dimensionare"] },
  { title: "Panouri, invertor și baterie", categories: ["echipamente", "baterii"] },
  { title: "Costuri și recuperarea investiției", categories: ["costuri", "productie"] },
  { title: "Prosumator și documente", categories: ["prosumator"] },
  { title: "Cum verifici o ofertă", categories: ["oferte"] },
] as const;

function Guides() {
  return (
    <section className="home-v2-guides" aria-labelledby="guides-title">
      <div className="home-v2-shell" data-reveal>
        <p className="home-v2-section-number">07</p>
        <div className="guides-heading">
          <h2 id="guides-title">
            Ghiduri care te ajută să compari ofertele cu mai multă încredere
          </h2>
          <p>
            De la primele calcule până la garanții și dosarul de prosumator, găsești explicațiile de
            care ai nevoie înainte să semnezi.
          </p>
        </div>
        <div className="guide-groups">
          {guideGroups.map((group) => {
            const pages = editorialPages
              .filter((page) => (group.categories as readonly string[]).includes(page.category))
              .slice(0, 3);
            return (
              <article key={group.title}>
                <h3>{group.title}</h3>
                <ul>
                  {pages.map((page) => (
                    <li key={page.slug}>
                      <Link
                        data-home-guide-slug={page.slug}
                        to="/$slug"
                        params={{ slug: page.slug }}
                        onClick={() =>
                          trackAnalytics("homepage_guide_opened", {
                            session: "unknown",
                            guideSlug: page.slug,
                            editorialCategory: page.category,
                            editorialPlacement: "homepage",
                          })
                        }
                      >
                        {page.title}
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
        <Link to="/ghid-panouri-fotovoltaice" className="guides-all">
          Vezi toate ghidurile despre panouri fotovoltaice <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="home-v2-closing">
      <div className="home-v2-shell home-v2-closing__inner" data-reveal>
        <img src="/brand/raportsolar-mark-512.png" width="132" height="132" alt="" />
        <div>
          <h2>Începe cu datele casei tale, nu cu oferta unui instalator.</h2>
          <p>În câteva minute poți avea un reper clar pentru discuția cu instalatorii.</p>
        </div>
        <div className="home-v2-actions">
          <TrackedLink
            to="/recomandare-sistem"
            event="homepage_primary_cta_clicked"
            destination="recommendation"
            primary
          >
            Calculează sistemul potrivit <ArrowRight aria-hidden="true" />
          </TrackedLink>
          <TrackedLink
            to="/upload-oferta"
            event="homepage_secondary_cta_clicked"
            destination="offer_analysis"
          >
            Am deja o ofertă
          </TrackedLink>
        </div>
      </div>
    </section>
  );
}

function SolarCurve() {
  return (
    <svg
      className="solar-curve"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M0 88C338 145 809-10 1440 72v48H0Z" fill="#fffdf8" />
      <path
        d="M0 88C338 145 809-10 1440 72"
        fill="none"
        stroke="#ffbd28"
        strokeWidth="3"
        strokeDasharray="12 16"
      />
    </svg>
  );
}

function TrackedLink({
  to,
  event,
  destination,
  primary = false,
  children,
}: {
  to: "/recomandare-sistem" | "/upload-oferta" | "/harta-solara-romania" | "/exemplu-raport";
  event: "homepage_primary_cta_clicked" | "homepage_secondary_cta_clicked" | "homepage_tool_opened";
  destination: "recommendation" | "offer_analysis" | "solar_map";
  primary?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={() => trackAnalytics(event, { session: "unknown", destinationTool: destination })}
      className={primary ? "home-v2-button home-v2-button--primary" : "home-v2-button"}
    >
      {children}
    </Link>
  );
}
