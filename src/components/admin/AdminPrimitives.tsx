import { Inbox, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function AdminPage({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="admin-page">
      <header>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}
export function AdminLoading({ label = "Se încarcă datele…" }: { label?: string }) {
  return (
    <div className="admin-state" aria-live="polite">
      <Loader2 className="animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
export function AdminEmpty({ label }: { label: string }) {
  return (
    <div className="admin-state admin-state--empty">
      <Inbox aria-hidden="true" />
      <strong>{label}</strong>
      <span>Nu este necesară nicio acțiune acum.</span>
    </div>
  );
}
export function AdminStatus({ value }: { value: string | boolean | null | undefined }) {
  const normalized = String(value ?? "necunoscut").toLowerCase();
  const positive =
    value === true || ["ready", "success", "paid", "handled", "active"].includes(normalized);
  const negative = ["failed", "error", "refunded"].includes(normalized);
  return (
    <span
      className={`admin-status ${positive ? "is-positive" : negative ? "is-negative" : "is-neutral"}`}
    >
      {value === true ? "Da" : value === false ? "Nu" : String(value ?? "—")}
    </span>
  );
}
