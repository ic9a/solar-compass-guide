import { expect, test } from "@playwright/test";

test("recommendation keeps six steps and offers contextual visual guidance", async ({ page }) => {
  await page.goto("/recomandare-sistem", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("recommendation-v2-wizard")).toBeVisible();
  await expect(page.getByText(/Pasul 1 din 6/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Continuă/ })).toBeVisible();
});

test("offer entry routes explain document and manual states", async ({ page }) => {
  await page.goto("/upload-oferta", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("img", { name: "Ofertă verificată punct cu punct" })).toBeVisible();
  await expect(page.getByText("Document privat")).toBeVisible();
  await page.goto("/introducere-manuala", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Sistem și preț" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Verifică datele esențiale" })).toBeVisible();
});

test("solar map and example report retain interactive, qualified results", async ({ page }) => {
  await page.goto("/harta-solara-romania", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("complementary", { name: "Configurarea estimării solare" }),
  ).toBeVisible();
  await page.goto("/exemplu-raport", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Exemplu demonstrativ", { exact: true })).toBeVisible();
  await expect(page.getByRole("tablist", { name: "Secțiunile raportului" })).toBeVisible();
});
