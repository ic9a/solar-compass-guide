import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listMarketOffers, setMarketOfferVerified } from "@/lib/admin.functions";
import { Card } from "@/components/primitives";

export const Route = createFileRoute("/_authenticated/admin/piata")({ component: Page });

function Page() {
  const load = useServerFn(listMarketOffers);
  const setVerified = useServerFn(setMarketOfferVerified);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listMarketOffers>> | null>(null);
  const refresh = () => load().then(setRows).catch(() => setRows([]));
  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!rows) return <p className="text-sm text-muted-foreground">Se încarcă…</p>;
  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left"><tr>
          <th className="p-3">Furnizor</th><th className="p-3">Sistem</th><th className="p-3">Preț</th><th className="p-3">Lei/kWp</th><th className="p-3">Verificat</th><th className="p-3">Activ</th><th className="p-3"></th>
        </tr></thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id} className="border-t">
              <td className="p-3">{m.supplier}</td>
              <td className="p-3">{m.system_kwp} kWp {m.system_type ?? ""}</td>
              <td className="p-3">{Number(m.total_price_lei).toLocaleString("ro-RO")}</td>
              <td className="p-3">{m.lei_per_kwp ? Math.round(Number(m.lei_per_kwp)).toLocaleString("ro-RO") : "—"}</td>
              <td className="p-3">{m.is_verified ? "✓" : "provisional"}</td>
              <td className="p-3">{m.is_active ? "✓" : "—"}</td>
              <td className="p-3 flex gap-2">
                <button onClick={async () => { await setVerified({ data: { id: m.id, is_verified: !m.is_verified } }); refresh(); }} className="underline">
                  {m.is_verified ? "Retrage verificare" : "Verifică"}
                </button>
                <button onClick={async () => { await setVerified({ data: { id: m.id, is_verified: m.is_verified, is_active: !m.is_active } }); refresh(); }} className="underline text-muted-foreground">
                  {m.is_active ? "Dezactivează" : "Activează"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
