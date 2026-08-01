// Hardened Stripe checkout server functions.
// Security invariants:
//  - Server-side auth + ownership check
//  - Server-side price from app_settings (never trusts client)
//  - Origin allowlist (no open-redirect via success/cancel URL)
//  - Requires non-anonymous account before checkout
//  - Creates local `payments` row before redirect, with a stable idempotency key
//  - Stripe idempotency key prevents duplicate purchase attempts

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PAYMENTS_ENABLED } from "@/lib/features";
import { evaluatePaidReportAccess } from "@/lib/report-access";

const ALLOWED_ORIGINS = new Set([
  "https://raportsolar.ro",
  "https://www.raportsolar.ro",
  ...(process.env.APP_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

function safeOrigin(candidate: string): string {
  let normalized: string;
  try {
    const url = new URL(candidate);
    normalized = `${url.protocol}//${url.host}`;
  } catch {
    throw new Error("Origine invalidă pentru procesul de plată.");
  }
  if (!ALLOWED_ORIGINS.has(normalized)) {
    // Explicit reject — never silently redirect elsewhere.
    throw new Error(
      `Această origine (${normalized}) nu este permisă pentru procesul de plată. Contactează-ne dacă folosești un domeniu valid.`,
    );
  }
  return normalized;
}

const CreateCheckoutInput = z.object({
  analysisId: z.string().uuid(),
  origin: z.string().url(),
});

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateCheckoutInput.parse(input))
  .handler(async ({ data, context }) => {
    if (!PAYMENTS_ENABLED) throw new Error("Plățile nu sunt disponibile momentan.");
    const { supabase, userId, claims } = context;
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Plățile nu sunt configurate momentan.");

    // Block anonymous users — they must upgrade to a permanent account first.
    // Supabase adds is_anonymous to the JWT claims.
    if ((claims as { is_anonymous?: boolean })?.is_anonymous) {
      throw new Error(
        "Pentru a plăti raportul trebuie să confirmi un cont permanent. Deschide /autentificare și continuă cu email + parolă sau link magic.",
      );
    }

    // Ownership + analysis-ready check.
    const { data: analysis, error } = await supabase
      .from("offer_analyses")
      .select("id, offer_id, user_id, status, is_paid")
      .eq("id", data.analysisId)
      .maybeSingle();
    if (error || !analysis || analysis.user_id !== userId) {
      throw new Error("Analiza nu există sau nu îți aparține.");
    }
    if (analysis.status !== "ready") {
      throw new Error("Analiza nu este finalizată încă.");
    }
    if (analysis.is_paid) {
      const origin = safeOrigin(data.origin);
      return { alreadyPaid: true as const, url: `${origin}/raport-complet/${analysis.id}` };
    }

    const origin = safeOrigin(data.origin);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: settings } = await supabaseAdmin
      .from("app_settings")
      .select("report_price_lei, price_settings_version, stripe_environment")
      .eq("id", 1)
      .maybeSingle();
    const priceLei = Number(settings?.report_price_lei);
    if (!Number.isFinite(priceLei) || priceLei <= 0 || priceLei > 5000) {
      throw new Error("Prețul raportului nu este configurat corect.");
    }
    const priceVersion = Number(settings?.price_settings_version ?? 1);

    // 1. Ensure a local pending payment row FIRST. Downstream logic
    // (webhook, retries) can find the row even if Stripe creation fails.
    const priceVersion_ = Number(settings?.price_settings_version ?? 1);
    const idempotencyKey = `analysis_${analysis.id}_v${priceVersion_}`;

    const { data: existingPending } = await supabaseAdmin
      .from("payments")
      .select("id, stripe_checkout_session_id, status")
      .eq("analysis_id", analysis.id)
      .eq("status", "pending")
      .maybeSingle();

    let paymentId: string;
    if (existingPending) {
      paymentId = existingPending.id;
      await supabaseAdmin
        .from("payments")
        .update({
          amount_expected_lei: priceLei,
          idempotency_key: idempotencyKey,
          price_settings_version: priceVersion_,
        })
        .eq("id", existingPending.id);
    } else {
      const { data: inserted, error: insErr } = await supabaseAdmin
        .from("payments")
        .insert({
          user_id: userId,
          analysis_id: analysis.id,
          status: "pending",
          amount_expected_lei: priceLei,
          currency: "ron",
          idempotency_key: idempotencyKey,
          price_settings_version: priceVersion_,
        })
        .select("id")
        .single();
      if (insErr || !inserted) throw new Error("Nu am putut înregistra plata.");
      paymentId = inserted.id;
    }

    const stripe = new Stripe(key, { apiVersion: "2024-06-20" as never });

    // 2. If we already have a Stripe session on the reused row and it's still open, reuse.
    if (existingPending?.stripe_checkout_session_id) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(
          existingPending.stripe_checkout_session_id,
        );
        if (existing.status === "open" && existing.url) {
          return {
            alreadyPaid: false as const,
            url: existing.url,
            testMode: !existing.livemode,
          };
        }
      } catch {
        /* fall through to new session */
      }
    }

    // 3. Create the Stripe checkout session. If this fails, mark the local
    // row failed so it doesn't linger as pending forever.
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: "ron",
                unit_amount: Math.round(priceLei * 100),
                product_data: {
                  name: "Raport complet analiză ofertă fotovoltaică",
                  description: "Acces permanent la raportul detaliat pentru oferta ta.",
                },
              },
            },
          ],
          client_reference_id: paymentId,
          metadata: {
            payment_id: paymentId,
            analysis_id: analysis.id,
            offer_id: analysis.offer_id,
            user_id: userId,
            price_settings_version: String(priceVersion_),
          },
          success_url: `${origin}/raport-complet/${analysis.id}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/rezultat-gratuit/${analysis.id}`,
        },
        { idempotencyKey: `${idempotencyKey}_${paymentId}` },
      );
    } catch (err) {
      await supabaseAdmin
        .from("payments")
        .update({
          status: "failed",
          failed_at: new Date().toISOString(),
          last_error: err instanceof Error ? err.message.slice(0, 500) : "stripe_error",
        })
        .eq("id", paymentId);
      throw new Error("Nu am putut porni sesiunea de plată. Reîncearcă în câteva secunde.");
    }

    // 4. Update the local row with the Stripe session id.
    await supabaseAdmin
      .from("payments")
      .update({
        stripe_checkout_session_id: session.id,
        livemode: session.livemode,
      })
      .eq("id", paymentId);

    return {
      alreadyPaid: false as const,
      url: session.url ?? "",
      testMode: !session.livemode,
    };
  });

// Owner-scoped analysis read.
export const getAnalysisById = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ analysisId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: analysis, error } = await supabase
      .from("offer_analyses")
      .select(
        "id, offer_id, user_id, status, overall_score, category_scores, free_result, market_comparison, is_paid, paid_at, amount_paid_lei, updated_at, scoring_rules_version, calculation_version, benchmark_dataset_version",
      )
      .eq("id", data.analysisId)
      .maybeSingle();
    if (error || !analysis || analysis.user_id !== userId) {
      throw new Error("Analiza nu există.");
    }
    const [{ data: offer }, { data: extraction }] = await Promise.all([
      supabase
        .from("offers")
        .select("id, supplier_name, total_price_lei, system_kwp, battery_present, created_at")
        .eq("id", analysis.offer_id)
        .maybeSingle(),
      supabase
        .from("offer_extractions")
        .select("overall_confidence, contradictions")
        .eq("offer_id", analysis.offer_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    return {
      analysis,
      offer,
      freeConfidence: {
        overall: extraction?.overall_confidence ?? "high",
        contradictions: Array.isArray(extraction?.contradictions)
          ? extraction.contradictions.slice(0, 3)
          : [],
      },
    };
  });

// Public server-safe: test-mode flag + configured price for frontend banner + button.
// app_settings is no longer readable by the anon role; use the server-only admin
// client to project just the two non-sensitive fields the frontend needs.
export const getPaymentsPublicInfo = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const testMode = key.startsWith("sk_test_");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("report_price_lei, stripe_environment")
    .eq("id", 1)
    .maybeSingle();
  return {
    enabled: PAYMENTS_ENABLED,
    testMode,
    priceLei: Number(data?.report_price_lei ?? 49),
    environment: (data?.stripe_environment as string) ?? "test",
  };
});

// Server-side authorization check for the paid report page.
// Returns { authorized: true, analysis, offer, payment } only when a paid, non-refunded record exists.
export const authorizeReportAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ analysisId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: analysis } = await supabase
      .from("offer_analyses")
      .select(
        "id, offer_id, user_id, status, overall_score, category_scores, full_report, market_comparison, is_paid, paid_at, scoring_rules_version, calculation_version, benchmark_dataset_version",
      )
      .eq("id", data.analysisId)
      .maybeSingle();
    if (!analysis) {
      return { authorized: false as const, reason: "not_found" as const };
    }
    const ownerDecision = evaluatePaidReportAccess({ requesterId: userId, ownerId: analysis.user_id });
    if (!ownerDecision.authorized) {
      return { authorized: false as const, reason: "not_found" as const };
    }
    // Look up authoritative payment record.
    const { data: payment } = await supabase
      .from("payments")
      .select(
        "id, status, paid_at, refunded_at, refund_amount_lei, amount_paid_lei, stripe_checkout_session_id",
      )
      .eq("analysis_id", analysis.id)
      .eq("user_id", userId)
      .in("status", ["paid", "refunded_partial"])
      .order("paid_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const access = evaluatePaidReportAccess({
      requesterId: userId,
      ownerId: analysis.user_id,
      paymentStatus: payment?.status,
      paidAt: payment?.paid_at,
      refundedAt: payment?.refunded_at,
    });
    if (!access.authorized) {
      return { authorized: false as const, reason: access.reason, analysisId: analysis.id };
    }
    const { data: offer } = await supabase
      .from("offers")
      .select("id, supplier_name, total_price_lei, system_kwp, battery_present, created_at")
      .eq("id", analysis.offer_id)
      .maybeSingle();
    return { authorized: true as const, analysis, offer, payment };
  });
