import type { SolarLocation } from "@/lib/solarLocation";

export type ConsumptionMode = "monthly-kwh" | "annual-kwh" | "monthly-history" | "bill";
export type UsageProfile = "day" | "evening" | "constant" | "commercial";
export type LoadStatus = "included" | "not-included" | "planned";
export type LoadKind = "ev" | "heat-pump" | "boiler" | "air-conditioning" | "workshop" | "other";
export type Orientation =
  "south" | "south-east" | "south-west" | "east-west" | "east" | "west" | "north" | "unknown";
export type Shading = "none" | "light" | "moderate" | "severe" | "unknown";
export type BuildingType = "house" | "apartment" | "small-commercial";
export type ConnectionType = "single-phase" | "three-phase" | "unknown";
export type Goal = "bill" | "payback" | "independence" | "backup" | "ev";
export type ConfidenceLevel = "high" | "medium" | "low";
export type Suitability = "very-good" | "good" | "limited" | "poor";

export interface FutureLoad {
  id: string;
  kind: LoadKind;
  status: LoadStatus;
  annualKwh?: number;
  monthlyKwh?: number;
  ratedKw?: number;
  hoursPerMonth?: number;
  evKmPerYear?: number;
  evEfficiencyKwhPer100Km?: number;
  evHomeChargingPercent?: number;
  timing?: UsageProfile;
  primaryHeating?: boolean;
  label?: string;
}

export interface RecommendationInputV2 {
  schemaVersion: 2;
  consumptionMode: ConsumptionMode;
  monthlyConsumptionKwh?: number;
  annualConsumptionKwh?: number;
  monthlyHistoryKwh?: number[];
  monthlyBillLei?: number;
  editedBillEstimateKwh?: number;
  usageProfile: UsageProfile;
  loads: FutureLoad[];
  noLargeLoads: boolean;
  location?: SolarLocation;
  locationPrecision: "precise" | "county" | "missing";
  orientation?: Orientation;
  tiltDeg?: number;
  shading?: Shading;
  roofType?: string;
  usableRoofAreaM2?: number;
  maxPanelCount?: number;
  roofSections?: number;
  buildingType?: BuildingType;
  connectionType: ConnectionType;
  goal?: Goal;
  batteryPreference: "compare" | "none" | "practical" | "backup";
  backupEssentialLoadKw?: number;
  backupHours?: number;
}

export type RecommendationDraftInput = Omit<
  RecommendationInputV2,
  "consumptionMode" | "usageProfile" | "noLargeLoads" | "batteryPreference"
> & {
  consumptionMode?: ConsumptionMode;
  usageProfile?: UsageProfile;
  noLargeLoads?: boolean;
  batteryPreference?: RecommendationInputV2["batteryPreference"];
};

export interface NormalizedConsumption {
  historicalAnnualKwh: number;
  futureAnnualKwh: number;
  projectedAnnualKwh: number;
  monthlyKwh: number[];
  source: "measured-history" | "annual-kwh" | "monthly-kwh" | "bill-estimate" | "bill-user-corrected";
  warnings: string[];
}

export interface SolarProductionProfile {
  source: "PVGIS" | "cache" | "fallback";
  normalizedMonthlyKwhPerKwp: number[];
  normalizedAnnualKwhPerKwp: number;
  locationPrecision: "precise" | "county";
  fetchedAt: string;
  fallbackReason?: string;
  orientationIncluded?: boolean;
  shadingIncluded?: boolean;
}

export interface Range {
  min: number;
  max: number;
}

export interface EnergyFlow {
  productionKwh: number;
  directSelfConsumedKwh: number;
  exportedKwh: number;
  gridImportKwh: number;
  batteryChargeKwh: number;
  batteryDischargeKwh: number;
  batteryLossKwh: number;
}

export interface EconomicScenario {
  investmentLei: number;
  annualSavingsLei: number;
  paybackYears: number;
  directConsumptionValueLei: number;
  exportedEnergyValueLei: number;
}

export interface EconomicScenarios {
  conservative: EconomicScenario;
  base: EconomicScenario;
  optimistic: EconomicScenario;
}

export interface BatteryScenarioResult {
  kind: "none" | "practical";
  usableCapacityKwh: Range;
  flow: EnergyFlow;
  investmentLei: Range;
  annualSavingsLei: Range;
  paybackYears: Range;
  conclusion: string;
  economics: EconomicScenarios;
}

export interface CandidateSystemResult {
  capacityKwp: number;
  panelCount: number;
  roofFeasible: boolean;
  monthlyProductionKwh: number[];
  annualProductionKwh: number;
  flow: EnergyFlow;
  coverageRatio: number;
  selfConsumptionRatio: number;
  investmentLei: Range;
  annualSavingsLei: Range;
  paybackYears: Range;
  economics: EconomicScenarios;
  score: number;
  warnings: string[];
  battery: BatteryScenarioResult;
  scenarios: {
    withoutBattery: BatteryScenarioResult;
    withBattery: BatteryScenarioResult;
  };
}

export interface RecommendationConfidence {
  level: ConfidenceLevel;
  score: number;
  improvements: string[];
}

export interface RecommendationResultV2 {
  assumptionsVersion: string;
  benchmarkVersion: string;
  calculatedAt: string;
  productionSource: SolarProductionProfile["source"];
  locationPrecision: RecommendationInputV2["locationPrecision"];
  suitability: Suitability;
  confidence: RecommendationConfidence;
  consumption: NormalizedConsumption;
  preferred: CandidateSystemResult;
  smaller?: CandidateSystemResult;
  larger?: CandidateSystemResult;
  recommendedRangeKwp: Range;
  uncertainty: {
    productionKwh: Range;
    marketCostLei: Range;
    economicPaybackYears: Range;
    productionDrivers: string[];
    marketCostDrivers: string[];
    userInputDrivers: string[];
  };
  candidates: CandidateSystemResult[];
  reasons: string[];
  warnings: string[];
}
