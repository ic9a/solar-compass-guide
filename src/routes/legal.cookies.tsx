import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Card, PageHero, Section } from "@/components/primitives";

export const Route = createFileRoute("/legal/cookies")({
  head: () => ({ meta: [{ title: "Politica de cookies — raportsolar.ro" }], links: [{ rel: "canonical", href: "/legal/cookies" }] }),
  component: Page,
});

function Page() {
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Informații legale"
        title="Politica de cookies"
        description="Cookie-urile folosite pentru autentificare și funcționarea corectă a platformei."
      />
      <Section className="!py-12 max-w-3xl mx-auto">
        <Card className="prose prose-slate max-w-none p-7 md:p-10">
        <p>Folosim numai cookie-uri strict necesare pentru autentificare și funcționarea site-ului. Nu setăm cookie-uri de marketing fără consimțământ explicit.</p>
        <h2>Cookie-uri necesare</h2>
        <ul>
          <li><code>sb-*</code> — sesiune autentificare (Supabase). Fără acest cookie nu poți fi conectat.</li>
        </ul>
        <h2>Cookie-uri analitice</h2>
        <p>Nu folosim în prezent. Dacă în viitor vom activa analitice, îți vom cere consimțământul printr-un banner.</p>
        <p>Poți șterge cookie-urile din setările browserului.</p>
        </Card>
      </Section>
    </SiteLayout>
  );
}
