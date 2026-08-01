// National electricity snapshot. All values in MW (instantaneous power).

export type EnergyStatus = "success" | "stale" | "unavailable";

export interface EnergySnapshot {
  status: EnergyStatus;
  fetchedAt: string;                  // ISO
  source: string;                     // human readable, e.g. "Transelectrica"
  sourceUrl?: string;
  consumptionMw: number | null;
  productionMw: number | null;
  solarMw: number | null;
  windMw: number | null;
  hydroMw: number | null;
  nuclearMw: number | null;
  coalMw: number | null;
  hydrocarbonsMw: number | null;
  biomassMw: number | null;
  storageMw: number | null;
  importExportBalanceMw: number | null; // >0 = import, <0 = export
  message?: string;                    // reason when status !== "success"
}
