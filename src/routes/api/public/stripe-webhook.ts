// Stripe webhook — hardened. Public route (bypasses auth).
//
// Registered endpoint (Sandbox):
//   https://raportsolar.ro/api/public/stripe-webhook
//
// Invariants:
//  - Reads the raw request body (never mutated) before signature verification.
//  - Rejects with 400 on missing/invalid signature.
//  - Every event is deduplicated via `stripe_webhook_events.stripe_event_id`.
//  - Ownership/price/currency/payment_status/livemode are re-validated against the
//    local `payments` row and the freshly retrieved Stripe session.
//  - Never logs secrets, raw body, or private metadata.
//  - Only unlocks `offer_analyses.is_paid` after all invariants hold.

import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";

type SB = Awaited<ReturnType<typeof loadAdmin>>["supabaseAdmin"];

async function loadAdmin() {
  return await import("@/integrations/supabase/client.server");
}

async function recordEvent(
  sb: SB,
  event: Stripe.Event,
  status: "received" | "processed" | "duplicate" | "error",
  paymentId: string | null,
  safeError?: string,
) {
  const patch: Record<string, unknown> = { status };
  if (status === "processed") patch.processed_at = new Date().toISOString();
  if (safeError) patch.safe_error = safeError.slice(0, 500);
  if (paymentId) patch.payment_id = paymentId;
  await sb
    .from("stripe_webhook_events")
    .update(patch as never)
    .eq("stripe_event_id", event.id);
}

async function markPaymentPaid(
  sb: SB,
  session: Stripe.Checkout.Session,
): Promise<{ ok: boolean; paymentId: string | null; err?: string }> {
  const { data: payment } = await sb
    .from("payments")
    .select("id, user_id, analysis_id, amount_expected_lei, currency, status, livemode")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();
  if (!payment) return { ok: false, paymentId: null, err: "payment_not_found" };

  // Metadata → owner cross-check.
  const metaUser = session.metadata?.user_id;
  const metaAnalysis = session.metadata?.analysis_id;
  if (metaUser && metaUser !== payment.user_id) {
    return { ok: false, paymentId: payment.id, err: "user_mismatch" };
  }
  if (metaAnalysis && metaAnalysis !== payment.analysis_id) {
    return { ok: false, paymentId: payment.id, err: "analysis_mismatch" };
  }

  // Amount + currency check.
  const amountLei = session.amount_total ? session.amount_total / 100 : 0;
  const expected = Number(payment.amount_expected_lei);
  if (Math.abs(amountLei - expected) > 0.5) {
    return { ok: false, paymentId: payment.id, err: "amount_mismatch" };
  }
  if ((session.currency ?? "").toLowerCase() !== "ron") {
    return { ok: false, paymentId: payment.id, err: "currency_mismatch" };
  }
  // livemode consistency
  if (payment.livemode !== null && payment.livemode !== session.livemode) {
    return { ok: false, paymentId: payment.id, err: "livemode_mismatch" };
  }
  if (session.payment_status !== "paid") {
    return { ok: false, paymentId: payment.id, err: "not_paid" };
  }

  const paidAt = new Date().toISOString();
  await sb
    .from("payments")
    .update({
      status: "paid",
      amount_paid_lei: amountLei,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      paid_at: paidAt,
      livemode: session.livemode,
    })
    .eq("id", payment.id);

  await sb
    .from("offer_analyses")
    .update({
      is_paid: true,
      paid_at: paidAt,
      amount_paid_lei: amountLei,
      stripe_session_id: session.id,
    })
    .eq("id", payment.analysis_id)
    .eq("user_id", payment.user_id);

  return { ok: true, paymentId: payment.id };
}

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!secret || !stripeKey) {
          return new Response("Webhook not configured", { status: 503 });
        }
        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 400 });

        const rawBody = await request.text();
        const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" as never });

        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(rawBody, signature, secret);
        } catch {
          return new Response("Invalid signature", { status: 400 });
        }

        const { supabaseAdmin } = await loadAdmin();

        // Idempotent insert: unique constraint on stripe_event_id.
        const { error: insertErr } = await supabaseAdmin.from("stripe_webhook_events").insert({
          stripe_event_id: event.id,
          event_type: event.type,
          livemode: event.livemode,
          status: "received",
        });
        if (insertErr) {
          // Duplicate delivery — respond 200 without reprocessing.
          return new Response(JSON.stringify({ deduped: true }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        try {
          switch (event.type) {
            case "checkout.session.completed":
            case "checkout.session.async_payment_succeeded": {
              const rawSession = event.data.object as Stripe.Checkout.Session;
              // Retrieve fresh from Stripe to avoid trusting the event payload alone.
              const session = await stripe.checkout.sessions.retrieve(rawSession.id);
              if (session.payment_status !== "paid") {
                // Delayed payment: keep pending; wait for async_payment_succeeded.
                await recordEvent(supabaseAdmin, event, "processed", null, "awaiting_async");
                break;
              }
              const res = await markPaymentPaid(supabaseAdmin, session);
              await recordEvent(
                supabaseAdmin,
                event,
                res.ok ? "processed" : "error",
                res.paymentId,
                res.err,
              );
              break;
            }
            case "checkout.session.async_payment_failed": {
              const s = event.data.object as Stripe.Checkout.Session;
              const { data: payment } = await supabaseAdmin
                .from("payments")
                .select("id")
                .eq("stripe_checkout_session_id", s.id)
                .maybeSingle();
              if (payment) {
                await supabaseAdmin
                  .from("payments")
                  .update({ status: "failed", failed_at: new Date().toISOString() })
                  .eq("id", payment.id);
              }
              await recordEvent(supabaseAdmin, event, "processed", payment?.id ?? null);
              break;
            }
            case "checkout.session.expired": {
              const s = event.data.object as Stripe.Checkout.Session;
              const { data: payment } = await supabaseAdmin
                .from("payments")
                .select("id, status")
                .eq("stripe_checkout_session_id", s.id)
                .maybeSingle();
              if (payment && payment.status === "pending") {
                await supabaseAdmin
                  .from("payments")
                  .update({ status: "expired", expired_at: new Date().toISOString() })
                  .eq("id", payment.id);
              }
              await recordEvent(supabaseAdmin, event, "processed", payment?.id ?? null);
              break;
            }
            case "charge.refunded": {
              const charge = event.data.object as Stripe.Charge;
              const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
              if (!pi) {
                await recordEvent(supabaseAdmin, event, "error", null, "no_payment_intent");
                break;
              }
              // Find local payment by payment_intent (fallback: look up session).
              let { data: payment } = await supabaseAdmin
                .from("payments")
                .select("id, analysis_id, user_id, amount_paid_lei, status")
                .eq("stripe_payment_intent_id", pi)
                .maybeSingle();
              if (!payment) {
                const list = await stripe.checkout.sessions.list({ payment_intent: pi, limit: 1 });
                const sid = list.data[0]?.id;
                if (sid) {
                  const r = await supabaseAdmin
                    .from("payments")
                    .select("id, analysis_id, user_id, amount_paid_lei, status")
                    .eq("stripe_checkout_session_id", sid)
                    .maybeSingle();
                  payment = r.data ?? null;
                }
              }
              if (!payment) {
                await recordEvent(supabaseAdmin, event, "error", null, "no_local_payment");
                break;
              }
              const refundLei = (charge.amount_refunded ?? 0) / 100;
              const originalLei = Number(payment.amount_paid_lei ?? 0);
              const isFull = charge.refunded === true || refundLei + 0.5 >= originalLei;
              await supabaseAdmin
                .from("payments")
                .update({
                  status: isFull ? "refunded" : "refunded_partial",
                  refund_amount_lei: refundLei,
                  refunded_at: new Date().toISOString(),
                  stripe_charge_id: charge.id,
                })
                .eq("id", payment.id);
              if (isFull) {
                await supabaseAdmin
                  .from("offer_analyses")
                  .update({ is_paid: false, refunded_at: new Date().toISOString() })
                  .eq("id", payment.analysis_id);
              }
              await recordEvent(supabaseAdmin, event, "processed", payment.id);
              break;
            }
            default:
              await recordEvent(supabaseAdmin, event, "processed", null, "ignored_type");
              break;
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "unknown";
          await recordEvent(supabaseAdmin, event, "error", null, msg);
          // Return 500 so Stripe retries.
          return new Response("Handler error", { status: 500 });
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
      GET: async () => {
        const ready = Boolean(process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_SECRET_KEY);
        const testMode = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_");
        return new Response(
          JSON.stringify({
            endpoint: "/api/public/stripe-webhook",
            ready,
            test_mode: testMode,
            events: [
              "checkout.session.completed",
              "checkout.session.async_payment_succeeded",
              "checkout.session.async_payment_failed",
              "checkout.session.expired",
              "charge.refunded",
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    },
  },
});
