import { describe, expect, it } from "vitest";
import { AnalyticsPayloadSchema, viewportCategory } from "@/lib/analytics";
import {
  highestCompatibleStep,
  restoreRecommendationDraft,
  serializeRecommendationDraft,
} from "@/lib/recommendation-v2/persistence";
import type { RecommendationInputV2 } from "@/lib/recommendation-v2/types";
import { detectAllowedFileType } from "@/lib/offers.functions";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const completeInput: RecommendationInputV2 = {
  schemaVersion: 2,
  consumptionMode: "monthly-kwh",
  monthlyConsumptionKwh: 400,
  usageProfile: "constant",
  loads: [],
  noLargeLoads: true,
  location: {
    lat: 47.1142,
    lng: 27.5163,
    countyCode: "IS",
    countyName: "Iași",
    locality: "Miroslava",
    displayLabel: "Miroslava, Iași",
  },
  locationPrecision: "precise",
  orientation: "south",
  shading: "none",
  buildingType: "house",
  connectionType: "three-phase",
  goal: "bill",
  batteryPreference: "none",
};

describe("final production hardening", () => {
  it("restores only compatible recommendation input and never persisted results", () => {
    const serialized = serializeRecommendationDraft(completeInput, 5);
    expect(serialized).not.toContain("annualProductionKwh");
    expect(restoreRecommendationDraft(serialized)).toMatchObject({
      state: completeInput,
      step: 5,
      restored: true,
    });
    expect(restoreRecommendationDraft("{not-json")).toBeNull();
    expect(
      restoreRecommendationDraft(
        serialized.replace('"engineSchemaVersion":2', '"engineSchemaVersion":1'),
      ),
    ).toBeNull();
  });

  it("moves a partial recommendation back to the highest valid step", () => {
    const withoutLocation = { ...completeInput, location: undefined };
    expect(highestCompatibleStep(withoutLocation)).toBe(3);
    const restored = restoreRecommendationDraft(serializeRecommendationDraft(withoutLocation, 5));
    expect(restored?.step).toBe(3);
  });

  it("accepts only privacy-safe analytics fields", () => {
    const safe = {
      event: "recommendation_completed",
      route: "/recomandare-sistem",
      viewport: "desktop",
      session: "anonymous",
      outcome: "success",
      confidence: "medium",
      assumptionsVersion: "RO-2026.07-v2",
    };
    expect(AnalyticsPayloadSchema.safeParse(safe).success).toBe(true);
    expect(
      AnalyticsPayloadSchema.safeParse({
        ...safe,
        email: "private@example.com",
        filename: "oferta.pdf",
        locality: "Miroslava",
      }).success,
    ).toBe(false);
    expect(viewportCategory(767)).toBe("mobile");
    expect(viewportCategory(768)).toBe("tablet");
    expect(viewportCategory(1024)).toBe("desktop");
  });

  it("detects allowed file signatures instead of trusting extensions", () => {
    expect(detectAllowedFileType(new TextEncoder().encode("%PDF-1.7"))).toBe("application/pdf");
    expect(
      detectAllowedFileType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe("image/png");
    expect(detectAllowedFileType(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectAllowedFileType(new TextEncoder().encode("MZ executable"))).toBeNull();
  });

  it("keeps secret Supabase keys out of the browser configuration path", () => {
    const clientSource = readFileSync(
      resolve(process.cwd(), "src/integrations/supabase/client.ts"),
      "utf8",
    );
    expect(clientSource).toContain('value.startsWith("sb_secret_")');
    expect(clientSource).not.toContain("process.env.SUPABASE_SERVICE_ROLE_KEY");
    expect(clientSource).not.toContain("process.env.SUPABASE_URL");
  });

  it("ships the expected production response-header policy", () => {
    const serverSource = readFileSync(resolve(process.cwd(), "src/server.ts"), "utf8");
    for (const header of [
      "x-content-type-options",
      "referrer-policy",
      "permissions-policy",
      "x-frame-options",
      "strict-transport-security",
      "content-security-policy-report-only",
      "x-correlation-id",
    ]) {
      expect(serverSource).toContain(header);
    }
  });

  it("preserves the existing atomic limiter contract and tightens table privileges", () => {
    const limiter = readFileSync(
      resolve(process.cwd(), "src/lib/rate-limit.server.ts"),
      "utf8",
    );
    const migration = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20260726110000_final_production_hardening.sql"),
      "utf8",
    );
    expect(limiter).toContain('rpc("consume_rate_limit"');
    expect(limiter).toContain("p_max_per_minute: maxPerMinute");
    expect(migration).not.toContain("CREATE OR REPLACE FUNCTION public.consume_rate_limit");
    expect(migration).toContain("REVOKE TRUNCATE, TRIGGER, REFERENCES");
  });
});
