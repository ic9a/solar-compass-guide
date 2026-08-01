import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { MarketingPageHero, SectionIntro } from "@/components/brand-system";

export const Route = createFileRoute("/intrebari-frecvente")({
  head: () => ({
    meta: [
      { title: "Întrebări frecvente — raportsolar.ro" },
      {
        name: "description",
        content:
          "Răspunsuri despre analiza ofertelor, protejarea documentelor și estimările generate de raportsolar.ro.",
      },
      { property: "og:url", content: "/intrebari-frecvente" },
    ],
    links: [{ rel: "canonical", href: "/intrebari-frecvente" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: Page,
});

const FAQ: { q: string; a: string }[] = [
  {
    q: "Ce primesc după analiza unei oferte?",
    a: "Primești o încadrare orientativă a prețului, scoruri pe categorii, punctele bune, principalele semnale de risc și explicații despre informațiile care lipsesc sau trebuie clarificate cu instalatorul.",
  },
  {
    q: "Analiza este gratuită?",
    a: "Da. În această etapă, raportsolar.ro nu solicită plată pentru analiză. Orice schimbare viitoare va fi afișată clar înainte de încărcarea sau procesarea unei oferte.",
  },
  {
    q: "Pot analiza o ofertă fără PDF?",
    a: "Da. Dacă nu ai oferta în format PDF sau imagine, poți introduce datele manual: puterea sistemului, numărul de panouri, invertorul, bateria, prețul total, garanțiile și ce este inclus în ofertă.",
  },
  {
    q: "Raportul înlocuiește un specialist?",
    a: "Nu. Raportul este orientativ și nu înlocuiește o verificare tehnică realizată la fața locului. Scopul lui este să te ajute să înțelegi oferta, să identifici lipsurile și să știi ce întrebări să pui înainte să semnezi.",
  },
  {
    q: "Cât de exacte sunt estimările?",
    a: "Estimările depind de consum, amplasament, orientare, umbrire, echipamente și condițiile contractuale. De aceea folosim formulări precum «orientativ» și «estimativ», nu promisiuni garantate.",
  },
  {
    q: "Cum sunt protejate documentele încărcate?",
    a: "Documentele sunt salvate într-un spațiu privat și sunt asociate sesiunii sau contului tău. Accesul este controlat, iar alt utilizator nu poate deschide oferta sau analiza ta.",
  },
  {
    q: "Pot analiza oferte cu baterie?",
    a: "Da. Raportul ține cont dacă bateria este inclusă, ce capacitate are, dacă prețul este defalcat, dacă are sens pentru consumul utilizatorului și dacă există informații clare despre backup, garanție și compatibilitate.",
  },
  {
    q: "Pot compara mai multe oferte?",
    a: "Momentan aplicația este concentrată pe analiza unei singure oferte. Compararea mai multor oferte este o funcționalitate viitoare și va fi anunțată când devine disponibilă.",
  },
];

const GROUPS = [
  { title: "Despre rezultat", items: FAQ.slice(0, 3) },
  { title: "Despre estimări și limite", items: FAQ.slice(3, 5) },
  { title: "Despre documente și oferte", items: FAQ.slice(5) },
];

function Page() {
  return (
    <SiteLayout>
      <MarketingPageHero
        eyebrow="Întrebări frecvente"
        title="Răspunsuri directe, înainte să începi."
        description="Află ce primești, ce date sunt necesare și unde se oprește o estimare realizată online."
      />
      <main className="brand-section brand-section--paper">
        <div className="brand-shell grid gap-12 lg:grid-cols-[.65fr_1.35fr]">
          <div>
            <SectionIntro
              number="01"
              title="Găsește repede informația care îți trebuie"
              description="Întrebările sunt grupate după momentul în care apar: înainte de analiză, la interpretarea rezultatului și când lucrezi cu documentele."
            />
          </div>
          <div className="faq-groups">
            {GROUPS.map((group) => (
              <section
                className="faq-group"
                key={group.title}
                aria-labelledby={`faq-${group.title}`}
              >
                <h2 id={`faq-${group.title}`}>{group.title}</h2>
                <div className="faq-list">
                  {group.items.map((f) => (
                    <Item key={f.q} q={f.q} a={f.a} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </SiteLayout>
  );
}

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button className="" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="font-semibold text-foreground">{q}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="faq-item__answer">{a}</div>}
    </div>
  );
}
