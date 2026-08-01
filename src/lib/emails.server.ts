// Resend transactional email helper. Uses verified mail.raportsolar.ro domain.
// Never called from client code. Called by server functions after
// business events (contact received, analysis ready, payment ok, admin reply).

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  tag?: string;
};

const GATEWAY_URL = "https://api.resend.com";

export async function sendEmail(args: SendArgs): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not configured" };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: settings } = await supabaseAdmin
    .from("app_settings")
    .select("emails_enabled, email_from, email_reply_to")
    .eq("id", 1)
    .maybeSingle();
  if (!settings?.emails_enabled) return { ok: false, error: "emails_disabled" };

  const from = settings.email_from ?? "RaportSolar <no-reply@mail.raportsolar.ro>";
  const replyTo = args.replyTo ?? settings.email_reply_to ?? "contact@raportsolar.ro";

  try {
    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [args.to],
        subject: args.subject,
        html: args.html,
        reply_to: replyTo,
        tags: args.tag ? [{ name: "kind", value: args.tag }] : undefined,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `resend_${res.status}: ${text.slice(0, 200)}` };
    }
    const body = (await res.json()) as { id?: string };
    return { ok: true, id: body.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

export function reportReadyTemplate(link: string): { subject: string; html: string } {
  return {
    subject: "Raportul tău solar este gata",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px">
        <h1 style="font-size:20px">Raportul tău este gata</h1>
        <p>Analiza ofertei tale fotovoltaice a fost finalizată. Poți vedea rezultatul gratuit acum.</p>
        <p><a href="${link}" style="display:inline-block;background:#0f172a;color:#fff;padding:10px 18px;border-radius:9999px;text-decoration:none">Deschide raportul</a></p>
        <p style="color:#64748b;font-size:12px">Dacă nu ai încercat o analiză pe raportsolar.ro, ignoră acest mesaj.</p>
      </div>`,
  };
}

export function paymentReceiptTemplate(link: string, amountLei: number): { subject: string; html: string } {
  return {
    subject: "Confirmare plată — raport complet raportsolar.ro",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px">
        <h1 style="font-size:20px">Mulțumim pentru achiziție</h1>
        <p>Am primit plata de <strong>${amountLei.toFixed(2)} RON</strong>. Raportul complet este acum disponibil în contul tău.</p>
        <p><a href="${link}" style="display:inline-block;background:#0f172a;color:#fff;padding:10px 18px;border-radius:9999px;text-decoration:none">Vezi raportul complet</a></p>
      </div>`,
  };
}

export function adminContactNotifyTemplate(name: string, email: string, subject: string | null, message: string) {
  return {
    subject: `[Contact] ${subject ?? "Mesaj nou"}`,
    html: `
      <div style="font-family:sans-serif">
        <p><strong>De la:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
        <p><strong>Subiect:</strong> ${escapeHtml(subject ?? "—")}</p>
        <hr />
        <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(message)}</pre>
      </div>`,
  };
}

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
