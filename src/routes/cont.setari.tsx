import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Section, Card } from "@/components/primitives";
import { useAuthSessionContext } from "@/lib/auth/AuthSessionProvider";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import {
  getAccountSummary,
  requestAccountDeletion,
  cancelAccountDeletion,
} from "@/lib/account.functions";
import { LogOut, Trash2, CheckCircle2, Loader2, ShieldAlert, Mail } from "lucide-react";

export const Route = createFileRoute("/cont/setari")({
  head: () => ({
    meta: [
      { title: "Setări cont — raportsolar.ro" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Page,
});

type Summary = Awaited<ReturnType<typeof getAccountSummary>>;

function Page() {
  const auth = useAuthSessionContext();
  const load = useServerFn(getAccountSummary);
  const askDelete = useServerFn(requestAccountDeletion);
  const cancelDelete = useServerFn(cancelAccountDeletion);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!auth.ready) return;
    load()
      .then(setSummary)
      .catch((e) => setErr(e instanceof Error ? e.message : "Nu am putut încărca datele contului."));
  }, [auth.ready, load]);

  if (auth.loading || !auth.ready) {
    return (
      <SiteLayout>
        <Section className="!py-20">
          <div className="max-w-md mx-auto text-center inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Se pregătește sesiunea...
          </div>
        </Section>
      </SiteLayout>
    );
  }

  if (auth.isAnonymous) {
    return (
      <SiteLayout>
        <Section className="!py-10 md:!py-16">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold">Autentifică-te pentru setări</h1>
            <p className="mt-3 text-sm text-muted-foreground">Setările contului sunt disponibile după conectare.</p>
            <Link
              to="/autentificare"
              search={{ next: "/cont/setari" }}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow"
            >
              Autentifică-te
            </Link>
          </div>
        </Section>
      </SiteLayout>
    );
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function handleRequestDelete() {
    setBusy(true);
    setErr(null);
    try {
      await askDelete({ data: { reason: reason.trim() || null } });
      const s = await load();
      setSummary(s);
      setConfirming(false);
      setReason("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Nu am putut trimite cererea.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelDelete() {
    setBusy(true);
    setErr(null);
    try {
      await cancelDelete();
      const s = await load();
      setSummary(s);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Nu am putut anula cererea.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteLayout>
      <Section className="!py-10 md:!py-16">
        <div className="max-w-2xl mx-auto">
          <div className="product-kicker">Cont și securitate</div>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em] md:text-6xl">Setările contului</h1>
          <p className="mt-3 leading-7 text-muted-foreground">
            Gestionează metodele de autentificare, sesiunea activă și datele asociate contului.
          </p>

          {err && (
            <div role="alert" className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {err}
            </div>
          )}

          <Card className="mt-8 p-6">
            <h2 className="font-semibold">Date de contact</h2>
            <div className="mt-3 space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">Email: </span>
                <strong>{summary?.email ?? "—"}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Tip cont: </span>
                <strong>{summary?.isAnonymous ? "vizitator anonim" : "permanent"}</strong>
              </div>
            </div>
          </Card>

          <Card className="mt-4 p-6">
            <h2 className="font-semibold">Metode de autentificare</h2>
            {!summary ? (
              <div className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Se încarcă...
              </div>
            ) : summary.identities.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nu ai încă o metodă de autentificare configurată.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {summary.identities.map((i) => (
                  <li key={i.provider + (i.email ?? "")} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[color:var(--brand-green)]" />
                    <span className="capitalize font-semibold">{i.provider}</span>
                    {i.email && <span className="text-muted-foreground">— {i.email}</span>}
                  </li>
                ))}
              </ul>
            )}
            {summary && !summary.identities.some((i) => i.provider === "google") && (
              <Link
                to="/autentificare"
                search={{ next: "/cont/setari" }}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-muted"
              >
                <Mail className="h-4 w-4" /> Conectează Google
              </Link>
            )}
          </Card>

          <Card className="mt-4 p-6">
            <h2 className="font-semibold">Sesiune</h2>
            <button
              onClick={handleLogout}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              <LogOut className="h-4 w-4" /> Deconectează-mă
            </button>
          </Card>

          <Card className="mt-4 border-destructive/30 p-6">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <h2 className="font-semibold">Ștergere cont</h2>

                {summary?.deletionRequestedAt ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm">
                      Cerere de ștergere înregistrată la{" "}
                      <strong>{new Date(summary.deletionRequestedAt).toLocaleDateString("ro-RO")}</strong>.
                      Datele tale vor fi șterse în cel mai scurt timp posibil.
                    </p>
                    <button
                      onClick={handleCancelDelete}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Anulează cererea
                    </button>
                  </div>
                ) : confirming ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Confirmă ștergerea. Vei primi o notificare când datele sunt eliminate.
                    </p>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Motiv (opțional)"
                      className="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleRequestDelete}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-50"
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Confirmă ștergerea
                      </button>
                      <button
                        onClick={() => setConfirming(false)}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:bg-muted"
                      >
                        Anulează
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Poți solicita oricând ștergerea contului și a datelor asociate.
                    </p>
                    <button
                      onClick={() => setConfirming(true)}
                      className="mt-3 inline-flex items-center gap-2 rounded-full border border-destructive/50 bg-destructive/5 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" /> Solicită ștergerea
                    </button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      </Section>
    </SiteLayout>
  );
}
