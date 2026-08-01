import { expect, test } from "@playwright/test";

const routes = [
  "/calculator-panouri-fotovoltaice",
  "/cate-panouri-fotovoltaice-imi-trebuie",
  "/amortizare-sistem-fotovoltaic",
  "/productie-si-economii-panouri-fotovoltaice",
  "/sistem-fotovoltaic-cu-baterie-sau-fara",
  "/sistem-fotovoltaic-5-kw",
] as const;

test.describe("SEO phase 2 public pages", () => {
  test("render unique metadata, structured data and working CTAs", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1280", "Metadata is viewport-independent.");
    const titles = new Set<string>();
    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("h1")).toBeVisible();
      const title = await page.title();
      expect(titles.has(title)).toBe(false);
      titles.add(title);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://raportsolar.ro${route}`);
      const jsonLdBlocks = await page
        .locator('script[type="application/ld+json"]')
        .evaluateAll((elements) => elements.map((element) => JSON.parse(element.textContent ?? "{}")));
      const articleGraph = jsonLdBlocks.find((block) =>
        block["@graph"]?.some((item: { "@type": string }) => item["@type"] === "Article"),
      );
      expect(articleGraph).toBeDefined();
      if (!articleGraph) throw new Error("Editorial Article graph missing");
      expect(articleGraph["@graph"].map((item: { "@type": string }) => item["@type"])).toEqual([
        "Article",
        "BreadcrumbList",
        "FAQPage",
      ]);
      const cta = page.locator("aside a").last();
      await expect(cta).toBeVisible();
      await expect(cta).toHaveAttribute("href", /^\/(recomandare-sistem|harta-solara-romania|upload-oferta)$/);
    }
  });

  test("has no horizontal overflow at 390px", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-390", "Responsive gate uses the 390px project.");
    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, route).toBeLessThanOrEqual(1);
    }
  });
});
