import { expect, type Page } from "@playwright/test";

const COUNTY_CONTROL_NAME = "Nu găsești localitatea? Alege județul.";
const COUNTY_SELECT_NAME = "Județ — estimare provizorie";

export async function openCountyFallbackAndSelect(page: Page, countyCode: string) {
  const toggle = page.getByRole("button", { name: COUNTY_CONTROL_NAME });
  const selector = page.getByLabel(COUNTY_SELECT_NAME);
  if (!(await selector.isVisible().catch(() => false))) {
    await expect(toggle).toBeVisible();
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(selector).toBeVisible();
  await selector.selectOption(countyCode);
  await expect(selector).toHaveValue(countyCode);
  await expect(page.getByText("Folosim temporar o estimare reprezentativă pentru județ; încrederea rezultatului va fi redusă.")).toBeVisible();
}
