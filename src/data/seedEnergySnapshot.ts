// Seed energy snapshot — realistic mid-day MW figures for SEN. Used as
// fallback when the live public source is unavailable, so the dashboard
// always renders.

import type { EnergySnapshot } from "@/types/energy";

export function buildSeedEnergySnapshot(): EnergySnapshot {
  return {
    status: "stale",
    fetchedAt: new Date().toISOString(),
    source: "Estimare orientativă (mix tipic de zi)",
    sourceUrl: undefined,
    consumptionMw: 6800,
    productionMw: 6450,
    solarMw: 1150,
    windMw: 620,
    hydroMw: 1420,
    nuclearMw: 1380,
    coalMw: 720,
    hydrocarbonsMw: 1050,
    biomassMw: 110,
    storageMw: 0,
    importExportBalanceMw: 350,
    message: "Valorile afișate sunt orientative; datele publice se actualizează periodic.",
  };
}
