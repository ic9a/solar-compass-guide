// Canonical energy-live server function. Replaces the two duplicate
// implementations that lived under functions/api and src/routes/api.
// On success it upserts a fresh snapshot; on failure it returns the most
// recent real snapshot with a stale flag, or unavailable when none exists.

import { createServerFn } from "@tanstack/react-start";

const TRANSELECTRICA_URL =
  "https://www.transelectrica.ro/sen-grafic/-/asset_publisher/RaB0R7Uz1DYw/content/plc-cnt/";

export interface EnergyLiveData {
  consumptionMw: number;
  productionMw: number;
  solarMw: number;
  windMw: number;
  hydroMw: number;
  nuclearMw: number;
  coalMw: number;
  hydrocarbonsMw: number;
  biomassMw: number;
  storageMw: number;
  importExportBalanceMw: number;
}

export type EnergyLiveResult =
  | { status: "success" | "stale"; data: EnergyLiveData; fetchedAt: string; source: string; sourceUrl: string }
  | { status: "unavailable"; reason: string; attemptedAt: string; sourceUrl: string };

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number(v.replace(",", "."));
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function parseTranselectrica(json: unknown): EnergyLiveData | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const cons = pickNumber(o, ["CONS", "cons", "Consum"]);
  const prod = pickNumber(o, ["PROD", "prod", "Productie"]);
  if (cons === undefined || prod === undefined) return null;
  return {
    consumptionMw: cons,
    productionMw: prod,
    solarMw: pickNumber(o, ["FOTO", "SOL", "Solar"]) ?? 0,
    windMw: pickNumber(o, ["EOLIAN", "WIND"]) ?? 0,
    hydroMw: pickNumber(o, ["APE", "HIDRO", "Hidro"]) ?? 0,
    nuclearMw: pickNumber(o, ["NUCL", "Nuclear"]) ?? 0,
    coalMw: pickNumber(o, ["CARB", "Carbune"]) ?? 0,
    hydrocarbonsMw: pickNumber(o, ["HIDROC", "GAZE", "Gaze"]) ?? 0,
    biomassMw: pickNumber(o, ["BIOM"]) ?? 0,
    storageMw: pickNumber(o, ["STOC", "STORAGE"]) ?? 0,
    importExportBalanceMw: pickNumber(o, ["SOLD", "SOLDIS"]) ?? 0,
  };
}

async function fetchLive(): Promise<
  { ok: true; data: EnergyLiveData } | { ok: false; reason: string }
> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(TRANSELECTRICA_URL, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    const json = await res.json();
    const parsed = parseTranselectrica(json);
    if (!parsed) return { ok: false, reason: "Format Transelectrica neașteptat" };
    return { ok: true, data: parsed };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "Transelectrica indisponibil",
    };
  } finally {
    clearTimeout(timer);
  }
}

export const getEnergyLive = createServerFn({ method: "GET" }).handler(
  async (): Promise<EnergyLiveResult> => {
    const now = new Date().toISOString();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const live = await fetchLive();

    if (live.ok) {
      await supabaseAdmin.from("energy_snapshots").insert({
        payload: live.data as unknown as Record<string, number>,
        source: "transelectrica",
        fetched_at: now,
      });
      return {
        status: "success",
        data: live.data,
        fetchedAt: now,
        source: "Transelectrica",
        sourceUrl: TRANSELECTRICA_URL,
      };
    }

    // Fallback to last real snapshot.
    const { data: latest } = await supabaseAdmin
      .from("energy_snapshots")
      .select("payload, fetched_at")
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest) {
      return {
        status: "stale",
        data: latest.payload as unknown as EnergyLiveData,
        fetchedAt: latest.fetched_at as string,
        source: "Transelectrica (cache)",
        sourceUrl: TRANSELECTRICA_URL,
      };
    }

    return {
      status: "unavailable",
      reason: live.reason,
      attemptedAt: now,
      sourceUrl: TRANSELECTRICA_URL,
    };
  },
);
