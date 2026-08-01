import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createSolarLocation, type SolarLocation } from "@/lib/solarLocation";

const PHOTON_URL = "https://photon.komoot.io";
const ROMANIA_BBOX = "20.2,43.5,30.0,48.3";
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 14;

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    countrycode?: string;
    name?: string;
    city?: string;
    town?: string;
    village?: string;
    district?: string;
    county?: string;
    state?: string;
    type?: string;
    osm_value?: string;
  };
};

type PhotonResponse = { features?: PhotonFeature[] };

export type GeocodingErrorReason = "timeout" | "rate-limit" | "invalid-response" | "unavailable";

export type GeocodingResult =
  | { status: "success"; location: SolarLocation }
  | { status: "error"; reason: GeocodingErrorReason };

export type LocationSearchResult = SolarLocation & { id: string };

const memoryCache = new Map<string, { expiresAt: number; value: unknown }>();

export function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase("ro-RO")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function rankRomanianLocalities(
  query: string,
  results: LocationSearchResult[],
): LocationSearchResult[] {
  const [localityPart, countyPart = ""] = query.split(",", 2);
  const wantedLocality = normalizeSearchText(localityPart);
  const wantedCounty = normalizeSearchText(countyPart);
  const tokens = wantedLocality.split(" ").filter(Boolean);
  const scored = results
    .map((result) => {
      const locality = normalizeSearchText(result.locality ?? "");
      const county = normalizeSearchText(result.countyName);
      if (!locality || !wantedLocality) return null;
      const exact = locality === wantedLocality;
      const prefix = locality.startsWith(wantedLocality) || wantedLocality.startsWith(locality);
      const allTokens = tokens.length > 0 && tokens.every((token) => locality.includes(token));
      const strongPartial =
        wantedLocality.length >= 4 &&
        locality.length >= 4 &&
        (locality.includes(wantedLocality) || wantedLocality.includes(locality));
      if (!exact && !prefix && !allTokens && !strongPartial) return null;
      if (wantedCounty && county !== wantedCounty) return null;
      let score = exact ? 400 : prefix ? 300 : allTokens ? 220 : 120;
      if (wantedCounty) score += 80;
      return { result, score };
    })
    .filter((item): item is { result: LocationSearchResult; score: number } => Boolean(item))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.result.displayLabel.localeCompare(right.result.displayLabel, "ro"));
  return scored.map((item) => item.result);
}



function roundedCoordinate(value: number) {
  return Math.round(value * 1_000) / 1_000;
}

async function cacheGet<T>(key: string): Promise<T | undefined> {
  if (typeof caches !== "undefined") {
    const cache = await caches.open("raportsolar-geocoding-v1");
    const response = await cache.match(`https://geocoding-cache.raportsolar.ro/${key}`);
    if (response) return (await response.json()) as T;
  }
  const cached = memoryCache.get(key);
  if (!cached || cached.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return undefined;
  }
  return cached.value as T;
}

async function cachePut(key: string, value: unknown) {
  if (typeof caches !== "undefined") {
    const cache = await caches.open("raportsolar-geocoding-v1");
    await cache.put(
      `https://geocoding-cache.raportsolar.ro/${key}`,
      new Response(JSON.stringify(value), {
        headers: {
          "content-type": "application/json",
          "cache-control": `public, max-age=${CACHE_TTL_SECONDS}`,
        },
      }),
    );
  }
  memoryCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_SECONDS * 1_000,
    value,
  });
}

function localityFromFeature(feature: PhotonFeature) {
  const properties = feature.properties;
  if (!properties) return undefined;
  if (/^sector\s+\d/i.test(properties.district ?? "")) return properties.district;
  return (
    properties.city ??
    properties.town ??
    properties.village ??
    (properties.type === "city" ? properties.name : undefined) ??
    properties.district
  );
}

export function normalizePhotonFeature(feature: PhotonFeature): SolarLocation | undefined {
  const coordinates = feature.geometry?.coordinates;
  const properties = feature.properties;
  if (
    !coordinates ||
    coordinates.length !== 2 ||
    !Number.isFinite(coordinates[0]) ||
    !Number.isFinite(coordinates[1]) ||
    properties?.countrycode?.toUpperCase() !== "RO"
  ) {
    return undefined;
  }

  return createSolarLocation({
    lat: coordinates[1],
    lng: coordinates[0],
    countyName: properties.county ?? properties.state,
    locality: localityFromFeature(feature),
  });
}

async function fetchPhoton(
  url: URL,
): Promise<
  { status: "success"; body: PhotonResponse } | { status: "error"; reason: GeocodingErrorReason }
> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (response.status === 429) return { status: "error", reason: "rate-limit" };
    if (!response.ok) return { status: "error", reason: "unavailable" };
    const body = (await response.json()) as PhotonResponse;
    if (!Array.isArray(body.features)) {
      return { status: "error", reason: "invalid-response" };
    }
    return { status: "success", body };
  } catch (error) {
    return {
      status: "error",
      reason: error instanceof Error && error.name === "AbortError" ? "timeout" : "unavailable",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export const reverseGeocodeSolarLocation = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        lat: z.number().min(43.4).max(48.4),
        lng: z.number().min(20.1).max(30.1),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<GeocodingResult> => {
    const lat = roundedCoordinate(data.lat);
    const lng = roundedCoordinate(data.lng);
    const cacheKey = `reverse/${lat}/${lng}`;
    const cached = await cacheGet<GeocodingResult>(cacheKey);
    if (cached) return cached;

    const url = new URL("/reverse", PHOTON_URL);
    url.searchParams.set("lat", String(data.lat));
    url.searchParams.set("lon", String(data.lng));
    const response = await fetchPhoton(url);
    if (response.status === "error") return response;
    const location = response.body.features
      ?.map(normalizePhotonFeature)
      .find((candidate): candidate is SolarLocation => Boolean(candidate));
    const result: GeocodingResult = location
      ? { status: "success", location: { ...location, lat: data.lat, lng: data.lng } }
      : { status: "error", reason: "invalid-response" };
    if (result.status === "success") await cachePut(cacheKey, result);
    return result;
  });

export const searchSolarLocations = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z.object({ query: z.string().trim().min(3).max(120) }).parse(input),
  )
  .handler(async ({ data }): Promise<LocationSearchResult[]> => {
    const normalizedQuery = normalizeSearchText(data.query);
    const cacheKey = `search/${encodeURIComponent(normalizedQuery)}`;
    const cached = await cacheGet<LocationSearchResult[]>(cacheKey);
    if (cached) return cached;

    const url = new URL("/api/", PHOTON_URL);
    url.searchParams.set("q", data.query);
    url.searchParams.set("limit", "8");
    url.searchParams.set("bbox", ROMANIA_BBOX);
    const response = await fetchPhoton(url);
    if (response.status === "error") return [];

    const providerResults = (response.body.features ?? [])
      .map((feature, index) => {
        const location = normalizePhotonFeature(feature);
        if (!location) return undefined;
        const type = feature.properties?.type;
        const osmValue = feature.properties?.osm_value;
        const allowed = new Set(["city", "town", "village", "municipality", "commune"]);
        if (type !== "city" && !allowed.has(osmValue ?? "")) return undefined;
        return { ...location, id: `${location.lat}:${location.lng}:${index}` };
      })
      .filter((candidate): candidate is LocationSearchResult => Boolean(candidate))
      .filter(
        (candidate, index, all) =>
          all.findIndex((item) => item.displayLabel === candidate.displayLabel) === index,
      );
    const results = rankRomanianLocalities(data.query, providerResults).slice(0, 6);

    await cachePut(cacheKey, results);
    return results;
  });
