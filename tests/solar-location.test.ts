import { describe, expect, it } from "vitest";
import { createSolarLocation, formatSolarLocationLabel } from "@/lib/solarLocation";
import { normalizePhotonFeature } from "@/lib/geocoding.functions";

describe("solar location normalization", () => {
  it("formats Miroslava with its county", () => {
    const location = normalizePhotonFeature({
      geometry: { coordinates: [27.5163504, 47.1142028] },
      properties: {
        countrycode: "RO",
        city: "Miroslava",
        county: "Iași",
      },
    });

    expect(location?.displayLabel).toBe("Miroslava, Iași");
    expect(location?.countyCode).toBe("IS");
  });

  it("keeps the county fallback when no locality exists", () => {
    expect(
      createSolarLocation({
        lat: 47.16,
        lng: 27.59,
        countyCode: "IS",
        countyName: "Iași",
      }).displayLabel,
    ).toBe("Iași");
  });

  it("does not duplicate repeated county names or Bucharest", () => {
    expect(
      formatSolarLocationLabel({
        locality: "Iași",
        county: "Județul Iași",
        latitude: 47.16,
        longitude: 27.59,
      }),
    ).toBe("Iași");
    expect(
      formatSolarLocationLabel({
        locality: "București",
        county: "Municipiul București",
        latitude: 44.43,
        longitude: 26.1,
      }),
    ).toBe("București");
  });
});
