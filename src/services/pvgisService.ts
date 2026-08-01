// Client-side PVGIS wrapper. Calls the canonical server function
// (src/lib/pvgis.functions.ts). Falls back to a locally-derived estimate
// if the server call errors, and clearly labels the source.

import { COUNTIES, type CountyPotential } from "@/data/countyPotential";
import { getPvgisEstimate } from "@/lib/pvgis.functions";

export type Orientation =
  | "sud" | "sud-est" | "sud-vest" | "est-vest"
  | "est" | "vest" | "ne-nv" | "nord";

export type Shading = "deloc" | "usoara" | "moderata" | "semnificativa";

export interface PvgisRequest {
  lat: number;
  lng: number;
  systemKwp: number;
  orientation?: Orientation;
  shading?: Shading;
  tilt?: number;
}

export interface PvgisMonthly { month: number; productionKwh: number }

export interface PvgisResult {
  status: "success" | "error";
  source: "PVGIS" | "cache" | "Estimare locală";
  annualProductionKwh: number;
  monthlyProductionKwh: PvgisMonthly[];
  lastFetchedAt: string;
  errorMessage?: string;
}

const SEASONAL_PCT = [0.04, 0.05, 0.08, 0.10, 0.12, 0.13, 0.13, 0.12, 0.09, 0.07, 0.04, 0.03];

const ORIENTATION_FACTOR: Record<Orientation, number> = {
  "sud": 1.00,
  "sud-est": 0.95,
  "sud-vest": 0.95,
  "est-vest": 0.88,
  "est": 0.82,
  "vest": 0.82,
  "ne-nv": 0.65,
  "nord": 0.50,
};

const SHADING_FACTOR: Record<Shading, number> = {
  "deloc": 1.00,
  "usoara": 0.92,
  "moderata": 0.80,
  "semnificativa": 0.60,
};

function azimuthFor(o: Orientation): number {
  switch (o) {
    case "sud": return 0;
    case "sud-est": return -45;
    case "sud-vest": return 45;
    case "est": return -90;
    case "vest": return 90;
    case "est-vest": return 0;
    case "ne-nv": return 135;
    case "nord": return 180;
  }
}

function lossFactor(shading: Shading = "deloc", orientation: Orientation = "sud"): number {
  let loss = 14;
  if (shading === "usoara") loss += 4;
  if (shading === "moderata") loss += 12;
  if (shading === "semnificativa") loss += 25;
  if (orientation === "est-vest") loss += 4;
  return Math.min(loss, 45);
}

function localEstimate(req: PvgisRequest, now: string, errorMessage?: string): PvgisResult {
  const nearest = COUNTIES.reduce<CountyPotential>((best, c) => {
    const d1 = Math.hypot(best.lat - req.lat, best.lng - req.lng);
    const d2 = Math.hypot(c.lat - req.lat, c.lng - req.lng);
    return d2 < d1 ? c : best;
  }, COUNTIES[0]);
  const of = ORIENTATION_FACTOR[req.orientation ?? "sud"];
  const sf = SHADING_FACTOR[req.shading ?? "deloc"];
  const annual = Math.max(1, Math.round(nearest.yieldPerKwp * req.systemKwp * of * sf));
  const monthly = SEASONAL_PCT.map((pct, i) => ({
    month: i + 1,
    productionKwh: Math.max(1, Math.round(annual * pct)),
  }));
  return {
    status: "success",
    source: "Estimare locală",
    annualProductionKwh: annual,
    monthlyProductionKwh: monthly,
    lastFetchedAt: now,
    errorMessage,
  };
}

export function localPvgisEstimate(req: PvgisRequest): PvgisResult {
  return localEstimate(req, new Date().toISOString());
}

export async function fetchPvgis(req: PvgisRequest): Promise<PvgisResult> {
  const now = new Date().toISOString();
  try {
    const res = await getPvgisEstimate({
      data: {
        lat: req.lat,
        lng: req.lng,
        kwp: req.systemKwp,
        tilt: req.tilt ?? 30,
        aspect: azimuthFor(req.orientation ?? "sud"),
        loss: lossFactor(req.shading, req.orientation),
      },
    });
    if (res.status === "error") {
      return localEstimate(req, now, res.reason);
    }
    return {
      status: "success",
      source: res.source,
      annualProductionKwh: res.annualKwh,
      monthlyProductionKwh: res.monthlyKwh.map((v, i) => ({ month: i + 1, productionKwh: v })),
      lastFetchedAt: res.fetchedAt,
    };
  } catch (err) {
    return localEstimate(req, now, err instanceof Error ? err.message : String(err));
  }
}
