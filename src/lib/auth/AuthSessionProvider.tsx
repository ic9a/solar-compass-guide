// Shared auth session provider. Guarantees every visitor has a Supabase session
// (anonymous by default) before dependent UI (upload, analysis, checkout) runs.
//
// Exposes: loading, ready, error, userId, isAnonymous, refresh().
// Components should read from useAuthSessionContext() and disable actions while
// loading || !ready.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthSessionState {
  loading: boolean;
  ready: boolean;
  error: string | null;
  userId: string | null;
  isAnonymous: boolean;
  session: Session | null;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthSessionState | null>(null);

function deriveState(session: Session | null) {
  const isAnon = !session ? true : Boolean(session.user?.is_anonymous);
  return {
    ready: Boolean(session?.access_token && session?.user?.id),
    userId: session?.user?.id ?? null,
    isAnonymous: isAnon,
    session,
  };
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bootingRef = useRef(false);

  const ensureSession = useCallback(async () => {
    if (bootingRef.current) return;
    bootingRef.current = true;
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token && data.session?.user?.id) {
        setSession(data.session);
        setLoading(false);
        return;
      }
      const res = await supabase.auth.signInAnonymously();
      if (res.error) {
        setError(
          "Nu am putut porni o sesiune anonimă. Reîncarcă pagina sau contactează-ne dacă persistă.",
        );
        setLoading(false);
        return;
      }
      setSession(res.data.session ?? null);
      setLoading(false);
    } catch {
      setError("Nu am putut iniția o sesiune. Verifică conexiunea și reîncearcă.");
      setLoading(false);
    } finally {
      bootingRef.current = false;
    }
  }, []);

  useEffect(() => {
    ensureSession();
    const sub = supabase.auth.onAuthStateChange((event, s) => {
      if (
        event !== "SIGNED_IN" &&
        event !== "SIGNED_OUT" &&
        event !== "USER_UPDATED" &&
        event !== "TOKEN_REFRESHED" &&
        event !== "INITIAL_SESSION"
      ) {
        return;
      }
      if (event === "SIGNED_OUT") {
        setSession(null);
        // After sign-out, immediately re-bootstrap an anonymous session so the
        // visitor can keep browsing / uploading.
        ensureSession();
        return;
      }
      if (s) setSession(s);
    });
    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, [ensureSession]);

  const value = useMemo<AuthSessionState>(() => {
    const d = deriveState(session);
    return {
      loading,
      ready: !loading && d.ready,
      error,
      userId: d.userId,
      isAnonymous: d.isAnonymous,
      session: d.session,
      refresh: ensureSession,
    };
  }, [session, loading, error, ensureSession]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuthSessionContext(): AuthSessionState {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("useAuthSessionContext must be used inside <AuthSessionProvider />");
  }
  return v;
}

// Awaitable form for imperative flows (e.g. before starting an upload).
// Returns a valid access token or throws.
export async function ensureAuthAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) return data.session.access_token;
  const res = await supabase.auth.signInAnonymously();
  if (res.error || !res.data.session?.access_token) {
    throw new Error("Nu am putut porni o sesiune anonimă. Reîncarcă pagina și încearcă din nou.");
  }
  return res.data.session.access_token;
}
