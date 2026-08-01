// Client-side effect that ensures every visitor has a Supabase session so
// their uploads / contact submissions / recommendation sessions can be
// persisted with `auth.uid()`. Uses anonymous sign-in for new visitors;
// signed-in users are unaffected.

import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function SessionBootstrap() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!data.session) {
          const res = await supabase.auth.signInAnonymously();
          if (res.error) return;
        }
      } catch {
        return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
