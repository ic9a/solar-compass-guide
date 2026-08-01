import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useState } from "react";
import { Mail, LogIn, CheckCircle2 } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Card, PageHero, Section } from "@/components/primitives";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { claimAnonymousOwnership } from "@/lib/account.functions";
import { trackAnalytics } from "@/lib/analytics";

const ANONYMOUS_TOKEN_KEY = "raportsolar:anonymous-access-token";

function isSafeNext(next: string): next is string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//");
}

export const Route = createFileRoute("/autentificare")({
  head: () => ({
    meta: [
      { title: "Autentificare — raportsolar.ro" },
      {
        name: "description",
        content: "Autentifică-te pe raportsolar.ro pentru a salva rapoartele și analizele tale.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:url", content: "/autentificare" },
    ],
    links: [{ rel: "canonical", href: "/autentificare" }],
  }),
  validateSearch: (s: Record<string, unknown>): { next?: string } => {
    const next = typeof s.next === "string" && isSafeNext(s.next) ? s.next : undefined;
    return next ? { next } : {};
  },
  component: Page,
});

// Capture the currently-anonymous session BEFORE any auth transition so we can
// run the server-side ownership-transfer fallback if the upgrade produces a
// different auth.users.id.
async function snapshotAnonSession(): Promise<{ userId: string; token: string } | null> {
  const { data } = await supabase.auth.getSession();
  const u = data.session?.user;
  const t = data.session?.access_token;
  if (u && t && (u as { is_anonymous?: boolean }).is_anonymous) {
    return { userId: u.id, token: t };
  }
  return null;
}

function Page() {
  const nav = useNavigate();
  const { next } = Route.useSearch();
  const claim = useServerFn(claimAnonymousOwnership);
  const reconciliationStarted = React.useRef(false);
  const [email, setEmail] = useState("");
  React.useEffect(() => {
    trackAnalytics("authentication_started", { session: "anonymous" });
  }, []);

  const [state, setState] = useState<
    { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  React.useEffect(() => {
    if (reconciliationStarted.current) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session || data.session.user?.is_anonymous) return;
      trackAnalytics("authentication_completed", {
        session: "authenticated",
        outcome: "success",
      });

      reconciliationStarted.current = true;
      const anonymousAccessToken = window.sessionStorage.getItem(ANONYMOUS_TOKEN_KEY);
      if (anonymousAccessToken) {
        try {
          await claim({ data: { anonymousAccessToken } });
        } catch (error) {
          console.warn("ownership reconciliation failed", error);
        } finally {
          window.sessionStorage.removeItem(ANONYMOUS_TOKEN_KEY);
        }
      }

      window.location.href = next ?? "/cont/rapoarte";
    })();
    return () => {
      cancelled = true;
    };
  }, [claim, next]);

  const redirectTarget =
    typeof window !== "undefined" ? `${window.location.origin}${next ?? "/cont"}` : undefined;

  const oauthReturnTarget =
    typeof window !== "undefined"
      ? `${window.location.origin}/autentificare?next=${encodeURIComponent(next ?? "/cont/rapoarte")}`
      : undefined;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "sending" });
    try {
      // Snapshot anon before any auth transition.
      const before = await snapshotAnonSession();

      if (before) {
        // Upgrade path: change email on the anon user; Supabase sends a
        // confirmation link that, when clicked, flips is_anonymous=false and
        // keeps the same auth.users.id.
        const { error } = await supabase.auth.updateUser(
          { email },
          { emailRedirectTo: redirectTarget },
        );
        if (error) throw error;
      } else {
        // No anon session — normal magic-link sign-in.
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: true, emailRedirectTo: redirectTarget },
        });
        if (error) throw error;
      }
      setState({ kind: "sent" });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Trimiterea a eșuat",
      });
    }
  }

  async function google() {
    const before = await snapshotAnonSession();
    try {
      // Preferred path: link Google to the existing anonymous user (same id).
      if (before) {
        // supabase-js exposes linkIdentity when supported by the project.
        const linker = (
          supabase.auth as unknown as {
            linkIdentity?: (opts: {
              provider: "google";
              options?: { redirectTo?: string };
            }) => Promise<{ error: unknown }>;
          }
        ).linkIdentity;
        if (typeof linker === "function") {
          try {
            const { error } = await linker.call(supabase.auth, {
              provider: "google",
              options: { redirectTo: redirectTarget },
            });
            if (!error) return; // browser redirected; on return, same user id.
          } catch {
            // Fall through to a normal Supabase OAuth sign-in.
          }
        }
      }

      if (before) {
        window.sessionStorage.setItem(ANONYMOUS_TOKEN_KEY, before.token);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: oauthReturnTarget,
          skipBrowserRedirect: false,
        },
      });
      if (error) {
        window.sessionStorage.removeItem(ANONYMOUS_TOKEN_KEY);
        setState({ kind: "error", message: error.message });
      }
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Autentificarea Google a eșuat",
      });
    }
  }

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Cont raportsolar.ro"
        title="Păstrează toate analizele într-un singur loc."
        description="Autentifică-te pentru a reveni la ofertele și rapoartele tale de pe orice dispozitiv. Poți folosi Google sau un link securizat trimis pe email."
      />
      <Section className="!py-10 md:!py-16">
        <div className="max-w-md mx-auto">
          <Card className="p-6 md:p-8">
            {state.kind === "sent" ? (
              <div className="text-center py-6">
                <div className="mx-auto h-12 w-12 rounded-full bg-gradient-brand grid place-items-center text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-bold">Verifică-ți emailul</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ți-am trimis un link de confirmare la <strong>{email}</strong>. Deschide-l pe
                  același dispozitiv pentru a păstra oferta încărcată.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="grid gap-4">
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5">Email</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field-control"
                  />
                </label>
                {state.kind === "error" && (
                  <div
                    role="alert"
                    className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                  >
                    {state.message}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={state.kind === "sending"}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
                >
                  {state.kind === "sending" ? "Se trimite..." : "Trimite linkul de autentificare"}
                  <Mail className="h-4 w-4" />
                </button>
                <div className="relative my-1 text-center text-xs uppercase tracking-wider text-muted-foreground">
                  <span className="bg-surface px-2">sau</span>
                  <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" />
                </div>
                <button
                  type="button"
                  onClick={google}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:bg-muted"
                >
                  <LogIn className="h-4 w-4" /> Continuă cu Google
                </button>
              </form>
            )}
          </Card>

          <p className="mt-4 text-xs text-muted-foreground text-center">
            Deja autentificat?{" "}
            <button className="underline" onClick={() => nav({ to: "/cont" })}>
              Mergi la contul tău
            </button>
          </p>
        </div>
      </Section>
    </SiteLayout>
  );
}
