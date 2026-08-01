// Canonical PVGIS server function. Replaces old /api/pvgis file routes and
// functions/api/pvgis.ts. Caches successful results in `pvgis_cache`.
// Requires the client-side bearer attacher so the request has a session.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PvgisRequestSchema } from "@/lib/schemas";

export type PvgisApiResult =
  | {
      status: "success";
      source: "PVGIS" | "cache";
      annualKwh: number;
      monthlyKwh: number[];
      fetchedAt: string;
      cacheKey: string;
    }
  | {
      status: "error";
      reason: string;
      fetchedAt: string;
    };

function roundTo(n: number, d: number) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

function buildCacheKey(p: {
  lat: number;
  lng: number;
  kwp: number;
  tilt: number;
  aspect: number;
  loss: number;
}) {
  const lat = roundTo(p.lat, 2);
  const lng = roundTo(p.lng, 2);
  return [lat, lng, p.kwp, p.tilt, p.aspect, p.loss].join(":");
}

async function callPvgis(p: {
  lat: number;
  lng: number;
  kwp: number;
  tilt: number;
  aspect: number;
  loss: number;
}): Promise<
  | { ok: true; annualKwh: number; monthlyKwh: number[] }
  | { ok: false; reason: string }
> {
  const url = new URL("https://re.jrc.ec.europa.eu/api/v5_3/PVcalc");
  url.searchParams.set("lat", p.lat.toFixed(4));
  url.searchParams.set("lon", p.lng.toFixed(4));
  url.searchParams.set("peakpower", String(p.kwp));
  url.searchParams.set("loss", String(p.loss));
  url.searchParams.set("angle", String(p.tilt));
  url.searchParams.set("aspect", String(p.aspect));
  url.searchParams.set("mountingplace", "building");
  url.searchParams.set("pvtechchoice", "crystSi");
  url.searchParams.set("outputformat", "json");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) return { ok: false, reason: `PVGIS HTTP ${res.status}` };
    const body = (await res.json()) as {
      outputs?: {
        totals?: { fixed?: { E_y?: number } };
        monthly?: { fixed?: Array<{ E_m?: number }> };
      };
    };
    const annual = body.outputs?.totals?.fixed?.E_y;
    const monthly = body.outputs?.monthly?.fixed;
    if (!annual || !monthly || monthly.length !== 12) {
      return { ok: false, reason: "Răspuns PVGIS incomplet" };
    }
    return {
      ok: true,
      annualKwh: Math.round(annual),
      monthlyKwh: monthly.map((m) => Math.round(m.E_m ?? 0)),
    };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "PVGIS indisponibil",
    };
  } finally {
    clearTimeout(timer);
  }
}

export const getPvgisEstimate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PvgisRequestSchema.parse(input))
  .handler(async ({ data, context }): Promise<PvgisApiResult> => {
    const cacheKey = buildCacheKey(data);
    const now = new Date().toISOString();

    // 1. Cache hit
    const { data: cached } = await context.supabase
      .from("pvgis_cache")
      .select("annual_kwh, monthly_kwh, fetched_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (cached) {
      return {
        status: "success",
        source: "cache",
        annualKwh: Number(cached.annual_kwh),
        monthlyKwh: (cached.monthly_kwh as number[]) ?? [],
        fetchedAt: cached.fetched_at as string,
        cacheKey,
      };
    }

    // 2. Live call
    const result = await callPvgis(data);
    if (!result.ok) {
      return { status: "error", reason: result.reason, fetchedAt: now };
    }

    // 3. Persist via service-role (RLS blocks anon writes).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("pvgis_cache").upsert(
      {
        cache_key: cacheKey,
        lat: data.lat,
        lng: data.lng,
        kwp: data.kwp,
        tilt: data.tilt,
        aspect: data.aspect,
        loss: data.loss,
        annual_kwh: result.annualKwh,
        monthly_kwh: result.monthlyKwh,
        source: "PVGIS",
        fetched_at: now,
      },
      { onConflict: "cache_key" },
    );

    return {
      status: "success",
      source: "PVGIS",
      annualKwh: result.annualKwh,
      monthlyKwh: result.monthlyKwh,
      fetchedAt: now,
      cacheKey,
    };
  });
