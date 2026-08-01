import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Card, PageHero, Section } from "@/components/primitives";

export const Route = createFileRoute("/cum-functioneaza")({
  head: () => ({
    meta: [
      { title: "Cum funcționează raportsolar.ro" },
      { name: "description", content: "Vezi cum raportsolar.ro transformă datele despre consum sau oferta instalatorului în concluzii clare și ușor de folosit." },
      { property: "og:url", content: "/cum-functioneaza" },
    ],
    links: [{ rel: "canonical", href: "/cum-functioneaza" }],
  }),
  component: Page,
});

const STEPS = [
  { n: "01", title: "Alegi instrumentul potrivit", text: "Poți dimensiona un sistem, estima producția pentru locația ta sau verifica o ofertă primită." },
  { n: "02", title: "Ne oferi informațiile disponibile", text: "Completezi datele despre consum și locuință sau încarci documentul trimis de instalator." },
  { n: "03", title: "Datele sunt verificate și puse în context", text: "raportsolar.ro corelează informațiile din ofertă și semnalează lipsurile sau neconcordanțele." },
  { n: "04", title: "Primești concluzii pe care le poți folosi", text: "Vezi ce este în regulă, ce trebuie clarificat și ce întrebări merită adresate instalatorului." },
];

function Page() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Cum funcționează"
        title="De la consum sau ofertă la o alegere mai bine informată."
        description="raportsolar.ro organizează informațiile tehnice și financiare într-o formă ușor de înțeles, fără afiliere la instalatorul care ți-a trimis oferta."
      />
      <Section>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <Card key={s.n} className="group relative overflow-hidden p-6 transition-transform hover:-translate-y-1">
              <div className="text-5xl font-extrabold text-gradient-brand leading-none">{s.n}</div>
              <div className="mt-7 text-lg font-bold">{s.title}</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{s.text}</p>
            </Card>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/recomandare-sistem" className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow">
            Află ce sistem ți se potrivește <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/upload-oferta" className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:bg-muted">
            Verifică o ofertă primită
          </Link>
        </div>
      </Section>
    </SiteLayout>
  );
}
