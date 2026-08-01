// Seed county data — typed as SolarCountyPotential[]. Derived from the
// existing county potential table with the addition of monthly seasonal
// distribution and delta vs national average.

import type { SolarCountyPotential, PotentialLevel } from "@/types/solar";
import { COUNTIES } from "@/data/countyPotential";

export const MONTHLY_DISTRIBUTION: number[] = [
  0.04, 0.05, 0.08, 0.10, 0.12, 0.13, 0.13, 0.12, 0.09, 0.07, 0.04, 0.03,
];

export const NATIONAL_FALLBACK_KWH_PER_KWP = 1260;

function level(y: number): PotentialLevel {
  if (y >= 1350) return "foarte_bun";
  if (y >= 1250) return "bun";
  if (y >= 1150) return "mediu";
  return "scazut";
}

const NATIONAL_AVG =
  COUNTIES.reduce((a, c) => a + c.yieldPerKwp, 0) / COUNTIES.length;

const NOW = new Date().toISOString();

export const SEED_COUNTIES: SolarCountyPotential[] = COUNTIES.map((c) => ({
  countyName: c.county,
  countyCode: c.code,
  region: c.region,
  lat: c.lat,
  lng: c.lng,
  annualKwhPerKwp: c.yieldPerKwp,
  irradiationAnnual: c.irradiation,
  potentialLevel: level(c.yieldPerKwp),
  monthlyDistribution: MONTHLY_DISTRIBUTION,
  source: "seed",
  lastUpdatedAt: NOW,
  deltaVsNationalAverage: Math.round(c.yieldPerKwp - NATIONAL_AVG),
}));

export const NATIONAL_AVG_KWH_PER_KWP = Math.round(NATIONAL_AVG);
