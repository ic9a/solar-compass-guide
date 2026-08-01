import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { JourneyScene, MarketingPageHero, SectionIntro } from "@/components/brand-system";

export const Route = createFileRoute("/cum-functioneaza")({
  head: () => ({
    meta: [
      { title: "Cum funcționează RaportSolar | Recomandare și verificare ofertă" },
      {
        name: "description",
        content:
          "Vezi cum obții o recomandare pentru casa ta sau cum verifici o ofertă fotovoltaică, pas cu pas.",
      },
      { property: "og:url", content: "/cum-functioneaza" },
    ],
    links: [{ rel: "canonical", href: "/cum-functioneaza" }],
  }),
  component: Page,
});

const journeys = [
  {
    kind: "recommendation" as const,
    eyebrow: "Înainte să ceri oferte",
    title: "Află ce sistem merită să ceri",
    text: "Pornești de la consumul și locuința ta. Primești un interval orientativ pentru putere, producție, baterie și cost — împreună cu explicațiile care te ajută să discuți concret cu instalatorii.",
    steps: [
      "Completezi consumul și datele locuinței",
      "Comparăm producția și opțiunile potrivite",
      "Primești recomandarea și vezi ce o poate schimba",
    ],
    to: "/recomandare-sistem" as const,
    cta: "Calculează sistemul potrivit",
  },
  {
    kind: "offer" as const,
    eyebrow: "După ce ai primit o ofertă",
    title: "Verifică ce cumperi, nu doar prețul",
    text: "Încarci documentul primit și vezi dacă puterea, echipamentele, lucrările, bateria și garanțiile sunt explicate suficient. Informațiile neclare rămân vizibile și ușor de discutat.",
    steps: [
      "Încarci oferta sau introduci datele manual",
      "Verificăm informațiile și neconcordanțele",
      "Primești concluzii și întrebări pentru instalator",
    ],
    to: "/upload-oferta" as const,
    cta: "Verifică oferta primită",
  },
];

function Page() {
  return (
    <SiteLayout>
      <MarketingPageHero
        eyebrow="Cum funcționează"
        title="Două momente importante. Un proces pe care îl înțelegi."
        description="Folosește RaportSolar înainte să ceri oferte sau după ce ai primit una. În ambele situații, vezi de unde vine rezultatul și ce mai trebuie verificat."
        visual={<JourneyScene kind="recommendation" />}
      />
      <main>
        <section className="brand-section brand-section--paper">
          <div className="brand-shell">
            <SectionIntro
              number="01"
              title="Alege traseul care corespunde situației tale"
              description="Nu trebuie să completezi date care nu te ajută. Fiecare traseu are un scop și o concluzie clară."
            />
            <div className="public-journeys">
              {journeys.map((journey) => (
                <article className="public-journey" key={journey.kind}>
                  <JourneyScene kind={journey.kind} />
                  <div className="public-journey__copy">
                    <p className="home-v2-eyebrow">{journey.eyebrow}</p>
                    <h3>{journey.title}</h3>
                    <p>{journey.text}</p>
                    <ol className="public-journey__steps">
                      {journey.steps.map((step, index) => (
                        <li key={step}>
                          <b>{index + 1}</b>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                    <Link to={journey.to} className="brand-button brand-button--primary mt-7">
                      {journey.cta}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="brand-section brand-section--dark">
          <div className="brand-shell grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <SectionIntro number="02" title="Ce face și ce nu face RaportSolar" />
            <ul className="grid gap-4 text-base leading-7 text-white/75">
              {[
                "Folosește datele pe care le oferi și arată limitele estimării.",
                "Te ajută să compari informațiile și să pregătești întrebările potrivite.",
                "Nu garantează producția și nu înlocuiește proiectarea la fața locului.",
                "Nu verifică execuția instalației și nu ia decizia în locul tău.",
              ].map((item) => (
                <li className="flex gap-3" key={item}>
                  <Check className="mt-1 h-5 w-5 shrink-0 text-[#ffd05a]" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
