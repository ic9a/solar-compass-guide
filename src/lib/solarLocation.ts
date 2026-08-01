import { COUNTIES, normalizeCountyName } from "@/data/countyPotential";

export type SolarLocation = {
  lat: number;
  lng: number;
  countyCode: string;
  countyName: string;
  locality?: string;
  displayLabel: string;
};

export type SolarLocationLabel = {
  locality?: string;
  county?: string;
  country?: string;
  latitude: number;
  longitude: number;
};

export function cleanSolarPlace(value?: string) {
  return value
    ?.replace(/^Județul\s+/i, "")
    .replace(/^Municipiul\s+/i, "")
    .replace(/^Municipality of\s+/i, "")
    .trim();
}

export function formatSolarLocationLabel(location: SolarLocationLabel) {
  const locality = cleanSolarPlace(location.locality);
  const county = cleanSolarPlace(location.county);
  const country = cleanSolarPlace(location.country);
  const parts: string[] = [];

  if (locality) parts.push(locality);
  if (county && county.toLocaleLowerCase("ro-RO") !== locality?.toLocaleLowerCase("ro-RO")) {
    parts.push(county);
  }
  if (country && parts.length === 0) parts.push(country);

  return parts.join(", ") || "Locația selectată";
}

export function countyForGeocoderValue(value?: string) {
  const clean = cleanSolarPlace(value);
  if (!clean) return undefined;
  const normalized = normalizeCountyName(clean)
    .replace(/^JUDETUL\s+/, "")
    .replace(/^BUCHAREST$/, "BUCURESTI");
  return COUNTIES.find((county) => county.shapeName === normalized);
}

export function createSolarLocation(input: {
  lat: number;
  lng: number;
  countyCode?: string;
  countyName?: string;
  locality?: string;
}): SolarLocation {
  const locality = cleanSolarPlace(input.locality);
  const geocodedCounty = countyForGeocoderValue(input.countyName);
  const nearestCounty = COUNTIES.reduce((best, county) => {
    const bestDistance = Math.hypot(best.lat - input.lat, best.lng - input.lng);
    const distance = Math.hypot(county.lat - input.lat, county.lng - input.lng);
    return distance < bestDistance ? county : best;
  }, COUNTIES[0]);
  const county =
    COUNTIES.find((item) => item.code === input.countyCode) ?? geocodedCounty ?? nearestCounty;
  const displayLabel = formatSolarLocationLabel({
    locality,
    county: county.county,
    latitude: input.lat,
    longitude: input.lng,
  });

  return {
    lat: input.lat,
    lng: input.lng,
    countyCode: county.code,
    countyName: county.county,
    locality,
    displayLabel,
  };
}
