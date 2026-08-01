import { expect, test } from "@playwright/test";
import { openCountyFallbackAndSelect } from "./helpers/recommendation";

const viewports = [
  { width: 320, height: 800 },
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
];

test.describe("recommendation visual choices", () => {
  test.beforeEach(({ page }, testInfo) => {
    void page;
    test.skip(testInfo.project.name !== "desktop-1280", "The test controls its own viewport matrix.");
  });
  for (const viewport of viewports) {
    test(`icons and selected states remain visible at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/recomandare-sistem");
      await expect(page.getByTestId("recommendation-v2-wizard")).toHaveAttribute("data-ready", "true");

      const firstCard = page.getByRole("radio", { name: "Consum lunar" });
      await expect(firstCard).toBeVisible();
      const icon = firstCard.locator("svg").first();
      await expect(icon).toBeVisible();
      const box = await icon.boundingBox();
      expect(box?.width).toBeGreaterThan(0);
      expect(box?.height).toBeGreaterThan(0);

      await firstCard.click();
      await expect(firstCard).toHaveAttribute("aria-checked", "true");
      await expect(icon).toBeVisible();
      await expect(firstCard.locator("svg")).toHaveCount(2);

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
    });
  }

  test("consumer and objective choices expose visible semantic icons", async ({ page }) => {
    await page.goto("/recomandare-sistem");
    await expect(page.getByTestId("recommendation-v2-wizard")).toHaveAttribute("data-ready", "true");
    await page.getByRole("radio", { name: "Consum lunar" }).click();
    await page.getByLabel("Consum mediu lunar").fill("400");
    await page.getByRole("radio", { name: "Relativ constant" }).click();
    await page.getByRole("button", { name: "Continuă" }).click();

    for (const name of ["Nu am consumatori mari", "Mașină electrică", "Pompă de căldură"]) {
      const card = page.getByRole("checkbox", { name });
      await expect(card.locator("svg").first()).toBeVisible();
    }

    await page.getByRole("checkbox", { name: "Nu am consumatori mari" }).click();
    await page.getByRole("button", { name: "Continuă" }).click();
    await openCountyFallbackAndSelect(page, "IS");
    await page.getByRole("button", { name: "Continuă" }).click();
    await page.getByRole("radio", { name: "Casă" }).click();
    await page.getByRole("radio", { name: "Sud", exact: true }).click();
    await page.getByRole("radio", { name: "Fără umbrire" }).click();
    await page.getByRole("button", { name: "Continuă" }).click();

    for (const name of ["Factură mai mică", "Amortizare rezonabilă", "Backup la întreruperi"]) {
      await expect(page.getByRole("radio", { name }).locator("svg").first()).toBeVisible();
    }
  });
});
