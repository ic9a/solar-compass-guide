import { expect, test } from "@playwright/test";

test("authentication explains privacy and account continuity", async ({ page }) => {
  await page.goto("/autentificare", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Revino oricând la analiza ofertei tale." }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Un raport privat, păstrat în contul tău" }),
  ).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuă cu Google" })).toBeVisible();
});

test("private result entry routes preserve safe redirects", async ({ page }) => {
  await page.goto("/raport-complet/example-id", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/rezultat-gratuit\/example-id/);
});
