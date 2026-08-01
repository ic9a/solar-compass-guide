import { expect, test } from "@playwright/test";

test("admin remains protected from anonymous access", async ({ page }) => {
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page).not.toHaveURL(/\/admin\/?$/);
});

test("private account route remains noindex", async ({ page }) => {
  await page.goto("/cont", { waitUntil: "domcontentloaded" });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
