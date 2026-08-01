import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAuditLog } from "@/lib/admin.functions";
import { Card } from "@/components/primitives";

export const Route = createFileRoute("/_authenticated/admin/audit")({ component: Page });

function Page() {
  const load = useServerFn(listAuditLog);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listAuditLog>> | null>(null);
  useEffect(() => { load().then(setRows).catch(() => setRows([])); }, [load]);
  if (!rows) return <p className="text-sm text-muted-foreground">Se încarcă…</p>;
  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left"><tr>
          <th className="p-3">Data</th><th className="p-3">Actor</th><th className="p-3">Acțiune</th><th className="p-3">Țintă</th><th className="p-3">Detalii</th>
        </tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleString("ro-RO")}</td>
              <td className="p-3 font-mono text-[11px]">{r.actor_id?.slice(0, 8) ?? "—"}</td>
              <td className="p-3">{r.action}</td>
              <td className="p-3">{r.target_kind}/{r.target_id?.slice(0, 8)}</td>
              <td className="p-3 font-mono text-[11px] max-w-[300px] truncate">{JSON.stringify(r.details ?? {})}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
