import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listWebhookEvents } from "@/lib/admin.functions";
import { Card } from "@/components/primitives";

export const Route = createFileRoute("/_authenticated/admin/webhooks")({ component: Page });

function Page() {
  const load = useServerFn(listWebhookEvents);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listWebhookEvents>> | null>(null);
  useEffect(() => { load().then(setRows).catch(() => setRows([])); }, [load]);
  if (!rows) return <p className="text-sm text-muted-foreground">Se încarcă…</p>;
  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left"><tr>
          <th className="p-3">Primit</th><th className="p-3">Tip</th><th className="p-3">Live</th><th className="p-3">Status</th><th className="p-3">Event ID</th><th className="p-3">Eroare</th>
        </tr></thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="p-3 text-muted-foreground">{new Date(e.received_at).toLocaleString("ro-RO")}</td>
              <td className="p-3">{e.event_type}</td>
              <td className="p-3">{e.livemode ? "LIVE" : "test"}</td>
              <td className="p-3">{e.status}</td>
              <td className="p-3 font-mono text-[11px] truncate max-w-[200px]">{e.stripe_event_id}</td>
              <td className="p-3 text-destructive text-xs">{e.safe_error ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
