import { z } from "zod";

export const ANALYTICS_EVENTS = [
  "homepage_view",
  "upload_page_view",
  "upload_file_selected",
  "upload_started",
  "upload_completed",
  "upload_failed",
  "manual_entry_started",
  "recommendation_started",
  "recommendation_step_completed",
  "recommendation_completed",
  "solar_map_used",
  "locality_selected",
  "example_report_viewed",
  "authentication_started",
  "authentication_completed",
  "editorial_page_viewed",
  "editorial_cta_clicked",
  "editorial_guide_opened",
  "editorial_related_clicked",
] as const;

export const AnalyticsPayloadSchema = z
  .object({
    event: z.enum(ANALYTICS_EVENTS),
    route: z
      .string()
      .regex(/^\/[a-z0-9_./-]*$/i)
      .max(120),
    viewport: z.enum(["mobile", "tablet", "desktop"]),
    session: z.enum(["anonymous", "authenticated", "unknown"]),
    outcome: z.enum(["success", "failure"]).optional(),
    failureCategory: z
      .enum(["validation", "session", "network", "storage", "provider", "unknown"])
      .optional(),
    step: z.number().int().min(1).max(6).optional(),
    confidence: z.enum(["low", "medium", "high"]).optional(),
    destinationTool: z.enum(["recommendation", "solar_map", "offer_analysis"]).optional(),
    guideSlug: z
      .enum([
        "ghid-panouri-fotovoltaice",
        "dimensionare-sistem-fotovoltaic",
        "cost-panouri-fotovoltaice",
        "productie-panouri-fotovoltaice",
        "baterie-pentru-panouri-fotovoltaice",
        "invertor-fotovoltaic-ghid",
        "cum-devii-prosumator",
        "cum-verifici-o-oferta-fotovoltaica",
        "autoconsum-energie-solara",
        "finantare-panouri-fotovoltaice",
        "mentenanta-panouri-fotovoltaice",
        "garantii-panouri-fotovoltaice",
        "calculator-panouri-fotovoltaice",
        "cate-panouri-fotovoltaice-imi-trebuie",
        "amortizare-sistem-fotovoltaic",
        "productie-si-economii-panouri-fotovoltaice",
        "sistem-fotovoltaic-cu-baterie-sau-fara",
        "sistem-fotovoltaic-5-kw",
      ])
      .optional(),
    editorialCategory: z
      .enum(["incepe", "dimensionare", "costuri", "productie", "baterii", "echipamente", "prosumator", "oferte"])
      .optional(),
    editorialPlacement: z
      .enum(["featured", "beginner_path", "category_directory", "homepage", "related_guides"])
      .optional(),
    ctaPlacement: z.enum(["hero", "sidebar", "inline", "related"]).optional(),
    assumptionsVersion: z
      .string()
      .regex(/^[A-Za-z0-9_.-]{1,40}$/)
      .optional(),
  })
  .strict();

export type AnalyticsPayload = z.infer<typeof AnalyticsPayloadSchema>;

export function viewportCategory(width: number): AnalyticsPayload["viewport"] {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function trackAnalytics(
  event: AnalyticsPayload["event"],
  properties: Omit<AnalyticsPayload, "event" | "route" | "viewport"> & { route?: string },
): void {
  if (typeof window === "undefined") return;
  const candidate = AnalyticsPayloadSchema.safeParse({
    event,
    route: properties.route ?? window.location.pathname,
    viewport: viewportCategory(window.innerWidth),
    ...properties,
  });
  if (!candidate.success) return;

  const body = JSON.stringify(candidate.data);
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
    credentials: "omit",
  }).catch(() => undefined);
}
