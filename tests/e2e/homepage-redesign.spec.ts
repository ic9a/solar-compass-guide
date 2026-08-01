import { expect, test } from "@playwright/test";

test.describe("homepage trust and conversion baseline", () => {
  test("serves the redesigned decision flow with canonical metadata", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Află ce sistem fotovoltaic ți se potrivește înainte să ceri sau să accepți o ofertă/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Calculează sistemul potrivit/ }).first(),
    ).toHaveAttribute("href", "/recomandare-sistem");
    await expect(
      page.getByRole("link", { name: "Verifică oferta primită" }).first(),
    ).toHaveAttribute("href", "/upload-oferta");
    await expect(
      page.getByRole("heading", { name: "Cu ce te poate ajuta RaportSolar?" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Vezi sistemul recomandat/ })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Nu trebuie să compari ofertele doar după preț" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Explorează harta solară" })).toHaveAttribute(
      "href",
      "/harta-solara-romania",
    );
    await expect(page.getByRole("link", { name: /Vezi un exemplu complet/ })).toHaveAttribute(
      "href",
      "/exemplu-raport",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "/");
  });

  test("keeps curated guides crawlable and the page free of horizontal overflow", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const guides = page.locator("[data-home-guide-slug]");
    await expect(guides.first()).toBeVisible();
    expect(await guides.count()).toBeGreaterThanOrEqual(12);
    for (const guide of await guides.all()) {
      await expect(guide).toHaveAttribute("href", /^\/[a-z0-9-]+$/);
    }
    const dimensions = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.innerWidth + 1);
  });
});
