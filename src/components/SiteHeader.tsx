import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, ShieldCheck, X, User } from "lucide-react";
import { Logo } from "./Logo";
import { useAuthSession } from "@/hooks/useAuthSession";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/recomandare-sistem", label: "Recomandare" },
  { to: "/upload-oferta", label: "Analiză ofertă" },
  { to: "/harta-solara-romania", label: "Harta solară" },
  { to: "/ghid-panouri-fotovoltaice", label: "Ghiduri" },
  { to: "/exemplu-raport", label: "Exemplu raport" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, session } = useAuthSession();

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    let active = true;
    const userId = session?.user.id;

    if (!isAuthenticated || !userId) {
      setIsAdmin(false);
      return () => {
        active = false;
      };
    }

    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }).then(({ data, error }) => {
      if (active) setIsAdmin(!error && data === true);
    });

    return () => {
      active = false;
    };
  }, [isAuthenticated, session?.user.id]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const pageContent = Array.from(document.querySelectorAll<HTMLElement>("[data-site-content]"));
    const previousInert = pageContent.map((element) => element.inert);
    document.body.style.overflow = "hidden";
    pageContent.forEach((element) => {
      element.inert = true;
    });
    window.requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLElement>("a")?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !menuRef.current) return;

      const focusable = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      pageContent.forEach((element, index) => {
        element.inert = previousInert[index];
      });
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <header className="site-header sticky top-0 z-40 border-b border-border/55 bg-background/82 backdrop-blur-xl">
      <div className="mx-auto flex h-[var(--site-header-height)] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{
                className:
                  "rounded-full px-3.5 py-2 text-sm font-semibold text-foreground bg-muted",
              }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:flex items-center gap-2">
          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 text-sm font-semibold hover:bg-muted"
            >
              <ShieldCheck className="h-4 w-4" /> Admin
            </Link>
          )}
          <Link
            to={isAuthenticated ? "/cont" : "/autentificare"}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/80 px-3 py-2 text-sm font-semibold hover:bg-white"
          >
            <User className="h-4 w-4" /> {isAuthenticated ? "Contul meu" : "Autentificare"}
          </Link>
          <Link
            to="/upload-oferta"
            className="inline-flex items-center rounded-full bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
          >
            Analizează o ofertă
          </Link>
        </div>
        <button
          ref={menuButtonRef}
          className="lg:hidden inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl text-foreground hover:bg-muted"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Închide meniul" : "Deschide meniul"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {portalReady &&
        open &&
        createPortal(
          <div
            ref={menuRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-navigation-title"
            className="fixed inset-x-0 top-[var(--site-header-height)] z-[100] h-[calc(100dvh-var(--site-header-height))] overflow-y-auto overscroll-contain border-t border-border/60 bg-background lg:hidden"
          >
            <nav
              aria-label="Navigație mobilă"
              className="mx-auto flex min-h-full max-w-2xl flex-col gap-1 px-[max(1rem,env(safe-area-inset-left))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] pr-[max(1rem,env(safe-area-inset-right))] pt-4"
            >
              <h2 id="mobile-navigation-title" className="sr-only">
                Meniu principal
              </h2>
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center rounded-xl px-4 py-3 text-base font-medium text-foreground/80 hover:bg-muted"
                >
                  {n.label}
                </Link>
              ))}
              <Link
                to={isAuthenticated ? "/cont" : "/autentificare"}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center rounded-xl px-4 py-3 text-base font-semibold text-foreground/80 hover:bg-muted"
              >
                {isAuthenticated ? "Contul meu" : "Autentificare"}
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center rounded-xl px-4 py-3 text-base font-semibold text-foreground/80 hover:bg-muted"
                >
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Admin
                  </span>
                </Link>
              )}
              <Link
                to="/upload-oferta"
                onClick={() => setOpen(false)}
                className="mt-3 inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-white"
              >
                Analizează o ofertă
              </Link>
            </nav>
          </div>,
          document.body,
        )}
    </header>
  );
}
