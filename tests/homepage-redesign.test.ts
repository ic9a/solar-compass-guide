import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AnalyticsPayloadSchema } from "../src/lib/analytics";
import { HOMEPAGE_GUIDE_SLUGS, editorialBySlug } from "../src/lib/seo-content";

const read = (path: string) => readFileSync(path, "utf8");

describe("homepage redesign baseline", () => {
  it("keeps the two primary decisions and supporting product paths explicit", () => {
    const source = read("src/routes/index.tsx");
    expect(source).toContain("Află ce sistem fotovoltaic se potrivește");
    expect(source).toContain('to="/recomandare-sistem"');
    expect(source).toContain("Începe recomandarea");
    expect(source).toContain('to="/upload-oferta"');
    expect(source).toContain("Analizează o ofertă");
    expect(source).toContain('to="/harta-solara-romania"');
    expect(source).toContain('to="/exemplu-raport"');
    expect(source).toContain("RaportSolar nu vinde panouri");
  });

  it("renders the curated homepage guides from the central editorial registry", () => {
    expect(HOMEPAGE_GUIDE_SLUGS).toHaveLength(3);
    expect(HOMEPAGE_GUIDE_SLUGS.every((slug) => editorialBySlug[slug])).toBe(true);
    expect(read("src/routes/index.tsx")).toContain("HOMEPAGE_GUIDE_SLUGS.map");
  });

  it("keeps homepage analytics strictly enumerated and privacy safe", () => {
    const base = {
      route: "/",
      viewport: "desktop" as const,
      session: "unknown" as const,
    };
    expect(
      AnalyticsPayloadSchema.safeParse({
        ...base,
        event: "homepage_primary_cta_clicked",
        destinationTool: "recommendation",
      }).success,
    ).toBe(true);
    expect(
      AnalyticsPayloadSchema.safeParse({
        ...base,
        event: "homepage_tool_opened",
        destinationTool: "solar_map",
        locality: "București",
      }).success,
    ).toBe(false);
    expect(
      AnalyticsPayloadSchema.safeParse({
        ...base,
        event: "homepage_secondary_cta_clicked",
        email: "test@example.com",
      }).success,
    ).toBe(false);
  });

  it("preserves required global navigation and legal destinations", () => {
    const header = read("src/components/SiteHeader.tsx");
    const footer = read("src/components/SiteFooter.tsx");
    for (const route of [
      "/recomandare-sistem",
      "/upload-oferta",
      "/harta-solara-romania",
      "/ghid-panouri-fotovoltaice",
      "/exemplu-raport",
    ]) {
      expect(header).toContain(route);
      expect(footer).toContain(route);
    }
    expect(footer).toContain("/legal/confidentialitate");
    expect(footer).toContain("/legal/termeni");
    expect(footer).toContain("/legal/cookies");
    expect(footer).toContain('to="/cont"');
  });
});
