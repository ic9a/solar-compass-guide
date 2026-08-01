import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAdminOffers, retryExtraction } from "@/lib/admin.functions";
import { Card } from "@/components/primitives";

export const Route = createFileRoute("/_authenticated/admin/oferte")({ component: Page });

function Page() {
  const load = useServerFn(listAdminOffers);
  const retry = useServerFn(retryExtraction);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listAdminOffers>> | null>(null);
  useEffect(() => { load({ data: { limit: 100 } }).then(setRows).catch(() => setRows([])); }, [load]);
  if (!rows) return <p className="text-sm text-muted-foreground">Se încarcă…</p>;
  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr><th className="p-3">Data</th><th className="p-3">Furnizor</th><th className="p-3">kWp</th><th className="p-3">Preț</th><th className="p-3">Status</th><th className="p-3"></th></tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id} className="border-t">
              <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("ro-RO")}</td>
              <td className="p-3">{o.supplier_name ?? "—"}</td>
              <td className="p-3">{o.system_kwp ?? "—"}</td>
              <td className="p-3">{o.total_price_lei ? Number(o.total_price_lei).toLocaleString("ro-RO") : "—"}</td>
              <td className="p-3">{o.status}</td>
              <td className="p-3 flex gap-2">
                <Link to="/analiza/$offerId" params={{ offerId: o.id }} className="underline">Deschide</Link>
                <button onClick={() => retry({ data: { offerId: o.id } })} className="text-muted-foreground underline">Reprocesează</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
