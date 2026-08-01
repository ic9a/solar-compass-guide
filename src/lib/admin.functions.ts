// Admin-only server functions. Every handler re-checks `has_role(userId,'admin')`
// against the caller's authenticated Supabase client. supabaseAdmin is only
// used AFTER the role check, and only inside handler bodies.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> }, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || data !== true) throw new Error("Acces interzis.");
}

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const [offers, analyses, payments, contacts, failed] = await Promise.all([
      supabaseAdmin.from("offers").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabaseAdmin.from("offer_analyses").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabaseAdmin.from("payments").select("id, amount_paid_lei", { count: "exact" }).eq("status", "paid").gte("paid_at", since),
      supabaseAdmin.from("contact_messages").select("id", { count: "exact", head: true }).gte("created_at", since).eq("handled", false),
      supabaseAdmin.from("offer_extractions").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", since),
    ]);
    const revenue = (payments.data ?? []).reduce((s, r) => s + Number(r.amount_paid_lei ?? 0), 0);
    return {
      offers30d: offers.count ?? 0,
      analyses30d: analyses.count ?? 0,
      paidReports30d: payments.count ?? 0,
      revenue30dLei: revenue,
      unhandledContacts: contacts.count ?? 0,
      failedExtractions30d: failed.count ?? 0,
    };
  });

export const listAdminOffers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ limit: z.number().max(200).default(50) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: offers } = await supabaseAdmin
      .from("offers")
      .select("id, user_id, supplier_name, system_kwp, total_price_lei, status, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    return offers ?? [];
  });

export const listAdminPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("payments")
      .select("id, user_id, analysis_id, status, amount_expected_lei, amount_paid_lei, refund_amount_lei, currency, stripe_checkout_session_id, paid_at, refunded_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

export const listAdminContacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

export const markContactHandled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), handled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("contact_messages").update({ handled: data.handled }).eq("id", data.id);
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "contact_handled",
      target_kind: "contact_messages",
      target_id: data.id,
      details: { handled: data.handled },
    });
    return { ok: true };
  });

export const listMarketOffers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("market_offers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    return data ?? [];
  });

export const setMarketOfferVerified = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), is_verified: z.boolean(), is_active: z.boolean().optional() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = { is_verified: data.is_verified };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof data.is_active === "boolean") patch.is_active = data.is_active;
    await supabaseAdmin.from("market_offers").update(patch as never).eq("id", data.id);
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "market_offer_verified",
      target_kind: "market_offers",
      target_id: data.id,
      details: patch as never,
    });
    return { ok: true };
  });

export const getAppSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("app_settings").select("*").eq("id", 1).maybeSingle();
    return data;
  });

export const updateAppSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        report_price_lei: z.number().min(1).max(5000).optional(),
        retention_days: z.number().min(1).max(3650).optional(),
        business_name: z.string().max(200).optional(),
        business_cui: z.string().max(50).optional(),
        business_email: z.string().email().optional().or(z.literal("")),
        business_address: z.string().max(500).optional(),
        emails_enabled: z.boolean().optional(),
        email_from: z.string().max(200).optional(),
        email_reply_to: z.string().max(200).optional(),
        admin_notify_email: z.string().max(200).optional(),
        stripe_environment: z.enum(["test", "live"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Bump price version if price changed
    let patch: Record<string, unknown> = { ...data };
    if (typeof data.report_price_lei === "number") {
      const { data: cur } = await supabaseAdmin
        .from("app_settings")
        .select("report_price_lei, price_settings_version")
        .eq("id", 1)
        .maybeSingle();
      if (cur && Number(cur.report_price_lei) !== data.report_price_lei) {
        patch = { ...patch, price_settings_version: Number(cur.price_settings_version ?? 1) + 1 };
      }
    }
    await supabaseAdmin.from("app_settings").update(patch as never).eq("id", 1);
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "app_settings_updated",
      target_kind: "app_settings",
      target_id: "1",
      details: patch as never,
    });
    return { ok: true };
  });

export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(200);
    return data ?? [];
  });

export const listWebhookEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("stripe_webhook_events")
      .select("*")
      .order("received_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });

export const retryExtraction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ offerId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("offer_extractions").update({ status: "pending" }).eq("offer_id", data.offerId);
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "extraction_retry_queued",
      target_kind: "offers",
      target_id: data.offerId,
    });
    return { ok: true };
  });

export const requestAccountDeletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("profiles").update({ deletion_requested_at: new Date().toISOString() }).eq("id", context.userId);
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "deletion_requested",
      target_kind: "profiles",
      target_id: context.userId,
    });
    return { ok: true };
  });
