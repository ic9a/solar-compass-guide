import { expect, test } from "@playwright/test";

test("clean public snapshot serves representative public workflows", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ghiduri", exact: true }).first()).toBeVisible();

  await page.goto("/ghid-panouri-fotovoltaice", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Ghiduri pentru fiecare decizie/);
  await expect(page.locator("[data-guide-directory-slug]")).toHaveCount(18);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
