import { expect, test } from "@playwright/test";
import { openCountyFallbackAndSelect } from "./helpers/recommendation";

test("V2 blocks hidden defaults and produces a transparent responsive result", async ({ page }) => {
  await page.goto("/recomandare-sistem");
  await expect(page.getByTestId("recommendation-v2-wizard")).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("recommendation-v2-result")).toHaveCount(0);

  await page.getByRole("radio", { name: "Consum lunar" }).click();
  const monthlyConsumption = page.getByLabel("Consum mediu lunar");
  await monthlyConsumption.fill("400");
  await expect(monthlyConsumption).toHaveValue("400");
  await page.getByRole("radio", { name: "Relativ constant" }).click();
  await page.getByRole("button", { name: "Continuă" }).click();
  await expect(page.getByRole("heading", { name: "Consumatori mari" })).toBeVisible();
  await page.getByRole("checkbox", { name: "Nu am consumatori mari" }).click();
  await page.getByRole("button", { name: "Continuă" }).click();
  await expect(page.getByRole("heading", { name: "Locația sistemului" })).toBeVisible();

  await openCountyFallbackAndSelect(page, "IS");
  await page.getByRole("button", { name: "Continuă" }).click();

  await page.getByRole("radio", { name: "Casă" }).click();
  await page.getByRole("radio", { name: "Sud", exact: true }).click();
  await page.getByRole("radio", { name: "Fără umbrire" }).click();
  await page.getByRole("radio", { name: "Trifazat" }).click();
  await page.getByText("Detalii opționale pentru o recomandare mai precisă").click();
  await page.getByLabel("Suprafață utilă").fill("55");
  await page.getByRole("button", { name: "Continuă" }).click();

  await page.getByRole("radio", { name: "Factură mai mică" }).click();
  await page.getByRole("radio", { name: "Compară ambele variante" }).click();
  await page.getByRole("button", { name: "Calculează recomandarea" }).click();
  await expect(page.getByTestId("recommendation-v2-result")).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("Concluzie și motivare")).toBeVisible();
  await page.getByText("Cum am calculat").click();
  await expect(page.getByText(/Versiune model/)).toBeVisible();

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
});
