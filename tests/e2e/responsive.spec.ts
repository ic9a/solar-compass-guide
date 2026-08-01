import { expect, test } from "@playwright/test";

const principalRoutes = [
  "/",
  "/upload-oferta",
  "/recomandare-sistem",
  "/harta-solara-romania",
  "/exemplu-raport",
  "/autentificare",
  "/cont",
];

test.describe("shared responsive shell", () => {
  test("mobile navigation is a visible, trapped, restoring dialog", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name.startsWith("desktop"),
      "Desktop uses the shared expanded navigation",
    );
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const trigger = page.getByRole("button", { name: "Deschide meniul" });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Meniu principal" });
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
    await expect(dialog.getByRole("link", { name: "Recomandare" })).toBeFocused();
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

    const links = dialog.getByRole("link");
    const first = links.first();
    const last = links.last();
    await last.focus();
    await page.keyboard.press("Tab");
    await expect(first).toBeFocused();
    await first.focus();
    await page.keyboard.press("Shift+Tab");
    await expect(last).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");

    await trigger.click();
    await dialog.getByRole("link", { name: "Harta solară" }).click();
    await expect(page).toHaveURL(/harta-solara-romania/);
    await expect(dialog).toBeHidden();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });

  for (const route of principalRoutes) {
    test(`${route} has no horizontal page overflow`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });
      const dimensions = await page.evaluate(() => {
        const innerWidth = window.innerWidth;
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth,
          offenders: Array.from(document.querySelectorAll<HTMLElement>("body *"))
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.right > innerWidth + 0.5 || rect.left < -0.5;
            })
            .slice(0, 8)
            .map((element) => ({
              tag: element.tagName,
              className: element.className.toString().slice(0, 120),
              rect: element.getBoundingClientRect().toJSON(),
            })),
        };
      });
      expect(
        dimensions.scrollWidth,
        JSON.stringify(dimensions.offenders, null, 2),
      ).toBeLessThanOrEqual(dimensions.innerWidth);
    });
  }
});

test.describe("solar chart", () => {
  test("touch and keyboard expose monthly values without overflow", async ({ page }, testInfo) => {
    await page.goto("/harta-solara-romania");
    await page.waitForLoadState("networkidle");
    const chart = page.getByTestId("monthly-production-chart");
    await expect(chart).toBeVisible();
    const bars = chart.getByRole("button");
    await expect(bars).toHaveCount(12);
    const initial = await page.getByTestId("selected-month-summary").textContent();
    expect(initial).toMatch(/kWh/);
    if (testInfo.project.name.startsWith("desktop")) {
      await bars.nth(0).hover();
      await expect(page.getByTestId("selected-month-summary")).toContainText("Ianuarie");
      await bars.nth(3).evaluate((element: HTMLButtonElement) => element.click());
    } else {
      await bars.nth(3).tap();
    }
    await expect(page.getByTestId("selected-month-summary")).toContainText("Aprilie");
    await bars.nth(3).press("ArrowRight");
    await expect(page.getByTestId("selected-month-summary")).toContainText("Mai");
    await expect(bars.nth(4)).toHaveAttribute("aria-label", /Mai: .* kWh/);
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.innerWidth);
  });
});

test("@visual captures the required phase views", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: `test-results/visual/${testInfo.project.name}-homepage.png`,
    fullPage: true,
  });
  if (!testInfo.project.name.startsWith("desktop")) {
    await page.getByRole("button", { name: "Deschide meniul" }).click();
    await page.screenshot({
      path: `test-results/visual/${testInfo.project.name}-navigation-open.png`,
      fullPage: true,
    });
  }
  await page.goto("/harta-solara-romania");
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("monthly-production-chart")).toBeVisible();
  await page.screenshot({
    path: `test-results/visual/${testInfo.project.name}-solar-map.png`,
    fullPage: true,
  });
  await page.getByTestId("monthly-production-chart").getByRole("button").nth(3).click();
  await page.screenshot({
    path: `test-results/visual/${testInfo.project.name}-chart-selected.png`,
    fullPage: true,
  });
});
