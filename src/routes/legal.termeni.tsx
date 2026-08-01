import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Card, PageHero, Section } from "@/components/primitives";

export const Route = createFileRoute("/legal/termeni")({
  head: () => ({ meta: [
    { title: "Termeni și condiții — raportsolar.ro" },
    { name: "description", content: "Termenii și condițiile de utilizare a serviciului raportsolar.ro." },
  ], links: [{ rel: "canonical", href: "/legal/termeni" }] }),
  component: Page,
});

function Page() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Informații legale"
        title="Termeni și condiții"
        description="Condițiile aplicabile utilizării instrumentelor și analizelor disponibile pe raportsolar.ro."
      />
      <Section className="!py-12 max-w-3xl mx-auto">
        <Card className="prose prose-slate max-w-none p-7 md:p-10">
        <p>Prin utilizarea raportsolar.ro accepți acești termeni.</p>
        <h2>1. Serviciul oferit</h2>
        <p>raportsolar.ro oferă o analiză automată, orientativă, a ofertelor fotovoltaice încărcate de utilizator. Rezultatul nu înlocuiește o consultanță tehnică sau juridică profesională și nu constituie recomandare de achiziție.</p>
        <h2>2. Cont utilizator</h2>
        <p>Utilizatorul este responsabil de acuratețea datelor introduse și de confidențialitatea contului.</p>
        <h2>3. Accesul la serviciu</h2>
        <p>În versiunea actuală, instrumentele de analiză sunt disponibile fără plată. raportsolar.ro nu solicită și nu procesează date de card.</p>
        <h2>4. Limitarea răspunderii</h2>
        <p>Nu răspundem pentru decizii comerciale luate pe baza raportului. Analiza depinde de calitatea documentelor încărcate.</p>
        <h2>5. Legea aplicabilă</h2>
        <p>Termenii sunt guvernați de legea română. Eventualele neînțelegeri vor fi soluționate mai întâi pe cale amiabilă și, dacă este necesar, de instanțele competente.</p>
        <h2>6. Modificări</h2>
        <p>Ne rezervăm dreptul de a actualiza termenii; versiunea în vigoare este cea publicată pe această pagină.</p>
        </Card>
      </Section>
    </SiteLayout>
  );
}
