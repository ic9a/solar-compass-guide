import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("sitewide redesign phase 1", () => {
  it("documents every known visual route and design-system policy", () => {
    const audit = read("docs/design/sitewide-redesign-audit.md");
    for (const route of [
      "`/cum-functioneaza`",
      "`/contact`",
      "`/recomandare-sistem`",
      "`/raport-complet/$analysisId`",
      "`/admin/webhooks`",
    ]) {
      expect(audit).toContain(route);
    }
    expect(audit).not.toContain("not inspected");
    expect(read("docs/design/raportsolar-design-system.md")).toContain("prefers-reduced-motion");
  });

  it("uses the shared brand system on phase-one routes", () => {
    expect(read("src/routes/cum-functioneaza.tsx")).toContain("MarketingPageHero");
    expect(read("src/routes/contact.tsx")).toContain("PageState");
    expect(read("src/routes/intrebari-frecvente.tsx")).toContain("faq-groups");
    expect(read("src/routes/$slug.tsx")).toContain("article-toc");
    for (const file of ["legal.confidentialitate", "legal.cookies", "legal.termeni"]) {
      expect(read(`src/routes/${file}.tsx`)).toContain("LegalPage");
    }
  });

  it("keeps protected application modules outside the phase-one diff", () => {
    const component = read("src/components/brand-system.tsx");
    expect(component).not.toMatch(/supabase|stripe|scoring|pvgis/i);
  });
});
