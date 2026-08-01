// Contact form: persists to DB, notifies admin via Resend, applies simple rate limit.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ContactSchema } from "@/lib/schemas";
import { logEvent } from "@/lib/observability.server";

export const submitContactMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ContactSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { rateLimitOrThrow } = await import("@/lib/rate-limit.server");
    await rateLimitOrThrow(context.userId, "contact", 5);

    // Rate limit: max 5 contact messages / hour per user.
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await context.supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) {
      throw new Error("Ai trimis prea multe mesaje. Încearcă din nou peste o oră.");
    }

    const { data: inserted, error } = await context.supabase
      .from("contact_messages")
      .insert({
        user_id: context.userId,
        name: data.name,
        email: data.email,
        subject: data.subject ?? null,
        message: data.message,
      })
      .select("id")
      .maybeSingle();
    if (error) {
      logEvent({ operation: "contact.submit", status: "failure", category: "CONTACT_STORAGE_FAILED" });
      throw new Error("Mesajul nu a putut fi salvat. Încearcă din nou.");
    }

    // Notify admin (best-effort, non-blocking user).
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: settings } = await supabaseAdmin
        .from("app_settings")
        .select("admin_notify_email")
        .eq("id", 1)
        .maybeSingle();
      const admin = settings?.admin_notify_email ?? "contact@raportsolar.ro";
      const { sendEmail, adminContactNotifyTemplate } = await import("@/lib/emails.server");
      const tpl = adminContactNotifyTemplate(data.name, data.email, data.subject ?? null, data.message);
      await sendEmail({ to: admin, subject: tpl.subject, html: tpl.html, replyTo: data.email, tag: "contact" });
    } catch {
      logEvent({ operation: "contact.notify", status: "failure", category: "CONTACT_NOTIFICATION_FAILED" });
    }

    return { ok: true, id: inserted?.id };
  });
