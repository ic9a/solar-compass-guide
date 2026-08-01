import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AnalyticsPayloadSchema } from "@/lib/analytics";
import {
  BEGINNER_PATH,
  EDITORIAL_CATEGORIES,
  FEATURED_GUIDE_SLUGS,
  HOMEPAGE_GUIDE_SLUGS,
  TOOL_DESTINATIONS,
  editorialBySlug,
  editorialPages,
  indexablePaths,
  relatedEditorialPages,
} from "@/lib/seo-content";

describe("SEO phase 3 editorial registry", () => {
  it("defines complete, unique metadata for all eighteen guides", () => {
    expect(editorialPages).toHaveLength(18);
    expect(new Set(editorialPages.map((page) => page.slug)).size).toBe(18);
    for (const page of editorialPages) {
      expect(EDITORIAL_CATEGORIES.some((category) => category.id === page.category)).toBe(true);
      expect(page.summary.length).toBeGreaterThanOrEqual(60);
      expect(page.audience.length).toBeGreaterThanOrEqual(20);
      expect(page.readingMinutes).toBeGreaterThanOrEqual(4);
      expect(page.readingMinutes).toBeLessThanOrEqual(12);
      expect(TOOL_DESTINATIONS[page.primaryTool]).toBeDefined();
      expect(indexablePaths).toContain(`/${page.slug}`);
    }
  });

  it("keeps curated collections small, unique and resolvable", () => {
    for (const collection of [BEGINNER_PATH, FEATURED_GUIDE_SLUGS, HOMEPAGE_GUIDE_SLUGS]) {
      expect(new Set(collection).size).toBe(collection.length);
      for (const slug of collection) expect(editorialBySlug[slug]).toBeDefined();
    }
    expect(BEGINNER_PATH).toHaveLength(6);
    expect(FEATURED_GUIDE_SLUGS).toHaveLength(4);
    expect(HOMEPAGE_GUIDE_SLUGS).toHaveLength(3);
  });

  it("resolves deterministic related guides without self, duplicates or broken targets", () => {
    for (const page of editorialPages) {
      const related = relatedEditorialPages(page);
      expect(related.length).toBeGreaterThanOrEqual(2);
      expect(related.length).toBeLessThanOrEqual(3);
      expect(new Set(related.map((item) => item.slug)).size).toBe(related.length);
      expect(related.some((item) => item.slug === page.slug)).toBe(false);
      for (const item of related) expect(editorialBySlug[item.slug]).toBeDefined();
    }
  });

  it("exposes the hub in desktop, mobile and footer navigation source", () => {
    const header = readFileSync("src/components/SiteHeader.tsx", "utf8");
    const footer = readFileSync("src/components/SiteFooter.tsx", "utf8");
    expect(header).toContain('{ to: "/ghid-panouri-fotovoltaice", label: "Ghiduri" }');
    expect(footer).toContain('to="/ghid-panouri-fotovoltaice"');
  });

  it("accepts only controlled guide discovery analytics", () => {
    const valid = {
      event: "editorial_guide_opened",
      route: "/ghid-panouri-fotovoltaice",
      viewport: "desktop",
      session: "unknown",
      guideSlug: "dimensionare-sistem-fotovoltaic",
      editorialCategory: "dimensionare",
      editorialPlacement: "beginner_path",
    };
    expect(AnalyticsPayloadSchema.safeParse(valid).success).toBe(true);
    expect(AnalyticsPayloadSchema.safeParse({ ...valid, guideSlug: "invented-guide" }).success).toBe(false);
    expect(AnalyticsPayloadSchema.safeParse({ ...valid, address: "strada exemplu" }).success).toBe(false);
  });
});
