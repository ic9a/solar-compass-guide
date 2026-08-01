// Server functions covering the extraction + scoring lifecycle.
//
// Flow after a file finishes uploading (finalizeOfferUpload sets status='uploaded'):
//   1. Client calls startAnalysis({ offerId }).
//   2. Handler transitions offer.status -> 'extracting', inserts an extraction row (pending).
//   3. Handler downloads the private file via signed URL, sends it directly to
//      Google Gemini with a strict JSON prompt.
//   4. On success it stores normalized fields on the extraction row, updates offer fields,
//      then runs deterministic scoring using the active scoring_rules and the verified
//      market_offers band. The offer_analyses row is upserted with is_paid=false.
//   5. Realtime consumers watching offer_analyses / offers see the transitions live.

import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createAnalysisModel } from "@/lib/ai-provider.server";
import {
  scoreOffer,
  detectContradictions,
  type ExtractedOffer,
  type ScoringRules,
  type MarketBand,
} from "@/lib/scoring";
import { rateLimitOrThrow } from "@/lib/rate-limit.server";
import { logEvent, safeErrorCategory } from "@/lib/observability.server";
import { convertOfferPriceToLei, type ExchangeRateMetadata } from "@/lib/currency.server";

const StartAnalysisInput = z.object({
  offerId: z.string().uuid(),
});

const PROMPT_VERSION = "extract.v2";
const BUCKET = "offer-documents";

// Zod schema mirrors ExtractedOffer — strict-JSON-compatible (nullable, not optional).
const extractionSchema = z.object({
  supplier_name: z.string().nullable(),
  system_kwp: z.number().nullable(),
  panel_brand: z.string().nullable(),
  panel_model: z.string().nullable(),
  panel_count: z.number().int().nullable(),
  panel_wattage: z.number().nullable(),
  inverter_brand: z.string().nullable(),
  inverter_model: z.string().nullable(),
  inverter_kva: z.number().nullable(),
  // Gemini's structured-output adapter currently serializes numeric literal
  // unions as a string enum with numeric values, which the API rejects.
  // Validate the exact residential phase values after generation instead.
  inverter_phases: z.number().int().min(1).max(3).nullable(),
  battery_present: z.boolean().nullable(),
  battery_kwh: z.number().nullable(),
  mounting_type: z.string().nullable(),
  original_total_price: z.number().nullable(),
  original_currency: z.enum(["RON", "EUR"]).nullable(),
  offer_date: z.string().nullable(),
  total_price_lei: z.number().nullable(),
  vat_included: z.boolean().nullable(),
  price_breakdown: z
    .array(z.object({ item: z.string(), amount_lei: z.number().nullable() }))
    .nullable(),
  warranties: z
    .object({
      panels_years: z.number().nullable(),
      inverter_years: z.number().nullable(),
      workmanship_years: z.number().nullable(),
    })
    .nullable(),
  included_services: z.array(z.string()).nullable(),
  excluded_items: z.array(z.string()).nullable(),
  payment_terms: z.string().nullable(),
  permit_included: z.boolean().nullable(),
  commissioning_included: z.boolean().nullable(),
  monitoring_included: z.boolean().nullable(),
  notes: z.string().nullable(),
  is_photovoltaic_offer: z.boolean().nullable(),
  field_confidence: z
    .object({
      system_kwp: z.enum(["high", "medium", "low"]).nullable(),
      panel_model: z.enum(["high", "medium", "low"]).nullable(),
      panel_count: z.enum(["high", "medium", "low"]).nullable(),
      inverter_model: z.enum(["high", "medium", "low"]).nullable(),
      inverter_kva: z.enum(["high", "medium", "low"]).nullable(),
      battery_kwh: z.enum(["high", "medium", "low"]).nullable(),
      total_price_lei: z.enum(["high", "medium", "low"]).nullable(),
      vat_included: z.enum(["high", "medium", "low"]).nullable(),
      warranties: z.enum(["high", "medium", "low"]).nullable(),
      payment_terms: z.enum(["high", "medium", "low"]).nullable(),
    })
    .nullable(),
  ai_contradictions: z.array(z.string()).nullable(),
});

const SYSTEM_PROMPT = `Ești un asistent care extrage date structurate dintr-o ofertă comercială pentru un sistem fotovoltaic rezidențial din România.
Returnează STRICT JSON conform schemei, în limba română pentru câmpurile text libere.
Reguli stricte:
- Păstrează suma în "original_total_price" și moneda în "original_currency" (RON sau EUR) exact cum apar în document. Nu converti EUR în RON și nu inventa un curs valutar. Pentru oferte în RON poți copia suma și în "total_price_lei"; pentru EUR setează "total_price_lei" la null.
- Extrage data ofertei în "offer_date" în format YYYY-MM-DD când este explicită; altfel null.
- Setează CÂMPURILE LA null când informația nu apare clar — NU inventa modele, garanții, TVA, capacități de baterie, servicii incluse sau condiții contractuale.
- Pentru fiecare câmp important marchează încrederea în "field_confidence": "high" = valoare explicită și fără ambiguitate; "medium" = derivată sau parțială; "low" = ambiguă sau contradictorie (setează atunci și valoarea la null dacă e prea nesigură).
- În "ai_contradictions" enumeră scurt orice contradicție internă vizibilă (ex. panouri × wattage ≠ kWp declarat, TVA menționat inconsistent, garanții diferite pe pagini distincte, backup fără EPS).
- warranties: doar ani (întreg sau zecimal), fără text.
- included_services / excluded_items: liste scurte, fiecare item ≤ 80 caractere.
- Setează is_photovoltaic_offer = false dacă documentul NU este o ofertă fotovoltaică.`;

// Fetch the current active scoring_rules row (admin client — read-only).
async function loadActiveRules(): Promise<{ rules: ScoringRules; version: number }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("scoring_rules")
    .select("version, weights, thresholds")
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) throw new Error("Nu am putut încărca regulile de scoring.");
  return {
    rules: {
      weights: data.weights as ScoringRules["weights"],
      thresholds: data.thresholds as ScoringRules["thresholds"],
    },
    version: data.version,
  };
}

// Compute p20/p50/p80 of lei_per_kwp from verified market_offers for the same battery status
// and within ±30% kwp band.
async function loadMarketBand(
  kwp: number | null | undefined,
  batteryPresent: boolean | null,
): Promise<MarketBand> {
  if (!kwp || kwp <= 0 || batteryPresent === null) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const low = kwp * 0.7;
  const high = kwp * 1.3;
  const { data, error } = await supabaseAdmin
    .from("market_offers")
    .select("lei_per_kwp, battery_nominal_kwh")
    .eq("is_verified", true)
    .eq("is_active", true)
    .gte("system_kwp", low)
    .lte("system_kwp", high);
  if (error || !data) return null;
  const filtered = data
    .filter((r) =>
      batteryPresent ? (r.battery_nominal_kwh ?? 0) > 0 : (r.battery_nominal_kwh ?? 0) === 0,
    )
    .map((r) => Number(r.lei_per_kwp))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
  if (filtered.length < 3) return null;
  const pct = (p: number) => {
    const idx = Math.min(filtered.length - 1, Math.max(0, Math.floor((p / 100) * filtered.length)));
    return filtered[idx];
  };
  return { sampleSize: filtered.length, p20: pct(20), p50: pct(50), p80: pct(80) };
}

export const startAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => StartAnalysisInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { rateLimitOrThrow } = await import("@/lib/rate-limit.server");
    await rateLimitOrThrow(userId, "analysis", 3);
    const { model, modelId } = createAnalysisModel();

    // 0. Ownership + state check.
    const { data: offer, error: offerErr } = await supabase
      .from("offers")
      .select("id, status, user_id, system_kwp, battery_present, updated_at")
      .eq("id", data.offerId)
      .maybeSingle();
    if (offerErr || !offer || offer.user_id !== userId) {
      throw new Error("Oferta nu există sau nu îți aparține.");
    }
    if (offer.status === "extracting" || offer.status === "analyzing") {
      const staleBefore = Date.now() - 15 * 60_000;
      if (new Date(offer.updated_at).getTime() >= staleBefore) {
        return { ok: true, alreadyRunning: true };
      }
    }

    // 1. File lookup.
    const { data: file, error: fileErr } = await supabase
      .from("offer_files")
      .select("storage_path, mime_type, uploaded_at")
      .eq("offer_id", data.offerId)
      .eq("user_id", userId)
      .maybeSingle();
    if (fileErr || !file || !file.uploaded_at) {
      throw new Error("Fișierul nu a fost încărcat complet.");
    }

    // 2. Transition to extracting + create extraction row.
    await supabase.from("offers").update({ status: "extracting" }).eq("id", data.offerId);
    const { data: extraction, error: exErr } = await supabase
      .from("offer_extractions")
      .insert({
        offer_id: data.offerId,
        user_id: userId,
        status: "pending",
        model: modelId,
        prompt_version: PROMPT_VERSION,
        progress_message: "Se citește documentul...",
      })
      .select("id")
      .single();
    if (exErr || !extraction) throw new Error("Nu am putut porni extracția.");

    // 3. Signed download URL (admin client — bucket is private).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const failAnalysis = async (message: string) => {
      await Promise.all([
        supabaseAdmin
          .from("offer_extractions")
          .update({ status: "failed", failure_message: message })
          .eq("id", extraction.id),
        supabaseAdmin.from("offers").update({ status: "failed" }).eq("id", data.offerId),
      ]);
    };
    const { data: signed, error: signedErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(file.storage_path, 300);
    if (signedErr || !signed) {
      const message = "Nu am putut accesa fișierul.";
      await failAnalysis(message);
      throw new Error(message);
    }

    // 4. Download bytes so we can pass them as a typed file part.
    const fileResp = await fetch(signed.signedUrl);
    if (!fileResp.ok) {
      const message = "Fișierul nu a putut fi descărcat.";
      await failAnalysis(message);
      throw new Error(message);
    }
    const bytes = new Uint8Array(await fileResp.arrayBuffer());
    const fileBase64 = Buffer.from(bytes).toString("base64");

    // 5. Call Google Gemini directly with the file part.

    let extracted: ExtractedOffer & {
      notes?: string | null;
      is_photovoltaic_offer?: boolean | null;
      field_confidence?: Record<string, "high" | "medium" | "low" | null> | null;
      ai_contradictions?: string[] | null;
      original_total_price?: number | null;
      original_currency?: "RON" | "EUR" | null;
      offer_date?: string | null;
      currency_conversion?: ExchangeRateMetadata | null;
      currency_conversion_unavailable_reason?: string | null;
    };

    try {
      const result = await generateText({
        model,
        system: SYSTEM_PROMPT,
        output: Output.object({ schema: extractionSchema }),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Extrage câmpurile conform schemei." },
              {
                type: "file",
                mediaType: file.mime_type ?? "application/pdf",
                data: fileBase64,
              },
            ],
          },
        ],
      });
      extracted = {
        ...result.output,
        inverter_phases:
          result.output.inverter_phases === 1 || result.output.inverter_phases === 3
            ? result.output.inverter_phases
            : null,
      };
    } catch (err) {
      const message =
        err instanceof NoObjectGeneratedError
          ? "Modelul nu a returnat un JSON valid."
          : err instanceof Error
            ? err.message
            : "Extracție eșuată.";
      logEvent({
        operation: "analysis.extract",
        status: "failure",
        category: safeErrorCategory(err, "ANALYSIS_FAILED"),
        provider: "google-gemini",
      });
      await failAnalysis(message);
      throw new Error(message);
    }

    // 5b. Convert only from the preserved source amount/currency. No guessed fallback rate.
    const originalAmount = extracted.original_total_price ?? extracted.total_price_lei ?? null;
    const originalCurrency = extracted.original_currency ?? (extracted.total_price_lei ? "RON" : null);
    const conversion = await convertOfferPriceToLei(originalAmount, originalCurrency);
    extracted.original_total_price = originalAmount;
    extracted.original_currency = originalCurrency;
    extracted.total_price_lei = conversion.amountLei;
    extracted.currency_conversion = conversion.metadata;
    extracted.currency_conversion_unavailable_reason = conversion.unavailableReason ?? null;

    // 5c. Bailout if the document is clearly not a photovoltaic offer or lacks core data.
    const isPv = extracted.is_photovoltaic_offer;
    const noUsableData =
      !extracted.original_total_price && !extracted.system_kwp && !extracted.panel_count;
    if (isPv === false || noUsableData) {
      const reason =
        isPv === false
          ? "Documentul nu pare a fi o ofertă fotovoltaică."
          : "Nu am putut extrage informații utile (preț sau putere sistem) din document.";
      await supabaseAdmin
        .from("offer_extractions")
        .update({
          status: "failed",
          failure_message: reason,
          normalized_result: JSON.parse(JSON.stringify(extracted)),
        })
        .eq("id", extraction.id);
      await supabaseAdmin.from("offers").update({ status: "failed" }).eq("id", data.offerId);
      throw new Error(reason);
    }

    // 6. Deterministic contradiction detection + merge with AI-reported contradictions.
    const detContradictions = detectContradictions(extracted);
    const aiContradictions =
      (extracted as unknown as { ai_contradictions?: string[] | null }).ai_contradictions ?? [];
    const contradictions = Array.from(
      new Set([...detContradictions, ...aiContradictions.filter(Boolean)]),
    );
    const fieldConfidence =
      (
        extracted as unknown as {
          field_confidence?: Record<string, "high" | "medium" | "low" | null> | null;
        }
      ).field_confidence ?? {};

    const extractedJson = JSON.parse(JSON.stringify(extracted));
    await supabaseAdmin
      .from("offer_extractions")
      .update({
        status: "success",
        normalized_result: extractedJson,
        raw_result: extractedJson,
        field_confidence: fieldConfidence as unknown as never,
        contradictions: contradictions as unknown as never,
        progress_message: "Extracție finalizată. Se calculează scorul...",
      })
      .eq("id", extraction.id);

    await supabaseAdmin
      .from("offers")
      .update({
        status: "analyzing",
        supplier_name: extracted.supplier_name ?? undefined,
        total_price_lei: extracted.total_price_lei ?? undefined,
        system_kwp: extracted.system_kwp ?? undefined,
        battery_present: extracted.battery_present ?? undefined,
        vat_included: extracted.vat_included ?? undefined,
        phase: extracted.inverter_phases ? String(extracted.inverter_phases) : undefined,
      })
      .eq("id", data.offerId);

    // 7. Load rules + market band and score with confidence.
    const { rules, version: rulesVersion } = await loadActiveRules();
    const band = await loadMarketBand(extracted.system_kwp, extracted.battery_kwh ? true : extracted.battery_present ?? null);
    const scoring = scoreOffer(extracted, band, rules, {
      field_confidence: fieldConfidence,
      contradictions,
    });

    // Persist overall confidence label.
    await supabaseAdmin
      .from("offer_extractions")
      .update({ overall_confidence: scoring.confidence.overall })
      .eq("id", extraction.id);

    // 8. Upsert analysis row.
    const analysisPayload = {
      offer_id: data.offerId,
      user_id: userId,
      status: "ready" as const,
      overall_score: scoring.overall,
      category_scores: JSON.parse(JSON.stringify(scoring.category_scores)),
      free_result: JSON.parse(JSON.stringify(scoring.free_preview)),
      full_report: JSON.parse(
        JSON.stringify({
          strengths: scoring.strengths,
          risks: scoring.risks,
          questions_to_ask: scoring.questions_to_ask,
          extraction: extracted,
          price_position: scoring.price_position,
          confidence: scoring.confidence,
        }),
      ),
      market_comparison: JSON.parse(
        JSON.stringify({
          band,
          lei_per_kwp: scoring.price_position.lei_per_kwp,
          label: scoring.price_position.label,
        }),
      ),

      scoring_rules_version: rulesVersion,
      is_paid: false,
    };

    const { data: existing } = await supabaseAdmin
      .from("offer_analyses")
      .select("id")
      .eq("offer_id", data.offerId)
      .maybeSingle();
    if (existing) {
      await supabaseAdmin.from("offer_analyses").update(analysisPayload).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("offer_analyses").insert(analysisPayload);
    }

    await supabaseAdmin.from("offers").update({ status: "analyzed" }).eq("id", data.offerId);

    return { ok: true };
  });

// Read fn used by /analiza/$offerId (owner or admin only via RLS on both tables).
export const getOfferAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => StartAnalysisInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: offer, error: offerErr } = await supabase
      .from("offers")
      .select(
        "id, status, created_at, supplier_name, total_price_lei, system_kwp, battery_present, user_id",
      )
      .eq("id", data.offerId)
      .maybeSingle();
    if (offerErr || !offer || offer.user_id !== userId) {
      throw new Error("Oferta nu există.");
    }
    const { data: extraction } = await supabase
      .from("offer_extractions")
      .select("status, failure_message, progress_message, updated_at")
      .eq("offer_id", data.offerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: analysis } = await supabase
      .from("offer_analyses")
      .select("id, status, is_paid, paid_at, updated_at")
      .eq("offer_id", data.offerId)
      .maybeSingle();
    return { offer, extraction, analysis };
  });

// Read the editable extraction separately from the lightweight progress DTO.
// Ownership is verified before the server-only admin client reads the extraction.
export const getOfferCorrectionData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => StartAnalysisInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: offer } = await supabase
      .from("offers")
      .select("id, user_id")
      .eq("id", data.offerId)
      .maybeSingle();
    if (!offer || offer.user_id !== userId) throw new Error("Oferta nu îți aparține.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: extraction, error } = await supabaseAdmin
      .from("offer_extractions")
      .select("normalized_result")
      .eq("offer_id", data.offerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !extraction) throw new Error("Nu există extracție pentru această ofertă.");
    return { extraction: extraction.normalized_result };
  });

// Optional manual correction path. Merges user-provided fields into the last
// extraction, marks the extraction as manually corrected, and re-scores.
const CorrectionsSchema = z.object({
  offerId: z.string().uuid(),
  corrections: z.record(z.string(), z.unknown()),
});

export const applyManualCorrection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CorrectionsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: offer } = await supabase
      .from("offers")
      .select("id, user_id, battery_present")
      .eq("id", data.offerId)
      .maybeSingle();
    if (!offer || offer.user_id !== userId) throw new Error("Oferta nu îți aparține.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: extraction } = await supabaseAdmin
      .from("offer_extractions")
      .select("id, normalized_result")
      .eq("offer_id", data.offerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!extraction) throw new Error("Nu există extracție pentru această ofertă.");

    const base = (extraction.normalized_result ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...base, ...data.corrections };
    if (data.corrections.warranties && typeof data.corrections.warranties === "object") {
      const bw = (base.warranties ?? {}) as Record<string, unknown>;
      merged.warranties = { ...bw, ...(data.corrections.warranties as Record<string, unknown>) };
    }

    // Mark all corrected fields as high-confidence (user asserted them).
    const fc: Record<string, "high"> = {};
    for (const k of Object.keys(data.corrections)) fc[k] = "high";

    await supabaseAdmin
      .from("offer_extractions")
      .update({
        normalized_result: merged as unknown as never,
        manually_corrected: true,
        field_confidence: fc as unknown as never,
      })
      .eq("id", extraction.id);

    const extracted = merged as unknown as ExtractedOffer;
    const contradictions = detectContradictions(extracted);
    const { rules, version: rulesVersion } = await loadActiveRules();
    const band = await loadMarketBand(extracted.system_kwp, extracted.battery_kwh ? true : extracted.battery_present ?? null);
    const scoring = scoreOffer(extracted, band, rules, {
      field_confidence: fc,
      contradictions,
    });

    const payload = {
      status: "ready" as const,
      overall_score: scoring.overall,
      category_scores: JSON.parse(JSON.stringify(scoring.category_scores)),
      free_result: JSON.parse(JSON.stringify(scoring.free_preview)),
      full_report: JSON.parse(
        JSON.stringify({
          strengths: scoring.strengths,
          risks: scoring.risks,
          questions_to_ask: scoring.questions_to_ask,
          extraction: extracted,
          price_position: scoring.price_position,
          confidence: scoring.confidence,
        }),
      ),
      market_comparison: JSON.parse(
        JSON.stringify({
          band,
          lei_per_kwp: scoring.price_position.lei_per_kwp,
          label: scoring.price_position.label,
        }),
      ),
      scoring_rules_version: rulesVersion,
    };

    const { data: existing } = await supabaseAdmin
      .from("offer_analyses")
      .select("id")
      .eq("offer_id", data.offerId)
      .maybeSingle();
    let analysisId: string;
    if (existing) {
      analysisId = existing.id;
      await supabaseAdmin.from("offer_analyses").update(payload).eq("id", existing.id);
    } else {
      const { data: ins } = await supabaseAdmin
        .from("offer_analyses")
        .insert({ ...payload, offer_id: data.offerId, user_id: userId, is_paid: false })
        .select("id")
        .single();
      analysisId = ins!.id;
    }
    return { analysisId };
  });

// Manual offer entry — creates a real offer + synthetic extraction and
// runs deterministic scoring. Returns { offerId, analysisId } so the caller
// can navigate straight to /rezultat-gratuit/$analysisId.
export const ManualOfferSchema = z
  .object({
    systemKwp: z.number({ required_error: "Puterea sistemului este obligatorie." }).positive("Puterea sistemului trebuie să fie pozitivă.").max(200),
    totalPriceLei: z.number({ required_error: "Prețul total este obligatoriu." }).positive("Prețul trebuie să fie pozitiv.").max(10_000_000),
    panelCount: z.number().int().positive().max(5000).nullable().optional(),
    panelWattage: z.number().min(250).max(800).nullable().optional(),
    inverterBrand: z.string().trim().max(200).nullable().optional(),
    inverterModel: z.string().trim().max(200).nullable().optional(),
    batteryPresent: z.boolean().nullable().optional(),
    batteryKwh: z.number().positive().max(200).nullable().optional(),
    supplierName: z.string().trim().max(200).nullable().optional(),
    warrantyPanelsYears: z.number().int().min(0).max(50).nullable().optional(),
    warrantyInverterYears: z.number().int().min(0).max(50).nullable().optional(),
    warrantyWorkmanshipYears: z.number().int().min(0).max(50).nullable().optional(),
    includedServices: z.array(z.string().trim().min(1).max(200)).max(30).optional(),
    vatIncluded: z.boolean().nullable().optional(),
  })
  .superRefine((value, context) => {
    if (value.batteryPresent === false && value.batteryKwh != null) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["batteryKwh"], message: "Capacitatea trebuie lăsată goală când oferta nu include baterie." });
    }
  });

export const submitManualOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ManualOfferSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await rateLimitOrThrow(userId, "manual-analysis", 6);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Create the offer row.
    const { data: offer, error: offerErr } = await supabase
      .from("offers")
      .insert({
        user_id: userId,
        source_method: "manual",
        status: "analyzing",
        supplier_name: data.supplierName ?? null,
        total_price_lei: data.totalPriceLei ?? null,
        system_kwp: data.systemKwp ?? null,
        battery_present: data.batteryPresent ?? null,
        vat_included: data.vatIncluded ?? null,
      })
      .select("id")
      .single();
    if (offerErr || !offer) throw new Error("Nu am putut crea oferta.");

    // 2. Build a synthetic ExtractedOffer.
    const extracted: ExtractedOffer & {
      is_photovoltaic_offer?: boolean;
      field_confidence?: Record<string, "high" | "medium" | "low">;
    } = {
      supplier_name: data.supplierName ?? null,
      system_kwp: data.systemKwp ?? null,
      panel_brand: null,
      panel_model: null,
      panel_count: data.panelCount ?? null,
      panel_wattage: data.panelWattage ?? null,
      inverter_brand: data.inverterBrand ?? null,
      inverter_model: data.inverterModel ?? null,
      inverter_kva: null,
      inverter_phases: null,
      battery_present: data.batteryPresent ?? (data.batteryKwh ? true : null),
      battery_kwh: data.batteryKwh ?? null,
      mounting_type: null,
      total_price_lei: data.totalPriceLei ?? null,
      vat_included: data.vatIncluded ?? null,
      price_breakdown: null,
      warranties: {
        panels_years: data.warrantyPanelsYears ?? null,
        inverter_years: data.warrantyInverterYears ?? null,
        workmanship_years: data.warrantyWorkmanshipYears ?? null,
      },
      included_services: data.includedServices ?? null,
      excluded_items: null,
      payment_terms: null,
      permit_included: null,
      commissioning_included: null,
      monitoring_included: null,
      is_photovoltaic_offer: true,
      field_confidence: {},
    };

    // 3. Insert a "success" extraction row so downstream code has a source of truth.
    const contradictions = detectContradictions(extracted);
    const extractedJson = JSON.parse(JSON.stringify(extracted));
    const { data: extraction, error: exErr } = await supabaseAdmin
      .from("offer_extractions")
      .insert({
        offer_id: offer.id,
        user_id: userId,
        status: "success",
        model: "manual",
        prompt_version: "manual.v1",
        normalized_result: extractedJson,
        raw_result: extractedJson,
        field_confidence: {} as unknown as never,
        contradictions: contradictions as unknown as never,
        overall_confidence: "high",
        manually_corrected: true,
        progress_message: "Introducere manuală",
      })
      .select("id")
      .single();
    if (exErr || !extraction) throw new Error("Nu am putut înregistra datele.");

    // 4. Score.
    const { rules, version: rulesVersion } = await loadActiveRules();
    const band = await loadMarketBand(extracted.system_kwp, extracted.battery_kwh ? true : extracted.battery_present ?? null);
    const scoring = scoreOffer(extracted, band, rules, {
      field_confidence: {},
      contradictions,
    });

    const analysisPayload = {
      offer_id: offer.id,
      user_id: userId,
      status: "ready" as const,
      overall_score: scoring.overall,
      category_scores: JSON.parse(JSON.stringify(scoring.category_scores)),
      free_result: JSON.parse(JSON.stringify(scoring.free_preview)),
      full_report: JSON.parse(
        JSON.stringify({
          strengths: scoring.strengths,
          risks: scoring.risks,
          questions_to_ask: scoring.questions_to_ask,
          extraction: extracted,
          price_position: scoring.price_position,
          confidence: scoring.confidence,
        }),
      ),
      market_comparison: JSON.parse(
        JSON.stringify({
          band,
          lei_per_kwp: scoring.price_position.lei_per_kwp,
          label: scoring.price_position.label,
        }),
      ),
      scoring_rules_version: rulesVersion,
      is_paid: false,
    };

    const { data: analysis, error: aErr } = await supabaseAdmin
      .from("offer_analyses")
      .insert(analysisPayload)
      .select("id")
      .single();
    if (aErr || !analysis) throw new Error("Nu am putut salva analiza.");

    await supabaseAdmin.from("offers").update({ status: "analyzed" }).eq("id", offer.id);

    return { offerId: offer.id, analysisId: analysis.id };
  });
