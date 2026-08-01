import { expect, test } from "@playwright/test";

test("@visual records homepage motion and verifies the reduced-motion alternative", async (
  { browser, baseURL },
  testInfo,
) => {
  test.skip(testInfo.project.name !== "desktop-1440", "One representative Chromium recording is sufficient.");
  const homepageUrl = new URL("/", baseURL ?? "http://127.0.0.1:4173").toString();

  const motionContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: "test-results/visual-motion",
      size: { width: 1440, height: 900 },
    },
  });
  const page = await motionContext.newPage();
  await page.goto(homepageUrl);
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".hero-sun")).toHaveCSS("animation-name", "sun-pulse");
  await page.mouse.wheel(0, 850);
  await page.waitForTimeout(900);
  await page.mouse.wheel(0, 1_150);
  await page.waitForTimeout(900);
  await page.mouse.wheel(0, -2_000);
  await page.waitForTimeout(700);
  await motionContext.close();

  const reducedContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(homepageUrl);
  await reducedPage.waitForLoadState("networkidle");
  await expect(reducedPage.locator(".hero-sun")).toHaveCSS("animation-name", "none");
  await expect(reducedPage.locator("[data-reveal]").first()).toHaveCSS("opacity", "1");
  await reducedPage.screenshot({
    path: "test-results/visual/reduced-motion-390-homepage.png",
    fullPage: true,
  });
  await reducedContext.close();
});
