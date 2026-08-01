import { expect, test } from "@playwright/test";

const hubPath = "/ghid-panouri-fotovoltaice";

test.describe("SEO phase 3 editorial hub", () => {
  test("renders the complete SSR knowledge center across desktop engines", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-1280", "firefox-desktop", "webkit-desktop"].includes(testInfo.project.name),
      "Hub semantics are covered once per desktop engine.",
    );
    await page.goto(hubPath, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Ghiduri pentru fiecare decizie/);
    await expect(page.locator('[data-guide-directory-slug]')).toHaveCount(18);
    await expect(page.locator("[data-beginner-guide]")).toHaveCount(6);
    await expect(page.locator("[data-featured-guide]")).toHaveCount(4);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://raportsolar.ro/ghid-panouri-fotovoltaice",
    );
    const graph = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((elements) =>
        elements
          .map((element) => JSON.parse(element.textContent ?? "{}"))
          .find((block) => block["@graph"]?.some((item: { "@type": string }) => item["@type"] === "CollectionPage")),
      );
    expect(graph["@graph"].map((item: { "@type": string }) => item["@type"])).toEqual([
      "CollectionPage",
      "ItemList",
      "BreadcrumbList",
    ]);
    expect(graph["@graph"][1].numberOfItems).toBe(18);
    await expect(page.getByRole("link", { name: "Ghiduri", exact: true }).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });

  test("mobile navigation exposes the hub and restores the page without overflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-390", "Mobile navigation uses the 390px project.");
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const menuButton = page.getByRole("button", { name: "Deschide meniul" });
    const menuDialog = page.getByRole("dialog");
    await expect(async () => {
      if ((await menuButton.getAttribute("aria-expanded")) !== "true") {
        await menuButton.click();
      }
      await expect(menuDialog).toBeVisible();
    }).toPass({ timeout: 15_000 });
    const guideLink = menuDialog.getByRole("link", { name: "Ghiduri", exact: true });
    await expect(guideLink).toBeVisible();
    await guideLink.click();
    await expect(page).toHaveURL(/\/ghid-panouri-fotovoltaice$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });

  test("homepage selection and related-guide navigation are useful", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1280", "Product discovery behavior is browser-independent.");
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-home-guide-slug]")).toHaveCount(3);
    await expect(page.getByRole("link", { name: /Vezi toate cele 18 ghiduri/ })).toBeVisible();

    await page.goto("/calculator-panouri-fotovoltaice", { waitUntil: "domcontentloaded" });
    const related = page.getByRole("heading", { name: "Următorul ghid util" }).locator("..").getByRole("link");
    expect(await related.count()).toBeGreaterThanOrEqual(2);
    await related.first().click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Pas practic")).toBeVisible();
  });
});
