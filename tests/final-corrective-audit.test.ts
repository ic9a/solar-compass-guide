import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rankRomanianLocalities } from "@/lib/geocoding.functions";
import { modelConsumption, recommendSystemV2 } from "@/lib/recommendation-v2/engine";
import type { LocationSearchResult } from "@/lib/geocoding.functions";
import type { RecommendationInputV2, SolarProductionProfile } from "@/lib/recommendation-v2/types";
import { createSolarLocation } from "@/lib/solarLocation";

const location = (locality: string, countyName: string, id: string): LocationSearchResult => ({
  ...createSolarLocation({ lat: 47, lng: 27, locality, countyName }),
  id,
});

const profile: SolarProductionProfile = {
  source: "PVGIS",
  normalizedMonthlyKwhPerKwp: [45, 65, 95, 120, 145, 155, 160, 145, 110, 80, 50, 35],
  normalizedAnnualKwhPerKwp: 1205,
  locationPrecision: "precise",
  fetchedAt: "2026-07-29T00:00:00.000Z",
};

const base: RecommendationInputV2 = {
  schemaVersion: 2,
  consumptionMode: "monthly-kwh",
  monthlyConsumptionKwh: 400,
  usageProfile: "constant",
  loads: [],
  noLargeLoads: true,
  location: createSolarLocation({ lat: 47, lng: 27, locality: "Iași", countyName: "Iași" }),
  locationPrecision: "precise",
  orientation: "south",
  shading: "none",
  buildingType: "house",
  connectionType: "three-phase",
  goal: "bill",
  batteryPreference: "compare",
};

describe("final corrective audit", () => {
  it("filters unrelated Photon results and ranks county-qualified exact matches", () => {
    const results = [
      location("Schitu Duca", "Iași", "unrelated"),
      location("Slobozia", "Ialomița", "il"),
      location("Slobozia", "Iași", "is"),
      location("Miroslava", "Iași", "miroslava"),
      location("Ocna Mureș", "Alba", "ocna"),
    ];
    expect(rankRomanianLocalities("Slobozia", results).map((item) => item.id)).toEqual(["il", "is"]);
    expect(rankRomanianLocalities("Slobozia, Iași", results).map((item) => item.id)).toEqual(["is"]);
    expect(rankRomanianLocalities("Miroslava, Iasi", results).map((item) => item.id)).toEqual(["miroslava"]);
  });

  it("marks corrected bill consumption separately from an automatic estimate", () => {
    const automatic = modelConsumption({ ...base, consumptionMode: "bill", monthlyBillLei: 250 });
    const corrected = modelConsumption({
      ...base,
      consumptionMode: "bill",
      monthlyBillLei: 250,
      editedBillEstimateKwh: 500,
    });
    expect(automatic.source).toBe("bill-estimate");
    expect(corrected.source).toBe("bill-user-corrected");
    expect(corrected.projectedAnnualKwh).toBe(6000);
    expect(corrected.warnings.join(" ")).toContain("corectat de utilizator");
    expect(corrected.warnings.join(" ")).not.toContain("Consum estimat din factură la");
  });

  it("evaluates small roofs and keeps panel count consistent with nominal capacity", () => {
    const fourPanels = recommendSystemV2({ ...base, maxPanelCount: 4 }, profile);
    expect(fourPanels.candidates).toHaveLength(1);
    expect(fourPanels.preferred.panelCount).toBe(4);
    expect(fourPanels.preferred.capacityKwp).toBe(1.8);
    for (const candidate of recommendSystemV2({ ...base, maxPanelCount: 16 }, profile).candidates) {
      expect(candidate.capacityKwp).toBeCloseTo(candidate.panelCount * 0.45, 6);
    }
    expect(() => recommendSystemV2({ ...base, maxPanelCount: 3 }, profile)).toThrow(
      /nu permite un sistem fotovoltaic rezidențial/i,
    );
  });

  it("uses a real base economic scenario rather than the endpoint midpoint", () => {
    const candidate = recommendSystemV2(base, profile).preferred;
    expect(candidate.economics.base.paybackYears).toBe(
      Math.round((candidate.economics.base.investmentLei / candidate.economics.base.annualSavingsLei) * 10) / 10,
    );
    expect(candidate.economics.optimistic.paybackYears).toBeLessThanOrEqual(candidate.economics.base.paybackYears);
    expect(candidate.economics.base.paybackYears).toBeLessThanOrEqual(candidate.economics.conservative.paybackYears);
  });

  it("keeps paid report data out of progress and free DTO selectors", () => {
    const analysisSource = readFileSync("src/lib/analysis.functions.ts", "utf8");
    const progressSection = analysisSource.slice(
      analysisSource.indexOf("export const getOfferAnalysis"),
      analysisSource.indexOf("export const applyManualCorrection"),
    );
    const paymentsSource = readFileSync("src/lib/payments.functions.ts", "utf8");
    const freeSection = paymentsSource.slice(
      paymentsSource.indexOf("export const getAnalysisById"),
      paymentsSource.indexOf("export const getPaymentsPublicInfo"),
    );
    expect(progressSection).not.toContain("full_report");
    expect(freeSection).not.toContain("full_report");
    expect(paymentsSource.slice(paymentsSource.indexOf("export const authorizeReportAccess"))).toContain("full_report");
  });
});
