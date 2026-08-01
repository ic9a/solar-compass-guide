import { z } from "zod";
import { RECOMMENDATION_ASSUMPTIONS_V2 } from "./assumptions";
import type { RecommendationDraftInput } from "./types";

export const RECOMMENDATION_DRAFT_KEY = "raportsolar.recommendation-v2.draft";
export const RECOMMENDATION_DRAFT_VERSION = 1;

const finiteNumber = z.number().finite();
const optionalPositive = finiteNumber.positive().optional();
const loadSchema = z
  .object({
    id: z.string().min(1).max(80),
    kind: z.enum(["ev", "heat-pump", "boiler", "air-conditioning", "workshop", "other"]),
    status: z.enum(["included", "not-included", "planned"]),
    annualKwh: optionalPositive,
    monthlyKwh: optionalPositive,
    ratedKw: optionalPositive,
    hoursPerMonth: optionalPositive,
    evKmPerYear: optionalPositive,
    evEfficiencyKwhPer100Km: optionalPositive,
    evHomeChargingPercent: finiteNumber.min(0).max(100).optional(),
    timing: z.enum(["day", "evening", "constant", "commercial"]).optional(),
    primaryHeating: z.boolean().optional(),
    label: z.string().max(120).optional(),
  })
  .strict();

const locationSchema = z
  .object({
    lat: finiteNumber.min(43.4).max(48.4),
    lng: finiteNumber.min(20.1).max(30.1),
    countyCode: z.string().min(1).max(4),
    countyName: z.string().min(1).max(80),
    locality: z.string().max(120).optional(),
    displayLabel: z.string().min(1).max(180),
  })
  .strict();

export const recommendationInputSchema = z
  .object({
    schemaVersion: z.literal(2),
    consumptionMode: z.enum(["monthly-kwh", "annual-kwh", "monthly-history", "bill"]).optional(),
    monthlyConsumptionKwh: optionalPositive,
    annualConsumptionKwh: optionalPositive,
    monthlyHistoryKwh: z.array(finiteNumber.nonnegative()).length(12).optional(),
    monthlyBillLei: optionalPositive,
    editedBillEstimateKwh: optionalPositive,
    usageProfile: z.enum(["day", "evening", "constant", "commercial"]).optional(),
    loads: z.array(loadSchema).max(12),
    noLargeLoads: z.boolean().optional(),
    location: locationSchema.optional(),
    locationPrecision: z.enum(["precise", "county", "missing"]),
    orientation: z
      .enum(["south", "south-east", "south-west", "east-west", "east", "west", "north"])
      .optional(),
    tiltDeg: finiteNumber.min(0).max(70).optional(),
    shading: z.enum(["none", "light", "moderate", "severe"]).optional(),
    roofType: z.string().max(80).optional(),
    usableRoofAreaM2: optionalPositive,
    maxPanelCount: z.number().int().positive().max(200).optional(),
    roofSections: z.number().int().positive().max(20).optional(),
    buildingType: z.enum(["house", "apartment", "small-commercial"]).optional(),
    connectionType: z.enum(["single-phase", "three-phase", "unknown"]),
    goal: z.enum(["bill", "payback", "independence", "backup", "ev"]).optional(),
    batteryPreference: z.enum(["compare", "none", "practical", "backup"]).optional(),
    backupEssentialLoadKw: optionalPositive,
    backupHours: optionalPositive,
  })
  .strict();

const draftSchema = z
  .object({
    persistenceVersion: z.literal(RECOMMENDATION_DRAFT_VERSION),
    engineSchemaVersion: z.literal(2),
    assumptionsVersion: z.string(),
    step: z.number().int().min(1).max(5),
    state: recommendationInputSchema,
  })
  .strict();

export type RecommendationDraft = {
  state: RecommendationDraftInput;
  step: number;
  restored: boolean;
};

function hasConsumption(state: RecommendationDraftInput): boolean {
  return (
    (state.consumptionMode === "monthly-kwh" && (state.monthlyConsumptionKwh ?? 0) >= 50) ||
    (state.consumptionMode === "annual-kwh" && (state.annualConsumptionKwh ?? 0) >= 600) ||
    (state.consumptionMode === "monthly-history" &&
      state.monthlyHistoryKwh?.length === 12 &&
      state.monthlyHistoryKwh.some((value) => value > 0)) ||
    (state.consumptionMode === "bill" && (state.monthlyBillLei ?? 0) >= 50)
  );
}

export function highestCompatibleStep(state: RecommendationDraftInput): number {
  if (!hasConsumption(state)) return 1;
  if (state.noLargeLoads === undefined || (!state.noLargeLoads && state.loads.length === 0)) return 2;
  if (!state.location) return 3;
  if (!state.orientation || !state.shading || !state.buildingType) return 4;
  return 5;
}

export function restoreRecommendationDraft(raw: string | null): RecommendationDraft | null {
  if (!raw) return null;
  try {
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const state: RecommendationDraftInput = {
      ...parsed.data.state,
      loads: parsed.data.state.noLargeLoads ? [] : parsed.data.state.loads,
      locationPrecision: parsed.data.state.location
        ? parsed.data.state.locationPrecision === "missing"
          ? "county"
          : parsed.data.state.locationPrecision
        : "missing",
    };
    return {
      state,
      step: Math.min(parsed.data.step, highestCompatibleStep(state)),
      restored: true,
    };
  } catch {
    return null;
  }
}

export function serializeRecommendationDraft(state: RecommendationDraftInput, step: number): string {
  return JSON.stringify({
    persistenceVersion: RECOMMENDATION_DRAFT_VERSION,
    engineSchemaVersion: 2,
    assumptionsVersion: RECOMMENDATION_ASSUMPTIONS_V2.version,
    step: Math.min(5, Math.max(1, step)),
    state: {
      ...state,
      loads: state.noLargeLoads ? [] : state.loads,
    },
  });
}
