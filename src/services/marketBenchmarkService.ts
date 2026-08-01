// Market benchmark service — reads from seed today, ready for backend swap.

import type { MarketBenchmark } from "@/types/market";
import { SEED_BENCHMARKS } from "@/data/seedMarketBenchmarks";

export function getBenchmarks(): MarketBenchmark[] {
  return SEED_BENCHMARKS;
}

export function getBenchmarkForKwp(kwp: number, withBattery = false): MarketBenchmark {
  const candidates = SEED_BENCHMARKS.filter((b) => b.batteryIncluded === withBattery);
  const match = candidates.find((b) => kwp >= b.systemKwMin && kwp <= b.systemKwMax);
  if (match) return match;
  return candidates.reduce((best, b) => {
    const mid = (b.systemKwMin + b.systemKwMax) / 2;
    const bestMid = (best.systemKwMin + best.systemKwMax) / 2;
    return Math.abs(mid - kwp) < Math.abs(bestMid - kwp) ? b : best;
  }, candidates[0] ?? SEED_BENCHMARKS[0]);
}

// Legacy-compatible alias used by existing UI.
export function findBenchmark(kwp: number, withBattery = false): MarketBenchmark {
  return getBenchmarkForKwp(kwp, withBattery);
}

export interface MarketPosition {
  label: string;
  percentile: number; // 0..100 where the offer sits within [min..max]
}

export function positionOnMarket(price: number, b: MarketBenchmark): MarketPosition {
  const clamped = Math.max(b.priceMin, Math.min(b.priceMax, price));
  const percentile = Math.round(((clamped - b.priceMin) / Math.max(1, b.priceMax - b.priceMin)) * 100);
  // Simple bands anchored on min/median/max — the seed no longer carries
  // P25/P75 because those are not published for the Romanian market.
  const p25 = (b.priceMin + b.priceMedian) / 2;
  const p75 = (b.priceMedian + b.priceMax) / 2;
  let label = "În media pieței";
  if (price < p25) label = "Sub media pieței";
  else if (price <= b.priceMedian) label = "Ușor sub mediană";
  else if (price <= p75) label = "Ușor peste mediană";
  else label = "Peste media pieței";
  return { label, percentile };
}
