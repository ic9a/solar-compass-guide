// Legacy route kept for old bookmarks. Payments are currently disabled.
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/raport-complet")({
  beforeLoad: ({ location }) => {
    // This file is also the parent of /raport-complet/$analysisId. Redirect
    // only the exact legacy URL so the child can preserve its analysis ID.
    if (location.pathname === "/raport-complet") {
      throw redirect({ to: "/cont/rapoarte", replace: true });
    }
  },
  component: Outlet,
});
