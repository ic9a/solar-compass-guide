import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAppSettings, updateAppSettings } from "@/lib/admin.functions";
import { Card } from "@/components/primitives";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPrimitives";

export const Route = createFileRoute("/_authenticated/admin/setari")({ component: Page });

const input = "w-full rounded-lg border px-3 py-2 text-sm bg-surface";

function Page() {
  const load = useServerFn(getAppSettings);
  const save = useServerFn(updateAppSettings);
  const [s, setS] = useState<Record<string, unknown> | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    load()
      .then((x) => setS(x as Record<string, unknown>))
      .catch(() => setS({}));
  }, [load]);

  if (!s) return <AdminLoading label="Se încarcă setările…" />;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const patch = {
      report_price_lei: Number(fd.get("report_price_lei")),
      retention_days: Number(fd.get("retention_days")),
      business_name: String(fd.get("business_name") ?? ""),
      business_cui: String(fd.get("business_cui") ?? ""),
      business_email: String(fd.get("business_email") ?? ""),
      business_address: String(fd.get("business_address") ?? ""),
      email_from: String(fd.get("email_from") ?? ""),
      email_reply_to: String(fd.get("email_reply_to") ?? ""),
      admin_notify_email: String(fd.get("admin_notify_email") ?? ""),
      emails_enabled: fd.get("emails_enabled") === "on",
      stripe_environment: String(fd.get("stripe_environment") ?? "test") as "test" | "live",
    };
    try {
      await save({ data: patch });
      setMsg("Salvat.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Eroare");
    }
  }
  const v = (k: string) => (s[k] ?? "") as string;
  return (
    <AdminPage
      title="Setări aplicație"
      description="Modificările de aici influențează funcționarea produsului. Verifică valorile înainte de salvare."
    >
      <Card className="p-6">
        <form onSubmit={onSubmit} className="grid gap-4 max-w-2xl">
          <label className="grid gap-1 text-sm">
            Preț raport (lei)
            <input
              name="report_price_lei"
              type="number"
              step="0.01"
              defaultValue={v("report_price_lei")}
              className={input}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Retenție date (zile)
            <input
              name="retention_days"
              type="number"
              defaultValue={v("retention_days")}
              className={input}
            />
          </label>
          <fieldset className="grid gap-3 border rounded-lg p-4">
            <legend className="text-xs font-semibold uppercase text-muted-foreground px-1">
              Identitate business (facturare)
            </legend>
            <label className="grid gap-1 text-sm">
              Denumire
              <input name="business_name" defaultValue={v("business_name")} className={input} />
            </label>
            <label className="grid gap-1 text-sm">
              CUI
              <input name="business_cui" defaultValue={v("business_cui")} className={input} />
            </label>
            <label className="grid gap-1 text-sm">
              Email business
              <input name="business_email" defaultValue={v("business_email")} className={input} />
            </label>
            <label className="grid gap-1 text-sm">
              Adresă
              <input
                name="business_address"
                defaultValue={v("business_address")}
                className={input}
              />
            </label>
          </fieldset>
          <fieldset className="grid gap-3 border rounded-lg p-4">
            <legend className="text-xs font-semibold uppercase text-muted-foreground px-1">
              Email
            </legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="emails_enabled"
                defaultChecked={s.emails_enabled as boolean}
              />{" "}
              Trimite emailuri tranzacționale
            </label>
            <label className="grid gap-1 text-sm">
              From
              <input name="email_from" defaultValue={v("email_from")} className={input} />
            </label>
            <label className="grid gap-1 text-sm">
              Reply-To
              <input name="email_reply_to" defaultValue={v("email_reply_to")} className={input} />
            </label>
            <label className="grid gap-1 text-sm">
              Notificări admin (destinatar)
              <input
                name="admin_notify_email"
                defaultValue={v("admin_notify_email")}
                className={input}
              />
            </label>
          </fieldset>
          <label className="grid gap-1 text-sm">
            Mediu Stripe
            <select
              name="stripe_environment"
              defaultValue={v("stripe_environment") || "test"}
              className={input}
            >
              <option value="test">Test (Sandbox)</option>
              <option value="live">Live</option>
            </select>
          </label>
          <button className="rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white">
            Salvează
          </button>
          {msg && <p className="text-sm">{msg}</p>}
        </form>
      </Card>
    </AdminPage>
  );
}
