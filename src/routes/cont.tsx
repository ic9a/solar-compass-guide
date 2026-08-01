import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Section, Card } from "@/components/primitives";
import { useAuthSession } from "@/hooks/useAuthSession";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, FileText, Settings, User as UserIcon, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/cont")({
  head: () => ({
    meta: [
      { title: "Contul tău — raportsolar.ro" },
      { name: "description", content: "Vezi rapoartele salvate și setările contului tău raportsolar.ro." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

function Page() {
  const nav = useNavigate();
  const location = useLocation();
  const { isAuthenticated, session, loading } = useAuthSession();

  if (!loading && !isAuthenticated) {
    return (
      <SiteLayout>
        <Section className="!py-10 md:!py-16">
          <div className="max-w-md mx-auto text-center">
            <UserIcon className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-3 text-2xl font-bold">Autentifică-te pentru cont</h1>
            <p className="mt-2 text-muted-foreground">
              Contul îți permite să-ți salvezi rapoartele și să le accesezi de pe orice dispozitiv.
            </p>
            <Link
              to="/autentificare"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow"
            >
              Autentifică-te
            </Link>
          </div>
        </Section>
      </SiteLayout>
    );
  }

  if (location.pathname !== "/cont" && location.pathname !== "/cont/") {
    return <Outlet />;
  }

  return (
    <SiteLayout>
      <Section className="!py-10 md:!py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-5 rounded-[2.25rem] bg-[#102a2b] p-7 text-white shadow-lift md:p-10">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">Cont raportsolar.ro</div>
              <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] md:text-5xl">Bine ai revenit.</h1>
              <p className="mt-3 text-sm text-white/58">{session?.user.email}</p>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                nav({ to: "/" });
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-semibold hover:bg-white/12"
            >
              <LogOut className="h-4 w-4" /> Ieși din cont
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link to="/cont/rapoarte" className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-green/25" aria-label="Deschide Analizele tale">
              <Card className="p-7 transition-all group-hover:-translate-y-1 group-hover:shadow-lift group-active:scale-[0.99]">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-green-soft text-brand-green">
                  <FileText className="h-6 w-6" />
                </div>
                <h2 className="mt-7 text-xl font-bold">Analizele tale</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Vezi ofertele încărcate și rezultatele asociate.</p><ArrowRight className="mt-5 h-5 w-5 text-brand-green transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Card>
            </Link>
            <Link to="/cont/setari" className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-green/25" aria-label="Deschide Cont și securitate">
              <Card className="p-7 transition-all group-hover:-translate-y-1 group-hover:shadow-lift group-active:scale-[0.99]">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-sun-soft text-[#a55f00]">
                  <Settings className="h-6 w-6" />
                </div>
                <h2 className="mt-7 text-xl font-bold">Cont și securitate</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Verifică autentificarea, sesiunea și opțiunile contului.</p><ArrowRight className="mt-5 h-5 w-5 text-[#a55f00] transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Card>
            </Link>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}
