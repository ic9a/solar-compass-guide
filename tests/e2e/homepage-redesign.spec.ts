import { expect, test } from "@playwright/test";

test.describe("homepage trust and conversion baseline", () => {
  test("serves the redesigned decision flow with canonical metadata", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Află ce sistem fotovoltaic se potrivește locuinței tale/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Începe recomandarea" }).first()).toHaveAttribute(
      "href",
      "/recomandare-sistem",
    );
    await expect(page.getByRole("link", { name: "Analizează o ofertă" }).first()).toHaveAttribute(
      "href",
      "/upload-oferta",
    );
    await expect(page.getByRole("heading", { name: "Începe de unde ești acum." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Nu primești doar o cifră." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Explorează harta solară" })).toHaveAttribute(
      "href",
      "/harta-solara-romania",
    );
    await expect(page.getByRole("link", { name: "Vezi cum arată analiza" })).toHaveAttribute(
      "href",
      "/exemplu-raport",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "/");
  });

  test("keeps curated guides crawlable and the page free of horizontal overflow", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("[data-home-guide-slug]")).toHaveCount(3);
    for (const guide of await page.locator("[data-home-guide-slug]").all()) {
      await expect(guide).toHaveAttribute("href", /^\/[a-z0-9-]+$/);
    }
    const dimensions = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.innerWidth + 1);
  });
});
