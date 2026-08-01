// Legacy demo route — redirect to the account reports list. Real free
// results live at /rezultat-gratuit/$analysisId keyed by a real analysis.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/rezultat-gratuit")({
  beforeLoad: ({ location }) => {
    if (
      location.pathname === "/rezultat-gratuit" ||
      location.pathname === "/rezultat-gratuit/"
    ) {
      throw redirect({ to: "/cont/rapoarte" });
    }
  },
});
