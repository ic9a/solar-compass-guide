import { describe, expect, it } from "vitest";
import { recommendSystemV2 } from "@/lib/recommendation-v2/engine";
import type { RecommendationInputV2, SolarProductionProfile } from "@/lib/recommendation-v2/types";
import { createSolarLocation } from "@/lib/solarLocation";

const cities = [
  ["Miroslava", "Iași", 47.1142, 27.5163, 1180],
  ["Craiova", "Dolj", 44.3302, 23.7949, 1320],
  ["Cluj-Napoca", "Cluj", 46.7712, 23.6236, 1140],
  ["Botoșani", "Botoșani", 47.7486, 26.6694, 1080],
  ["București", "București", 44.4268, 26.1025, 1270],
] as const;
const consumptions = [180, 400, 700, 1100];

describe("documented scenario matrix", () => {
  it("simulates locations and consumption levels with plausible relationships", () => {
    const startedAt = performance.now();
    const results = cities.flatMap(([locality, county, lat, lng, annualYield]) =>
      consumptions.map((monthlyConsumptionKwh) => {
        const profile: SolarProductionProfile = {
          source: "PVGIS",
          normalizedMonthlyKwhPerKwp: [
            0.04, 0.055, 0.08, 0.1, 0.12, 0.13, 0.13, 0.12, 0.09, 0.07, 0.04, 0.025,
          ].map((share) => share * annualYield),
          normalizedAnnualKwhPerKwp: annualYield,
          locationPrecision: "precise",
          fetchedAt: "2026-07-26T00:00:00.000Z",
        };
        const input: RecommendationInputV2 = {
          schemaVersion: 2,
          consumptionMode: "monthly-kwh",
          monthlyConsumptionKwh,
          usageProfile: "constant",
          loads: [],
          noLargeLoads: true,
          location: createSolarLocation({ lat, lng, locality, countyName: county }),
          locationPrecision: "precise",
          orientation: "south",
          tiltDeg: 30,
          shading: "none",
          usableRoofAreaM2: 90,
          buildingType: "house",
          connectionType: "three-phase",
          goal: "bill",
          batteryPreference: "compare",
        };
        return { locality, monthlyConsumptionKwh, result: recommendSystemV2(input, profile) };
      }),
    );
    expect(results).toHaveLength(20);
    expect(results.every(({ result }) => result.preferred.annualProductionKwh > 0)).toBe(true);
    const miroslavaLow = results.find(
      (item) => item.locality === "Miroslava" && item.monthlyConsumptionKwh === 180,
    )!;
    const miroslavaHigh = results.find(
      (item) => item.locality === "Miroslava" && item.monthlyConsumptionKwh === 1100,
    )!;
    expect(miroslavaHigh.result.preferred.capacityKwp).toBeGreaterThanOrEqual(
      miroslavaLow.result.preferred.capacityKwp,
    );
    const craiova = results.find(
      (item) => item.locality === "Craiova" && item.monthlyConsumptionKwh === 400,
    )!;
    const botosani = results.find(
      (item) => item.locality === "Botoșani" && item.monthlyConsumptionKwh === 400,
    )!;
    const sharedCapacity = craiova.result.candidates.find((candidate) =>
      botosani.result.candidates.some((other) => other.capacityKwp === candidate.capacityKwp),
    )!.capacityKwp;
    const craiovaCandidate = craiova.result.candidates.find(
      (candidate) => candidate.capacityKwp === sharedCapacity,
    )!;
    const botosaniCandidate = botosani.result.candidates.find(
      (candidate) => candidate.capacityKwp === sharedCapacity,
    )!;
    expect(craiovaCandidate.annualProductionKwh).toBeGreaterThan(
      botosaniCandidate.annualProductionKwh,
    );
    expect(performance.now() - startedAt).toBeLessThan(500);
  });
});
