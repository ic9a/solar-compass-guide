import { expect, test } from "@playwright/test";

const publicRoutes = [
  ["/cum-functioneaza", /Două momente importante/],
  ["/contact", /Ai o întrebare despre RaportSolar/],
  ["/intrebari-frecvente", /Răspunsuri directe/],
] as const;

for (const [path, heading] of publicRoutes) {
  test(`${path} uses the public design system without overflow`, async ({ page }) => {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBeLessThanOrEqual(1);
    await expect(page.locator(".brand-page-hero")).toBeVisible();
  });
}

test("FAQ accordion exposes its answer accessibly", async ({ page }) => {
  await page.goto("/intrebari-frecvente", { waitUntil: "domcontentloaded" });
  const question = page.getByRole("button", { name: "Ce primesc după analiza unei oferte?" });
  await expect(question).toHaveAttribute("aria-expanded", "false");
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText(/Primești o încadrare orientativă/)).toBeVisible();
});

test("legal and article layouts retain semantic navigation", async ({ page }) => {
  await page.goto("/legal/confidentialitate", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("navigation", { name: "Documente legale" })).toBeVisible();
  await page.goto("/calculator-panouri-fotovoltaice", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("navigation", { name: "Cuprinsul ghidului" })).toBeVisible();
});

const visualReviewRoutes = [
  ["ghiduri", "/ghid-panouri-fotovoltaice"],
  ["articol", "/calculator-panouri-fotovoltaice"],
  ["intrebari", "/intrebari-frecvente"],
  ["contact", "/contact"],
  ["legal", "/legal/confidentialitate"],
] as const;

for (const [name, path] of visualReviewRoutes) {
  test(`@visual ${name} public page`, async ({ page }, testInfo) => {
    test.skip(
      !["mobile-390", "desktop-1440"].includes(testInfo.project.name),
      "Representative visual-review viewports only",
    );
    await page.goto(path, { waitUntil: "networkidle" });
    await expect(page.locator("main")).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`${name}-full.png`),
      fullPage: true,
    });
  });
}
