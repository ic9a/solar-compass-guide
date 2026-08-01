// Lightweight auth state hook — tracks the current session and whether the
// user is a permanent (non-anonymous) account.

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthState {
  session: Session | null;
  isAnonymous: boolean;
  isAuthenticated: boolean;
  loading: boolean;
}

export function useAuthSession(): AuthState {
  const [state, setState] = useState<AuthState>({
    session: null,
    isAnonymous: true,
    isAuthenticated: false,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const s = data.session;
      setState({
        session: s,
        // Supabase marks anon users via user.is_anonymous
        isAnonymous: !s || Boolean(s.user?.is_anonymous),
        isAuthenticated: Boolean(s && !s.user?.is_anonymous),
        loading: false,
      });
    });

    const sub = supabase.auth.onAuthStateChange((event, s) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setState({
        session: s ?? null,
        isAnonymous: !s || Boolean(s.user?.is_anonymous),
        isAuthenticated: Boolean(s && !s.user?.is_anonymous),
        loading: false,
      });
    });

    return () => {
      mounted = false;
      sub.data.subscription.unsubscribe();
    };
  }, []);

  return state;
}
