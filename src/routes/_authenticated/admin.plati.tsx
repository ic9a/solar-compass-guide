import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAdminPayments } from "@/lib/admin.functions";
import { Card } from "@/components/primitives";
import {
  AdminEmpty,
  AdminLoading,
  AdminPage,
  AdminStatus,
} from "@/components/admin/AdminPrimitives";

export const Route = createFileRoute("/_authenticated/admin/plati")({ component: Page });

function Page() {
  const load = useServerFn(listAdminPayments);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listAdminPayments>> | null>(null);
  useEffect(() => {
    load()
      .then(setRows)
      .catch(() => setRows([]));
  }, [load]);
  if (!rows) return <AdminLoading label="Se încarcă plățile…" />;
  return (
    <AdminPage
      title="Plăți"
      description="Stări financiare disponibile doar pentru verificare administrativă."
    >
      {rows.length === 0 ? (
        <AdminEmpty label="Nu există plăți" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Creat</th>
                <th className="p-3">Status</th>
                <th className="p-3">Așteptat</th>
                <th className="p-3">Plătit</th>
                <th className="p-3">Rambursat</th>
                <th className="p-3">Session ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3 text-muted-foreground">
                    {new Date(p.created_at).toLocaleString("ro-RO")}
                  </td>
                  <td className="p-3">
                    <AdminStatus value={p.status} />
                  </td>
                  <td className="p-3">
                    {Number(p.amount_expected_lei).toFixed(2)} {p.currency.toUpperCase()}
                  </td>
                  <td className="p-3">
                    {p.amount_paid_lei ? Number(p.amount_paid_lei).toFixed(2) : "—"}
                  </td>
                  <td className="p-3">
                    {p.refund_amount_lei ? Number(p.refund_amount_lei).toFixed(2) : "—"}
                  </td>
                  <td className="p-3 font-mono text-[11px] truncate max-w-[180px]">
                    {p.stripe_checkout_session_id ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </AdminPage>
  );
}
