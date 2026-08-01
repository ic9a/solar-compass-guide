import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAdminContacts, markContactHandled } from "@/lib/admin.functions";
import { Card } from "@/components/primitives";

export const Route = createFileRoute("/_authenticated/admin/mesaje")({ component: Page });

function Page() {
  const load = useServerFn(listAdminContacts);
  const mark = useServerFn(markContactHandled);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listAdminContacts>> | null>(null);
  const refresh = () => load().then(setRows).catch(() => setRows([]));
  useEffect(() => { refresh(); }, []); // eslint-disable-line
  if (!rows) return <p className="text-sm text-muted-foreground">Se încarcă…</p>;
  return (
    <div className="space-y-3">
      {rows.map((m) => (
        <Card key={m.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-semibold">{m.name} <span className="text-muted-foreground">&lt;{m.email}&gt;</span></div>
              <div className="text-muted-foreground text-xs">{new Date(m.created_at).toLocaleString("ro-RO")} — {m.subject ?? "(fără subiect)"}</div>
            </div>
            <button onClick={async () => { await mark({ data: { id: m.id, handled: !m.handled } }); refresh(); }} className="text-xs underline">
              {m.handled ? "Marchează ca necitit" : "Marchează rezolvat"}
            </button>
          </div>
          <p className="mt-2 text-sm whitespace-pre-wrap">{m.message}</p>
        </Card>
      ))}
      {rows.length === 0 && <p className="text-sm text-muted-foreground">Nu există mesaje.</p>}
    </div>
  );
}
