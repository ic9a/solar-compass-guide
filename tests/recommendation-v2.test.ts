import { describe, expect, it } from "vitest";
import {
  adjustedProductionProfile,
  assertFiniteResult,
  deriveRoofCapacityKwp,
  modelConsumption,
  normalizeLargeLoads,
  recommendSystemV2,
} from "@/lib/recommendation-v2/engine";
import type { RecommendationInputV2, SolarProductionProfile } from "@/lib/recommendation-v2/types";
import { createSolarLocation } from "@/lib/solarLocation";

const profile: SolarProductionProfile = {
  source: "PVGIS",
  normalizedMonthlyKwhPerKwp: [45, 65, 95, 120, 145, 155, 160, 145, 110, 80, 50, 35],
  normalizedAnnualKwhPerKwp: 1205,
  locationPrecision: "precise",
  fetchedAt: "2026-07-26T00:00:00.000Z",
};

const base: RecommendationInputV2 = {
  schemaVersion: 2,
  consumptionMode: "monthly-kwh",
  monthlyConsumptionKwh: 400,
  usageProfile: "constant",
  loads: [],
  noLargeLoads: true,
  location: createSolarLocation({
    lat: 47.1142,
    lng: 27.5163,
    locality: "Miroslava",
    countyName: "Iași",
  }),
  locationPrecision: "precise",
  orientation: "south",
  tiltDeg: 30,
  shading: "none",
  usableRoofAreaM2: 55,
  buildingType: "house",
  connectionType: "three-phase",
  goal: "bill",
  batteryPreference: "none",
};

describe("Recommendation Engine V2 invariants", () => {
  it("reduces production for north and increasing shading", () => {
    const south = adjustedProductionProfile(profile, base);
    const north = adjustedProductionProfile(profile, { ...base, orientation: "north" });
    const moderate = adjustedProductionProfile(profile, { ...base, shading: "moderate" });
    const severe = adjustedProductionProfile(profile, { ...base, shading: "severe" });
    expect(north.reduce((a, b) => a + b, 0)).toBeLessThan(south.reduce((a, b) => a + b, 0));
    expect(moderate.reduce((a, b) => a + b, 0)).toBeLessThan(south.reduce((a, b) => a + b, 0));
    expect(severe.reduce((a, b) => a + b, 0)).toBeLessThan(moderate.reduce((a, b) => a + b, 0));
  });

  it("uses bill-only input and measured kWh independently", () => {
    const bill = modelConsumption({
      ...base,
      consumptionMode: "bill",
      monthlyConsumptionKwh: undefined,
      monthlyBillLei: 650,
    });
    const measured = modelConsumption(base);
    expect(bill.source).toBe("bill-estimate");
    expect(bill.projectedAnnualKwh).toBe(6000);
    expect(measured.projectedAnnualKwh).toBe(4800);
  });

  it("does not duplicate included EV or heat pump, but adds planned loads seasonally", () => {
    const included = modelConsumption({
      ...base,
      noLargeLoads: false,
      loads: [
        { id: "ev", kind: "ev", status: "included" },
        { id: "hp", kind: "heat-pump", status: "included" },
      ],
    });
    const planned = modelConsumption({
      ...base,
      noLargeLoads: false,
      loads: [
        { id: "ev", kind: "ev", status: "planned", annualKwh: 2000 },
        { id: "hp", kind: "heat-pump", status: "planned", annualKwh: 4000 },
        { id: "ac", kind: "air-conditioning", status: "planned", annualKwh: 800 },
      ],
    });
    expect(included.projectedAnnualKwh).toBe(4800);
    expect(planned.projectedAnnualKwh).toBe(11600);
    expect(planned.monthlyKwh[0]).toBeGreaterThan(planned.monthlyKwh[5]);
    const onlyAc = modelConsumption({
      ...base,
      noLargeLoads: false,
      loads: [{ id: "ac", kind: "air-conditioning", status: "planned", annualKwh: 800 }],
    });
    expect(onlyAc.monthlyKwh[6]).toBeGreaterThan(onlyAc.monthlyKwh[0]);
  });

  it("makes no-large-loads mutually exclusive", () => {
    expect(
      normalizeLargeLoads({
        ...base,
        noLargeLoads: true,
        loads: [{ id: "ev", kind: "ev", status: "planned" }],
      }),
    ).toEqual([]);
  });

  it("caps candidates at roof capacity and flags single phase", () => {
    expect(deriveRoofCapacityKwp({ ...base, maxPanelCount: 10, usableRoofAreaM2: undefined })).toBe(
      4.5,
    );
    const result = recommendSystemV2(
      { ...base, usableRoofAreaM2: undefined, maxPanelCount: 10, connectionType: "single-phase" },
      profile,
    );
    expect(result.candidates.every((candidate) => candidate.capacityKwp <= 4.5)).toBe(true);
    const larger = recommendSystemV2(
      { ...base, monthlyConsumptionKwh: 1000, connectionType: "single-phase" },
      profile,
    );
    expect(
      larger.candidates.some((candidate) =>
        candidate.warnings.some((warning) => warning.includes("monofazat")),
      ),
    ).toBe(true);
  });

  it("distinguishes apartment constraints from a house", () => {
    const apartment = recommendSystemV2({ ...base, buildingType: "apartment" }, profile);
    const house = recommendSystemV2(base, profile);
    expect(apartment.preferred.warnings.join(" ")).toContain("asociației");
    expect(house.preferred.warnings.join(" ")).not.toContain("asociației");
  });

  it("models battery energy without increasing PV and without guaranteeing better payback", () => {
    const noBattery = recommendSystemV2({ ...base, batteryPreference: "none" }, profile);
    const battery = recommendSystemV2({ ...base, batteryPreference: "practical" }, profile);
    expect(battery.preferred.annualProductionKwh).toBe(noBattery.preferred.annualProductionKwh);
    expect(battery.preferred.selfConsumptionRatio).toBeGreaterThanOrEqual(
      noBattery.preferred.selfConsumptionRatio,
    );
    expect(battery.preferred.paybackYears.max).toBeGreaterThanOrEqual(
      noBattery.preferred.paybackYears.min,
    );
    expect(battery.preferred.flow.batteryDischargeKwh).toBeLessThanOrEqual(
      battery.preferred.flow.batteryChargeKwh,
    );
    expect(battery.preferred.flow.batteryLossKwh).toBeGreaterThanOrEqual(0);
  });

  it("keeps energy balances and financial outputs finite and non-negative", () => {
    const result = recommendSystemV2(base, profile);
    expect(assertFiniteResult(result)).toBe(true);
    for (const candidate of result.candidates) {
      expect(candidate.flow.exportedKwh).toBeGreaterThanOrEqual(0);
      expect(candidate.flow.gridImportKwh).toBeGreaterThanOrEqual(0);
      expect(candidate.flow.directSelfConsumedKwh).toBeLessThanOrEqual(
        candidate.flow.productionKwh,
      );
      expect(candidate.flow.directSelfConsumedKwh).toBeLessThanOrEqual(
        result.consumption.projectedAnnualKwh,
      );
      expect(candidate.investmentLei.min).toBeLessThan(candidate.investmentLei.max);
      expect(candidate.paybackYears.min).toBeGreaterThanOrEqual(0);
    }
  });

  it("reduces confidence for imprecise location and fallback", () => {
    const exact = recommendSystemV2(base, profile);
    const fallback = recommendSystemV2(
      { ...base, locationPrecision: "county" },
      { ...profile, source: "fallback", locationPrecision: "county", fallbackReason: "timeout" },
    );
    expect(fallback.confidence.score).toBeLessThan(exact.confidence.score);
    expect(fallback.productionSource).toBe("fallback");
  });

  it("changes production when the location-specific profile changes", () => {
    const southProfile = profile;
    const northRomaniaProfile = {
      ...profile,
      normalizedMonthlyKwhPerKwp: profile.normalizedMonthlyKwhPerKwp.map((value) => value * 0.88),
      normalizedAnnualKwhPerKwp: profile.normalizedAnnualKwhPerKwp * 0.88,
    };
    expect(recommendSystemV2(base, southProfile).preferred.annualProductionKwh).not.toBe(
      recommendSystemV2(base, northRomaniaProfile).preferred.annualProductionKwh,
    );
  });
});
