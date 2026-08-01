// /admin — dashboard for users with the database-backed admin role. Guarded server-side.
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Settings,
  Mail,
  ScrollText,
  CreditCard,
  Webhook,
  ShieldCheck,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Section, Card } from "@/components/primitives";
import { getAdminDashboard } from "@/lib/admin.functions";
import { AdminLoading, AdminPage } from "@/components/admin/AdminPrimitives";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Admin — raportsolar.ro" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLayout,
  errorComponent: ({ error }) => (
    <SiteLayout>
      <Section className="!py-20 text-center">
        <h1 className="text-xl font-bold">Acces interzis</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </Section>
    </SiteLayout>
  ),
});

const NAV = [
  { to: "/admin", label: "Prezentare", icon: LayoutDashboard, exact: true },
  { to: "/admin/oferte", label: "Oferte", icon: ShoppingBag },
  { to: "/admin/piata", label: "Piață", icon: Store },
  { to: "/admin/mesaje", label: "Mesaje", icon: Mail },
  { to: "/admin/plati", label: "Plăți", icon: CreditCard },
  { to: "/admin/webhooks", label: "Evenimente", icon: Webhook },
  { to: "/admin/setari", label: "Setări", icon: Settings },
  { to: "/admin/audit", label: "Audit", icon: ScrollText },
] as const;

function AdminLayout() {
  return (
    <SiteLayout>
      <Section className="!py-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[240px_1fr]">
          <aside className="admin-sidebar self-start rounded-[1.75rem] bg-[#102a2b] p-3 text-white shadow-lift md:sticky md:top-24">
            <div className="px-3 pb-3 pt-2">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                raportsolar.ro
              </div>
              <div className="mt-1 flex items-center gap-2 font-bold">
                <ShieldCheck className="h-4 w-4 text-brand-sun" /> Administrare
              </div>
            </div>
            <nav className="flex gap-1 overflow-auto md:flex-col">
              {NAV.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  activeOptions={{ exact: to === "/admin" }}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-white/65 hover:bg-white/8 hover:text-white [&.active]:bg-white/12 [&.active]:font-semibold [&.active]:text-white"
                >
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              ))}
            </nav>
          </aside>
          <div className="admin-content min-w-0">
            <div className="admin-shell-header mb-6">
              <div className="product-kicker">Panou intern</div>
              <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em]">Control operațional</h1>
              <p>
                Informațiile necesare pentru verificare, suport și audit — fără elemente decorative
                inutile.
              </p>
            </div>
            <Outlet />
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}

export function AdminDashboard() {
  const load = useServerFn(getAdminDashboard);
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminDashboard>> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    load()
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : "Eroare"));
  }, [load]);
  if (err) return <p className="text-sm text-destructive">{err}</p>;
  if (!data) return <AdminLoading label="Se calculează indicatorii…" />;
  return (
    <AdminPage
      title="Situația curentă"
      description="Indicatori operaționali din ultimele 30 de zile."
    >
      <div className="admin-metrics grid gap-4 sm:grid-cols-2">
        <Stat label="Oferte (30 zile)" value={data.offers30d} />
        <Stat label="Analize (30 zile)" value={data.analyses30d} />
        <Stat label="Mesaje contact necitite" value={data.unhandledContacts} />
        <Stat label="Extracții eșuate" value={data.failedExtractions30d} />
      </div>
    </AdminPage>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-6">
      <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </Card>
  );
}
