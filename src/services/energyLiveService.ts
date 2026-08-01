// Client wrapper for the canonical energy-live server function.
// Preserves the legacy shape used by /harta-solara-romania.

import { getEnergyLive, type EnergyLiveResult as ServerEnergyResult } from "@/lib/energy-live.functions";
import type { EnergySnapshot } from "@/types/energy";

export type { EnergyLiveResult } from "@/lib/energy-live.functions";
export type EnergyLiveData = ServerEnergyResult extends { data: infer D } ? D : never;

function toSnapshot(res: ServerEnergyResult): EnergySnapshot {
  if (res.status === "unavailable") {
    return {
      status: "unavailable",
      message: res.reason,
      fetchedAt: res.attemptedAt,
      source: "Transelectrica",
      sourceUrl: res.sourceUrl,
      consumptionMw: 0,
      productionMw: 0,
      solarMw: 0,
      windMw: 0,
      hydroMw: 0,
      nuclearMw: 0,
      coalMw: 0,
      hydrocarbonsMw: 0,
      biomassMw: 0,
      storageMw: 0,
      importExportBalanceMw: 0,
    };
  }
  return {
    status: res.status === "stale" ? "stale" : "success",
    fetchedAt: res.fetchedAt,
    source: res.source,
    sourceUrl: res.sourceUrl,
    ...res.data,
  };
}

export async function getEnergySnapshot(): Promise<EnergySnapshot> {
  try {
    const res = await getEnergyLive();
    return toSnapshot(res);
  } catch (err) {
    const now = new Date().toISOString();
    return {
      status: "unavailable",
      message: err instanceof Error ? err.message : "Sursa publică indisponibilă",
      fetchedAt: now,
      source: "Transelectrica",
      sourceUrl: "https://www.transelectrica.ro/",
      consumptionMw: 0,
      productionMw: 0,
      solarMw: 0,
      windMw: 0,
      hydroMw: 0,
      nuclearMw: 0,
      coalMw: 0,
      hydrocarbonsMw: 0,
      biomassMw: 0,
      storageMw: 0,
      importExportBalanceMw: 0,
    };
  }
}

export async function fetchEnergyLive() {
  const snapshot = await getEnergySnapshot();
  if (snapshot.status === "unavailable") {
    return {
      status: "unavailable" as const,
      reason: snapshot.message ?? "Date indisponibile",
      attemptedAt: snapshot.fetchedAt,
      sourceUrl: snapshot.sourceUrl ?? "",
    };
  }
  const {
    consumptionMw, productionMw, solarMw, windMw, hydroMw, nuclearMw,
    coalMw, hydrocarbonsMw, biomassMw, storageMw, importExportBalanceMw,
    fetchedAt, source, sourceUrl,
  } = snapshot;
  return {
    status: snapshot.status,
    snapshot,
    data: {
      consumptionMw, productionMw, solarMw, windMw, hydroMw, nuclearMw,
      coalMw, hydrocarbonsMw, biomassMw, storageMw, importExportBalanceMw,
      fetchedAt, source, sourceUrl,
    },
  };
}
