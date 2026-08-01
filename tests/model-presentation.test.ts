import { describe, expect, it } from "vitest";
import { productionUncertaintyPercent, recommendSystemV2 } from "@/lib/recommendation-v2/engine";
import { createSolarLocation } from "@/lib/solarLocation";
import type { RecommendationInputV2, SolarProductionProfile } from "@/lib/recommendation-v2/types";

const profile: SolarProductionProfile = {
  source: "PVGIS",
  normalizedMonthlyKwhPerKwp: [45, 65, 95, 120, 145, 155, 160, 145, 110, 80, 50, 35],
  normalizedAnnualKwhPerKwp: 1205,
  locationPrecision: "precise",
  fetchedAt: "2026-07-30T00:00:00Z",
  orientationIncluded: true,
};
const input: RecommendationInputV2 = {
  schemaVersion: 2,
  consumptionMode: "monthly-kwh",
  monthlyConsumptionKwh: 400,
  usageProfile: "evening",
  loads: [],
  noLargeLoads: true,
  location: createSolarLocation({ lat: 47, lng: 27, locality: "Iași", countyName: "Iași" }),
  locationPrecision: "precise",
  orientation: "south",
  tiltDeg: 30,
  shading: "none",
  buildingType: "house",
  usableRoofAreaM2: 60,
  connectionType: "three-phase",
  goal: "bill",
  batteryPreference: "compare",
};

describe("customer result contract", () => {
  it("narrows production uncertainty when roof inputs are known", () => {
    const known = productionUncertaintyPercent(input, profile);
    const unknown = productionUncertaintyPercent(
      { ...input, locationPrecision: "county", orientation: "unknown", tiltDeg: undefined, shading: "unknown" },
      { ...profile, locationPrecision: "county" },
    );
    expect(known).toBeLessThan(unknown);
    const result = recommendSystemV2(input, profile);
    expect(result.uncertainty.productionKwh.max - result.uncertainty.productionKwh.min).toBeLessThan(
      result.preferred.annualProductionKwh * 0.2,
    );
  });

  it("keeps the main explanation free of internal implementation language", () => {
    const result = recommendSystemV2(input, profile);
    const mainCopy = result.reasons.join(" ").toLowerCase();
    for (const term of ["candidate", "ranking", "scalar", "normalized", "fallback", "dispatch", "nmae", "p50", "p90"]) {
      expect(mainCopy).not.toContain(term);
    }
    expect(mainCopy).toContain("panouri");
    expect(result.assumptionsVersion).toBe("RO-2026.07-v4");
    expect(result.benchmarkVersion).toBe("energy-model-2026.07");
  });
});
