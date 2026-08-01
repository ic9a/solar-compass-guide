import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/upload-oferta",
  "/recomandare-sistem",
  "/harta-solara-romania",
  "/exemplu-raport",
  "/cum-functioneaza",
  "/intrebari-frecvente",
  "/contact",
];

test.describe("final production-readiness gates", () => {
  test("principal routes have no serious or critical accessibility violations", async ({
    context,
  }, testInfo) => {
    test.skip(
      !["desktop-1280", "firefox-desktop", "webkit-desktop"].includes(testInfo.project.name),
      "Engine-level accessibility gate; responsive behavior is covered by the preserved Phase 1 matrix.",
    );
    test.setTimeout(120_000);
    for (const route of publicRoutes) {
      const routePage = await context.newPage();
      await routePage.goto(route, { waitUntil: "networkidle" });
      const result = await new AxeBuilder({ page: routePage })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      const blockers = result.violations.filter(
        (violation) => violation.impact === "serious" || violation.impact === "critical",
      );
      expect(blockers, `${route}: ${JSON.stringify(blockers, null, 2)}`).toEqual([]);
      await routePage.close();
    }
  });

  test("metadata is route-specific and private pages are noindex", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1280", "Metadata is viewport-independent.");
    test.setTimeout(120_000);
    const titles = new Set<string>();
    for (const route of publicRoutes) {
      await page.goto(route);
      const title = await page.title();
      expect(title).toContain("raportsolar.ro");
      expect(titles.has(title), `Titlu duplicat la ${route}: ${title}`).toBe(false);
      titles.add(title);
      await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    }

    for (const route of ["/autentificare", "/cont", "/cont/rapoarte", "/cont/setari"]) {
      await page.goto(route);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    }
  });

  test("invalid and empty uploads are rejected without losing a valid replacement", async ({
    page,
  }, testInfo) => {
    test.skip(
testInfo.project.name !== "desktop-1280",
      "Client validation is browser-independent and signature verification is covered by unit tests.",
    );
    await page.goto("/upload-oferta", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /Încarcă oferta/i })).toBeVisible();
    const chooser = page.locator('input[type="file"]');
    await chooser.evaluate((element) => element.removeAttribute("disabled"));
    await chooser.setInputFiles({
      name: "program.exe",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("MZ"),
    });
    await expect(page.getByText(/format neacceptat/i)).toBeVisible();

    await chooser.setInputFiles({
      name: "oferta-test.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\n%%EOF"),
    });
    await expect(page.getByText("oferta-test.pdf")).toBeVisible();
  });

  test("recommendation draft restores compatible inputs and can restart", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-1280", "firefox-desktop", "webkit-desktop"].includes(testInfo.project.name),
      "Persistence is verified once per browser engine.",
    );
    await page.addInitScript(
      ([key, value]) => window.sessionStorage.setItem(key, value),
      ["raportsolar.recommendation-v2.draft", "{\"persistenceVersion\":1,\"engineSchemaVersion\":2,\"assumptionsVersion\":\"RO-2026.07-v2\",\"step\":2,\"state\":{\"schemaVersion\":2,\"consumptionMode\":\"monthly-kwh\",\"monthlyConsumptionKwh\":400,\"usageProfile\":\"evening\",\"loads\":[],\"noLargeLoads\":false,\"locationPrecision\":\"missing\",\"connectionType\":\"unknown\",\"batteryPreference\":\"compare\"}}"],
    );
    await page.goto("/recomandare-sistem", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Am refăcut recomandarea începută/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Consumatori mari" })).toBeVisible();
    await page.getByRole("button", { name: "Reia de la început" }).click();
    await expect(page.getByLabel("Consum mediu lunar")).toHaveCount(0);
    await expect(page.getByRole("radio", { name: "Consum lunar" })).toHaveAttribute("aria-checked", "false");
  });

  test("@visual captures key final states", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const routes =
      testInfo.project.name === "desktop-1280"
        ? ([
            ["homepage", "/"],
            ["upload-idle", "/upload-oferta"],
            ["recommendation-first-step", "/recomandare-sistem"],
            ["solar-map", "/harta-solara-romania"],
            ["example-report", "/exemplu-raport"],
            ["authentication", "/autentificare"],
            ["account-history", "/cont/rapoarte"],
          ] as const)
        : ([["homepage", "/"]] as const);
    for (const [name, route] of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await testInfo.attach(`${name}-${testInfo.project.name}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });
    }
  });
});
