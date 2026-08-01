import { describe, expect, it } from "vitest";
import {
  canonicalUrl,
  editorialPages,
  indexablePaths,
  privatePathPrefixes,
} from "@/lib/seo-content";

describe("SEO phase 1 registry", () => {
  it("publishes eighteen unique editorial pages", () => {
    expect(editorialPages).toHaveLength(18);
    expect(new Set(editorialPages.map((page) => page.slug)).size).toBe(18);
  });

  it("keeps every editorial page substantial and internally linked", () => {
    for (const page of editorialPages) {
      const words = [
        page.title,
        page.description,
        page.intro,
        ...page.sections.flatMap((section) => [
          section.heading,
          ...section.paragraphs,
          ...(section.bullets ?? []),
        ]),
        ...page.faq.flatMap((item) => [item.question, item.answer]),
      ].join(" ").split(/\s+/).length;
      expect(words).toBeGreaterThanOrEqual(165);
      expect(page.related.length).toBeGreaterThanOrEqual(3);
      expect(page.faq.length).toBeGreaterThanOrEqual(2);
      expect(page.sources.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("generates absolute, normalized canonicals", () => {
    expect(canonicalUrl("/")).toBe("https://raportsolar.ro/");
    expect(canonicalUrl("//cost-panouri-fotovoltaice/")).toBe(
      "https://raportsolar.ro/cost-panouri-fotovoltaice",
    );
  });

  it("never admits private workflows into the indexable registry", () => {
    for (const path of indexablePaths) {
      expect(privatePathPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))).toBe(false);
    }
  });
});
