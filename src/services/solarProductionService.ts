// Solar production service — single source of truth for county potential
// and PV production estimates. No unknown/default branches: callers pass
// a valid orientation and shading. Guaranteed non-zero output for any
// systemKwp > 0.

import type {
  Orientation, ProductionEstimate, Shading, SolarCountyPotential,
} from "@/types/solar";
import {
  MONTHLY_DISTRIBUTION, NATIONAL_AVG_KWH_PER_KWP,
  NATIONAL_FALLBACK_KWH_PER_KWP, SEED_COUNTIES,
} from "@/data/seedSolarCountyData";

export const ORIENTATION_FACTOR: Record<Orientation, number> = {
  "sud": 1.00,
  "sud-est": 0.95,
  "sud-vest": 0.95,
  "est-vest": 0.88,
  "est": 0.82,
  "vest": 0.82,
  "ne-nv": 0.65,
  "nord": 0.50,
};

export const SHADING_FACTOR: Record<Shading, number> = {
  "deloc": 1.00,
  "usoara": 0.92,
  "moderata": 0.80,
  "semnificativa": 0.60,
};

export function getCounties(): SolarCountyPotential[] {
  return SEED_COUNTIES;
}

export function getCountyByCode(code: string): SolarCountyPotential | undefined {
  return SEED_COUNTIES.find((c) => c.countyCode === code);
}

export function getNationalAverageKwhPerKwp(): number {
  return NATIONAL_AVG_KWH_PER_KWP;
}

export interface EstimateInput {
  countyCode: string;
  systemKwp: number;
  orientation: Orientation;
  shading: Shading;
}

export function estimateProduction(input: EstimateInput): ProductionEstimate {
  const county = getCountyByCode(input.countyCode);
  const baseYield = county?.annualKwhPerKwp ?? NATIONAL_FALLBACK_KWH_PER_KWP;
  const of = ORIENTATION_FACTOR[input.orientation];
  const sf = SHADING_FACTOR[input.shading];
  const annual = Math.max(1, Math.round(baseYield * input.systemKwp * of * sf));

  const distribution = county?.monthlyDistribution ?? MONTHLY_DISTRIBUTION;
  const monthly = distribution.map((p) => Math.max(1, Math.round(annual * p)));

  let peakMonthIndex = 0;
  for (let i = 1; i < monthly.length; i++) {
    if (monthly[i] > monthly[peakMonthIndex]) peakMonthIndex = i;
  }

  const summerKwh = monthly.slice(4, 8).reduce((a, b) => a + b, 0);
  const winterKwh = [...monthly.slice(0, 2), ...monthly.slice(10, 12)]
    .reduce((a, b) => a + b, 0);

  return {
    countyCode: input.countyCode,
    systemKwp: input.systemKwp,
    orientation: input.orientation,
    shading: input.shading,
    annualProductionKwh: annual,
    monthlyProductionKwh: monthly,
    peakMonthIndex,
    summerKwh,
    winterKwh,
    source: county ? "seed" : "local_estimate",
    lastUpdatedAt: new Date().toISOString(),
  };
}
