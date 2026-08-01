import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { PageHero, Section } from "@/components/primitives";
import { PaidReport } from "@/components/PaidReport";
import { useEffect } from "react";
import { trackAnalytics } from "@/lib/analytics";

export const Route = createFileRoute("/exemplu-raport")({
  head: () => ({
    meta: [
      { title: "Exemplu raport analiză ofertă fotovoltaică — raportsolar.ro" },
      {
        name: "description",
        content:
          "Vezi un exemplu de analiză raportsolar.ro: preț, echipamente, garanții, riscuri și întrebări pentru instalator.",
      },
      { property: "og:url", content: "/exemplu-raport" },
    ],
    links: [{ rel: "canonical", href: "/exemplu-raport" }],
  }),
  component: Page,
});

function Page() {
  useEffect(() => {
    trackAnalytics("example_report_viewed", { session: "unknown" });
  }, []);

  return (
    <SiteLayout>
      <PageHero
        className="report-page-hero core-tool-hero"
        eyebrow="Exemplu de analiză"
        title="Vezi cum este explicată o ofertă, de la preț până la garanții."
        description="Acest exemplu arată structura concluziilor oferite de raportsolar.ro și felul în care informațiile tehnice sunt transformate în întrebări și acțiuni concrete."
      />
      <Section className="!py-10 md:!py-16">
        <div className="max-w-6xl mx-auto">
          <div className="example-report-notice" role="note">
            <strong>Exemplu demonstrativ</strong>
            <span>
              Datele, furnizorul și concluziile sunt fictive. Nu reprezintă rezultatul unui
              utilizator real.
            </span>
          </div>
          <PaidReport />
        </div>
      </Section>
    </SiteLayout>
  );
}
