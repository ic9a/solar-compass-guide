import { RECOMMENDATION_ASSUMPTIONS_V2 as A } from "./assumptions";
import type {
  BatteryScenarioResult,
  CandidateSystemResult,
  EconomicScenarios,
  EnergyFlow,
  FutureLoad,
  NormalizedConsumption,
  Range,
  RecommendationConfidence,
  RecommendationInputV2,
  RecommendationResultV2,
  SolarProductionProfile,
} from "./types";

const RESIDENTIAL_SEASON = [
  0.095, 0.088, 0.085, 0.078, 0.074, 0.071, 0.074, 0.077, 0.08, 0.086, 0.094, 0.098,
];
const COMMERCIAL_SEASON = [
  0.082, 0.079, 0.083, 0.084, 0.086, 0.086, 0.084, 0.083, 0.084, 0.085, 0.081, 0.079,
];
const HEAT_PUMP_SEASON = [
  0.19, 0.17, 0.12, 0.07, 0.035, 0.02, 0.015, 0.02, 0.045, 0.08, 0.115, 0.17,
];
const AC_SEASON = [0.01, 0.01, 0.02, 0.04, 0.08, 0.17, 0.24, 0.23, 0.13, 0.05, 0.015, 0.005];

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const round = (value: number, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const scale = (annual: number, profile: number[]) => profile.map((share) => annual * share);
const addMonthly = (left: number[], right: number[]) =>
  left.map((value, index) => value + right[index]);

export function normalizeLargeLoads(input: RecommendationInputV2): FutureLoad[] {
  if (input.noLargeLoads) return [];
  return input.loads.filter((load) => load.kind && load.status);
}

function loadAnnualKwh(load: FutureLoad) {
  if (load.status === "included") return 0;
  if (load.annualKwh && load.annualKwh > 0) return load.annualKwh;
  if (load.monthlyKwh && load.monthlyKwh > 0) return load.monthlyKwh * 12;
  if (load.ratedKw && load.hoursPerMonth) return load.ratedKw * load.hoursPerMonth * 12;
  if (load.kind === "ev") {
    return (
      (((load.evKmPerYear ?? 12000) * (load.evEfficiencyKwhPer100Km ?? 18)) / 100) *
      ((load.evHomeChargingPercent ?? 80) / 100)
    );
  }
  if (load.kind === "heat-pump") return load.primaryHeating === false ? 1800 : 4200;
  if (load.kind === "boiler") return 1800;
  if (load.kind === "air-conditioning") return 700;
  return 0;
}

function loadProfile(load: FutureLoad) {
  if (load.kind === "heat-pump") return HEAT_PUMP_SEASON;
  if (load.kind === "air-conditioning") return AC_SEASON;
  return COMMERCIAL_SEASON;
}

export function modelConsumption(input: RecommendationInputV2): NormalizedConsumption {
  const warnings: string[] = [];
  let historicalAnnualKwh = 0;
  let source: NormalizedConsumption["source"];
  let monthly: number[];

  if (input.consumptionMode === "monthly-history" && input.monthlyHistoryKwh?.length === 12) {
    monthly = input.monthlyHistoryKwh.map((value) => Math.max(0, value));
    historicalAnnualKwh = sum(monthly);
    source = "measured-history";
  } else if (input.consumptionMode === "annual-kwh" && (input.annualConsumptionKwh ?? 0) > 0) {
    historicalAnnualKwh = input.annualConsumptionKwh!;
    source = "annual-kwh";
    monthly = scale(
      historicalAnnualKwh,
      input.usageProfile === "commercial" ? COMMERCIAL_SEASON : RESIDENTIAL_SEASON,
    );
  } else if (input.consumptionMode === "monthly-kwh" && (input.monthlyConsumptionKwh ?? 0) > 0) {
    historicalAnnualKwh = input.monthlyConsumptionKwh! * 12;
    source = "monthly-kwh";
    monthly = scale(
      historicalAnnualKwh,
      input.usageProfile === "commercial" ? COMMERCIAL_SEASON : RESIDENTIAL_SEASON,
    );
  } else if (input.consumptionMode === "bill" && (input.monthlyBillLei ?? 0) > 0) {
    const automaticEstimate = input.monthlyBillLei! / A.electricity.billConversionLeiPerKwh;
    const corrected = input.editedBillEstimateKwh;
    const monthlyEstimate = corrected ?? automaticEstimate;
    historicalAnnualKwh = monthlyEstimate * 12;
    source = corrected ? "bill-user-corrected" : "bill-estimate";
    monthly = scale(
      historicalAnnualKwh,
      input.usageProfile === "commercial" ? COMMERCIAL_SEASON : RESIDENTIAL_SEASON,
    );
    warnings.push(
      corrected
        ? `Consum lunar corectat de utilizator: ${round(corrected)} kWh/lună. Estimarea inițială din factură a fost ${round(automaticEstimate)} kWh/lună.`
        : `Consum estimat din factură la ${A.electricity.billConversionLeiPerKwh} lei/kWh.`,
    );
  } else {
    throw new Error("Consumul minim necesar nu este completat.");
  }

  let futureAnnualKwh = 0;
  for (const load of normalizeLargeLoads(input)) {
    const annual = loadAnnualKwh(load);
    if (annual <= 0 && load.status !== "included") {
      warnings.push(`Consum insuficient definit pentru ${load.label ?? load.kind}.`);
      continue;
    }
    futureAnnualKwh += annual;
    monthly = addMonthly(monthly, scale(annual, loadProfile(load)));
  }

  return {
    historicalAnnualKwh: round(historicalAnnualKwh),
    futureAnnualKwh: round(futureAnnualKwh),
    projectedAnnualKwh: round(historicalAnnualKwh + futureAnnualKwh),
    monthlyKwh: monthly.map((value) => round(value)),
    source,
    warnings,
  };
}

export function deriveRoofCapacityKwp(input: RecommendationInputV2) {
  const byPanels = input.maxPanelCount ? input.maxPanelCount * A.pv.panelNominalKwp : Infinity;
  const byArea = input.usableRoofAreaM2
    ? Math.floor(input.usableRoofAreaM2 / A.pv.panelAreaM2) * A.pv.panelNominalKwp
    : Infinity;
  const cap = Math.min(byPanels, byArea);
  return Number.isFinite(cap) ? Math.max(0, round(cap, 2)) : undefined;
}

export function adjustedProductionProfile(
  profile: SolarProductionProfile,
  input: RecommendationInputV2,
) {
  const orientation = profile.orientationIncluded
    ? 1
    : A.pv.orientationFactor[input.orientation ?? "south"];
  const shading = profile.shadingIncluded ? 1 : A.pv.shadingFactor[input.shading ?? "none"];
  return profile.normalizedMonthlyKwhPerKwp.map((value) => value * orientation * shading);
}

function energyFlow(
  production: number[],
  consumption: number[],
  daylightShare: number,
  batteryUsableKwh = 0,
): EnergyFlow {
  let direct = 0;
  let exported = 0;
  let grid = 0;
  let charge = 0;
  let discharge = 0;
  for (let i = 0; i < 12; i += 1) {
    const monthlyConsumption = consumption[i];
    const daylightDemand = monthlyConsumption * daylightShare;
    const monthlyDirect = Math.min(production[i], daylightDemand);
    const surplus = Math.max(0, production[i] - monthlyDirect);
    const eveningDemand = Math.max(0, monthlyConsumption - monthlyDirect);
    const monthlyBatteryInput = Math.min(surplus, batteryUsableKwh * 30);
    const monthlyBatteryOutput = Math.min(
      eveningDemand,
      monthlyBatteryInput * A.battery.roundTripEfficiency,
    );
    direct += monthlyDirect;
    charge += monthlyBatteryInput;
    discharge += monthlyBatteryOutput;
    exported += surplus - monthlyBatteryInput;
    grid += eveningDemand - monthlyBatteryOutput;
  }
  return {
    productionKwh: round(sum(production)),
    directSelfConsumedKwh: round(direct),
    exportedKwh: round(Math.max(0, exported)),
    gridImportKwh: round(Math.max(0, grid)),
    batteryChargeKwh: round(charge),
    batteryDischargeKwh: round(discharge),
    batteryLossKwh: round(Math.max(0, charge - discharge)),
  };
}

function investment(capacityKwp: number, batteryKwh = 0): Range {
  const hybrid = batteryKwh > 0 ? A.investment.hybridInverterExtraLei : { min: 0, max: 0 };
  return {
    min: round(
      capacityKwp * A.investment.onGridLeiPerKwp.min +
        A.investment.fixedExtrasLei.min +
        hybrid.min +
        batteryKwh * A.investment.batteryLeiPerUsableKwh.min,
    ),
    max: round(
      capacityKwp * A.investment.onGridLeiPerKwp.max +
        A.investment.fixedExtrasLei.max +
        hybrid.max +
        batteryKwh * A.investment.batteryLeiPerUsableKwh.max,
    ),
  };
}

const payback = (cost: Range, annualSavings: Range): Range => ({
  min: round(cost.min / Math.max(annualSavings.max, 1), 1),
  max: round(cost.max / Math.max(annualSavings.min, 1), 1),
});

function coherentEconomics(capacityKwp: number, flow: EnergyFlow, batteryKwh = 0): EconomicScenarios {
  const costs = investment(capacityKwp, batteryKwh);
  const baseCost = round((costs.min + costs.max) / 2);
  const scenario = (
    investmentLei: number,
    importValue: number,
    exportValue: number,
    productionFactor: number,
  ) => {
    const directConsumptionValueLei = round(
      (flow.directSelfConsumedKwh + flow.batteryDischargeKwh) * productionFactor * importValue,
    );
    const exportedEnergyValueLei = round(flow.exportedKwh * productionFactor * exportValue);
    const annualSavingsLei = round(directConsumptionValueLei + exportedEnergyValueLei);
    return {
      investmentLei,
      annualSavingsLei,
      paybackYears: round(investmentLei / Math.max(annualSavingsLei, 1), 1),
      directConsumptionValueLei,
      exportedEnergyValueLei,
    };
  };
  return {
    conservative: scenario(
      costs.max,
      A.electricity.importTariffLeiPerKwh.conservative,
      A.electricity.exportValueLeiPerKwh.conservative,
      0.95,
    ),
    base: scenario(
      baseCost,
      A.electricity.importTariffLeiPerKwh.base,
      A.electricity.exportValueLeiPerKwh.base,
      1,
    ),
    optimistic: scenario(
      costs.min,
      A.electricity.importTariffLeiPerKwh.optimistic,
      A.electricity.exportValueLeiPerKwh.optimistic,
      1.03,
    ),
  };
}

function rangeFromEconomics(economics: EconomicScenarios) {
  return {
    investmentLei: { min: economics.optimistic.investmentLei, max: economics.conservative.investmentLei },
    annualSavingsLei: { min: economics.conservative.annualSavingsLei, max: economics.optimistic.annualSavingsLei },
    paybackYears: { min: economics.optimistic.paybackYears, max: economics.conservative.paybackYears },
  };
}

function practicalBatteryKwh(
  consumption: NormalizedConsumption,
  input: RecommendationInputV2,
  noBatteryFlow: EnergyFlow,
) {
  const eveningShare = 1 - A.selfConsumption.directDaylightShare[input.usageProfile];
  const dailyEvening = (consumption.projectedAnnualKwh / 365) * eveningShare;
  const usefulDailySurplus = noBatteryFlow.exportedKwh / 220;
  const selfConsumptionNeed = Math.min(dailyEvening * 0.65, usefulDailySurplus * 0.9);
  const backupNeed =
    input.batteryPreference === "backup"
      ? (input.backupEssentialLoadKw ?? 0.8) * (input.backupHours ?? 4)
      : 0;
  const required = Math.max(selfConsumptionNeed, backupNeed);
  if (required < 1.5) return 0;
  return round(clamp(Math.ceil(required), 2, input.batteryPreference === "backup" ? 30 : 15), 1);
}

function evaluateCandidate(
  capacityKwp: number,
  input: RecommendationInputV2,
  consumption: NormalizedConsumption,
  normalizedProduction: number[],
  roofCapacityKwp?: number,
): CandidateSystemResult {
  const panels = Math.round(capacityKwp / A.pv.panelNominalKwp);
  const production = normalizedProduction.map((value) => value * capacityKwp);
  const baseDaylightShare = A.selfConsumption.directDaylightShare[input.usageProfile];
  const futureTiming = normalizeLargeLoads(input)
    .filter((load) => load.status !== "included")
    .reduce(
      (total, load) => {
        const annual = loadAnnualKwh(load);
        const share =
          load.timing === "day" || load.timing === "commercial"
            ? 0.72
            : load.timing === "evening"
              ? 0.15
              : load.timing === "constant"
                ? 0.48
                : 0.35;
        return total + annual * share;
      },
      0,
    );
  const daylightShare = clamp(
    (consumption.historicalAnnualKwh * baseDaylightShare + futureTiming) /
      Math.max(consumption.projectedAnnualKwh, 1),
    0.1,
    0.8,
  );
  const noBatteryFlow = energyFlow(production, consumption.monthlyKwh, daylightShare);
  const batteryKwh = practicalBatteryKwh(consumption, input, noBatteryFlow);
  const batteryFlow = energyFlow(production, consumption.monthlyKwh, daylightShare, batteryKwh);
  const noBatteryEconomics = coherentEconomics(capacityKwp, noBatteryFlow);
  const withBatteryEconomics = coherentEconomics(capacityKwp, batteryFlow, batteryKwh);
  const noBatteryRanges = rangeFromEconomics(noBatteryEconomics);
  const withBatteryRanges = rangeFromEconomics(withBatteryEconomics);
  const noBatteryScenario: BatteryScenarioResult = {
    kind: "none",
    usableCapacityKwh: { min: 0, max: 0 },
    flow: noBatteryFlow,
    investmentLei: noBatteryRanges.investmentLei,
    annualSavingsLei: noBatteryRanges.annualSavingsLei,
    paybackYears: noBatteryRanges.paybackYears,
    conclusion: "Investiție inițială mai mică și, de regulă, amortizare mai rapidă.",
    economics: noBatteryEconomics,
  };
  const withBatteryScenario: BatteryScenarioResult = {
    kind: "practical",
    usableCapacityKwh: batteryKwh > 0 ? { min: Math.max(2, batteryKwh - 1), max: batteryKwh + 1 } : { min: 0, max: 0 },
    flow: batteryFlow,
    investmentLei: withBatteryRanges.investmentLei,
    annualSavingsLei: withBatteryRanges.annualSavingsLei,
    paybackYears: withBatteryRanges.paybackYears,
    economics: withBatteryEconomics,
    conclusion:
      input.batteryPreference === "backup"
        ? "Pentru backup sunt necesare ieșire EPS compatibilă, baterie dimensionată corect și circuite esențiale dedicate."
        : "Bateria mută o parte din surplus către seară, dar crește investiția.",
  };
  // Compare is neutral: capacity ranking and headline economics use the
  // no-battery alternative, while both independent scenarios remain visible.
  const batteryScenario =
    input.batteryPreference === "practical" || input.batteryPreference === "backup"
      ? withBatteryScenario
      : noBatteryScenario;
  const selectedFlow = batteryScenario.flow;
  const selectedCost = batteryScenario.investmentLei;
  const selectedSavings = batteryScenario.annualSavingsLei;
  const coverage = Math.min(1.5, selectedFlow.productionKwh / consumption.projectedAnnualKwh);
  const exportRatio = selectedFlow.exportedKwh / Math.max(selectedFlow.productionKwh, 1);
  const target = input.goal === "independence" || input.goal === "ev" ? 1.05 : 0.85;
  let score =
    100 -
    Math.abs(coverage - target) * 60 -
    exportRatio * (input.goal === "independence" ? 10 : 28);
  if (input.goal === "payback") score -= payback(selectedCost, selectedSavings).max * 1.5;
  const roofFeasible = roofCapacityKwp === undefined || capacityKwp <= roofCapacityKwp + 0.001;
  if (!roofFeasible) score -= 500;
  const warnings: string[] = [];
  if (!roofFeasible) warnings.push("Depășește capacitatea estimată a acoperișului.");
  if (input.connectionType === "single-phase" && capacityKwp > 6)
    warnings.push("Necesită verificare tehnică pentru branșamentul monofazat.");
  if (input.connectionType === "unknown" && capacityKwp >= 8)
    warnings.push("Tipul branșamentului trebuie confirmat.");
  if (input.buildingType === "apartment")
    warnings.push("Acoperișul comun și acordurile asociației trebuie verificate.");
  if (input.batteryPreference === "backup") {
    const requestedUsable =
      ((input.backupEssentialLoadKw ?? 0.8) * (input.backupHours ?? 4)) /
      (A.battery.depthOfDischarge * A.battery.roundTripEfficiency);
    if (requestedUsable > 30) {
      warnings.push(
        `Autonomia solicitată necesită aproximativ ${round(requestedUsable, 1)} kWh utili și depășește limita orientativă analizată de 30 kWh.`,
      );
    }
  }
  return {
    capacityKwp,
    panelCount: panels,
    roofFeasible,
    monthlyProductionKwh: production.map((value) => round(value)),
    annualProductionKwh: round(sum(production)),
    flow: selectedFlow,
    coverageRatio: round(coverage, 2),
    selfConsumptionRatio: round(
      (selectedFlow.directSelfConsumedKwh + selectedFlow.batteryDischargeKwh) /
        Math.max(selectedFlow.productionKwh, 1),
      2,
    ),
    investmentLei: batteryScenario.investmentLei,
    annualSavingsLei: batteryScenario.annualSavingsLei,
    paybackYears: batteryScenario.paybackYears,
    economics: batteryScenario.economics,
    score: round(score, 2),
    warnings,
    battery: batteryScenario,
    scenarios: { withoutBattery: noBatteryScenario, withBattery: withBatteryScenario },
  };
}

export function calculateConfidence(
  input: RecommendationInputV2,
  profile: SolarProductionProfile,
): RecommendationConfidence {
  let score = 100;
  const improvements: string[] = [];
  if (input.consumptionMode === "bill") {
    score -= 22;
    improvements.push("Adaugă consumul real în kWh.");
  } else if (input.consumptionMode !== "monthly-history") {
    score -= 10;
    improvements.push("Adaugă consumul pe 12 luni.");
  }
  if (input.locationPrecision !== "precise") {
    score -= 18;
    improvements.push("Selectează locația exactă.");
  }
  if (input.orientation === "unknown") {
    score -= 14;
    improvements.push("Confirmă orientarea acoperișului; aceasta poate schimba mărimea sistemului.");
  }
  if (input.shading === "unknown") {
    score -= 16;
    improvements.push("Verifică umbra reală; aceasta poate schimba producția și estimarea financiară.");
  }
  if (!input.tiltDeg) {
    score -= 6;
    improvements.push("Confirmă înclinația acoperișului.");
  }
  if (!deriveRoofCapacityKwp(input)) {
    score -= 14;
    improvements.push("Confirmă suprafața utilă a acoperișului.");
  }
  if (input.connectionType === "unknown") {
    score -= 8;
    improvements.push("Confirmă branșamentul monofazat sau trifazat.");
  }
  if (profile.source === "fallback") {
    score -= 20;
    improvements.push("Reîncearcă estimarea PVGIS.");
  }
  for (const load of normalizeLargeLoads(input)) {
    if (load.status === "included") continue;
    if (load.kind === "ev") {
      const missing = [
        load.evKmPerYear,
        load.evEfficiencyKwhPer100Km,
        load.evHomeChargingPercent,
        load.timing,
      ].filter((value) => value === undefined).length;
      if (missing) {
        score -= Math.min(12, missing * 3);
        improvements.push("Confirmă kilometrii, eficiența, încărcarea acasă și momentul încărcării EV.");
      }
    } else if (!load.annualKwh && !load.monthlyKwh && !(load.ratedKw && load.hoursPerMonth)) {
      score -= 8;
      improvements.push(`Confirmă consumul estimat pentru ${load.label ?? load.kind}.`);
    }
  }
  if (input.batteryPreference === "backup" && (!input.backupEssentialLoadKw || !input.backupHours)) {
    score -= 10;
    improvements.push("Confirmă puterea circuitelor esențiale și autonomia dorită pentru backup.");
  }
  score = clamp(score, 0, 100);
  return {
    level: score >= 78 ? "high" : score >= 52 ? "medium" : "low",
    score,
    improvements: Array.from(new Set(improvements)).slice(0, 3),
  };
}

export function productionUncertaintyPercent(
  input: RecommendationInputV2,
  profile: SolarProductionProfile,
) {
  let percent = 5;
  if (input.locationPrecision !== "precise") percent += 4;
  if (input.orientation === "unknown") percent += 8;
  if (!input.tiltDeg) percent += 3;
  if (input.shading === "unknown") percent += 10;
  else if (input.shading === "severe") percent += 5;
  if (profile.source === "fallback") percent += 6;
  return percent;
}

export function recommendSystemV2(
  input: RecommendationInputV2,
  profile: SolarProductionProfile,
  calculatedAt = new Date().toISOString(),
): RecommendationResultV2 {
  const consumption = modelConsumption(input);
  const roofCapacityKwp = deriveRoofCapacityKwp(input);
  const normalizedProduction = adjustedProductionProfile(profile, input);
  const roofPanelLimit =
    input.maxPanelCount ??
    (input.usableRoofAreaM2 ? Math.floor(input.usableRoofAreaM2 / A.pv.panelAreaM2) : undefined);
  const maximumPanels = Math.min(44, roofPanelLimit ?? 34);
  const panelCounts = Array.from(
    { length: Math.max(0, maximumPanels - 3) },
    (_, index) => index + 4,
  );
  const candidates = panelCounts
    .map((panelCount) => round(panelCount * A.pv.panelNominalKwp, 2))
    .map((capacity) =>
      evaluateCandidate(capacity, input, consumption, normalizedProduction, roofCapacityKwp),
    )
    .filter((candidate) => candidate.roofFeasible);
  if (!candidates.length)
    throw new Error("Suprafața introdusă nu permite un sistem fotovoltaic rezidențial suficient de mare pentru o recomandare utilă.");
  candidates.sort((left, right) => right.score - left.score);
  const preferred = candidates[0];
  const bySize = [...candidates].sort((left, right) => left.capacityKwp - right.capacityKwp);
  const index = bySize.findIndex((candidate) => candidate.capacityKwp === preferred.capacityKwp);
  const smaller = index > 0 ? bySize[index - 1] : undefined;
  const larger = index < bySize.length - 1 ? bySize[index + 1] : undefined;
  const confidence = calculateConfidence(input, profile);
  const warnings = [...consumption.warnings, ...preferred.warnings];
  if (!roofCapacityKwp) warnings.push("Capacitatea acoperișului trebuie verificată.");
  if (input.shading === "severe")
    warnings.push("Umbrirea severă necesită un studiu dedicat de umbrire.");
  if (input.orientation === "north")
    warnings.push("Orientarea nord limitează puternic fezabilitatea.");
  return {
    assumptionsVersion: A.version,
    benchmarkVersion: "energy-model-2026.07",
    calculatedAt,
    productionSource: profile.source,
    locationPrecision: input.locationPrecision,
    suitability:
      input.orientation === "north" || input.shading === "severe"
        ? "poor"
        : input.shading === "moderate"
          ? "limited"
          : input.orientation === "south"
            ? "very-good"
            : "good",
    confidence,
    consumption,
    preferred,
    smaller,
    larger,
    uncertainty: (() => {
      const productionPercent = productionUncertaintyPercent(input, profile) / 100;
      return {
        productionKwh: {
          min: round(preferred.annualProductionKwh * (1 - productionPercent)),
          max: round(preferred.annualProductionKwh * (1 + productionPercent)),
        },
        marketCostLei: preferred.investmentLei,
        economicPaybackYears: {
          min: preferred.economics.optimistic.paybackYears,
          max: preferred.economics.conservative.paybackYears,
        },
        productionDrivers: ["vreme", "orientare", "înclinație", "umbrire"],
        marketCostDrivers: ["echipamente", "complexitatea montajului", "servicii incluse"],
        userInputDrivers: confidence.improvements,
      };
    })(),
    recommendedRangeKwp: (() => {
      const acceptable = bySize.filter(
        (candidate) =>
          preferred.score - candidate.score <= 10 &&
          candidate.coverageRatio >= 0.65 &&
          candidate.coverageRatio <= 1.25 &&
          candidate.paybackYears.max <= preferred.paybackYears.max + 3,
      );
      return {
        min: acceptable[0]?.capacityKwp ?? preferred.capacityKwp,
        max: acceptable.at(-1)?.capacityKwp ?? preferred.capacityKwp,
      };
    })(),
    candidates: bySize,
    reasons: [
      `Pentru datele introduse, ${preferred.panelCount} panouri cu o putere totală de ${preferred.capacityKwp} kWp oferă cel mai bun echilibru între consum, investiție și surplus.`,
      smaller
        ? `Varianta mai mică, de ${smaller.capacityKwp} kWp, ar acoperi mai puțin din consum.`
        : "O variantă mai mică nu ar oferi o acoperire utilă pentru consumul introdus.",
      larger
        ? `Varianta mai mare, de ${larger.capacityKwp} kWp, ar produce mai mult surplus fără ca economiile să crească în aceeași proporție.`
        : "O capacitate mai mare nu este justificată de consumul și spațiul introduse.",
      "Umbra reală, spațiul disponibil și orele în care consumi energia pot modifica recomandarea.",
    ],
    warnings,
  };
}

export function assertFiniteResult(result: RecommendationResultV2) {
  const visit = (value: unknown): boolean => {
    if (typeof value === "number") return Number.isFinite(value) && value >= 0;
    if (Array.isArray(value)) return value.every(visit);
    if (value && typeof value === "object") return Object.values(value).every(visit);
    return true;
  };
  return visit(result);
}
