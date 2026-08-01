import { describe, expect, it } from "vitest";
import { AnalyticsPayloadSchema } from "@/lib/analytics";
import { editorialBySlug, editorialPages, indexablePaths, privatePathPrefixes } from "@/lib/seo-content";

const phase2Slugs = [
  "calculator-panouri-fotovoltaice",
  "cate-panouri-fotovoltaice-imi-trebuie",
  "amortizare-sistem-fotovoltaic",
  "productie-si-economii-panouri-fotovoltaice",
  "sistem-fotovoltaic-cu-baterie-sau-fara",
  "sistem-fotovoltaic-5-kw",
] as const;

describe("SEO phase 2 demand capture", () => {
  it("publishes all six intended pages with unique metadata and valid CTAs", () => {
    expect(editorialPages).toHaveLength(18);
    expect(new Set(editorialPages.map((page) => page.title)).size).toBe(editorialPages.length);
    expect(new Set(editorialPages.map((page) => page.description)).size).toBe(editorialPages.length);

    for (const slug of phase2Slugs) {
      const page = editorialBySlug[slug];
      expect(page).toBeDefined();
      expect(page.primaryCta).toBeDefined();
      expect(["recommendation", "solar_map", "offer_analysis"]).toContain(page.primaryCta?.tool);
      expect(indexablePaths).toContain(`/${slug}`);
    }
  });

  it("resolves every related link and excludes private paths", () => {
    for (const page of editorialPages) {
      for (const slug of page.related) {
        const isEditorial = Boolean(editorialBySlug[slug]);
        const isPublicTool = indexablePaths.includes(`/${slug}` as (typeof indexablePaths)[number]);
        expect(isEditorial || isPublicTool, `Unresolved related destination: ${slug}`).toBe(true);
      }
    }
    for (const path of indexablePaths) {
      expect(privatePathPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))).toBe(false);
    }
  });

  it("accepts only coarse CTA analytics dimensions", () => {
    expect(
      AnalyticsPayloadSchema.safeParse({
        event: "editorial_cta_clicked",
        route: "/calculator-panouri-fotovoltaice",
        viewport: "mobile",
        session: "unknown",
        destinationTool: "recommendation",
        ctaPlacement: "sidebar",
      }).success,
    ).toBe(true);

    expect(
      AnalyticsPayloadSchema.safeParse({
        event: "editorial_cta_clicked",
        route: "/calculator-panouri-fotovoltaice",
        viewport: "mobile",
        session: "unknown",
        destinationTool: "recommendation",
        ctaPlacement: "sidebar",
        locality: "Bucuresti",
      }).success,
    ).toBe(false);
  });
});
