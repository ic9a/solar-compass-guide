// Landing "/analiza" — no specific offer, redirect to the account offers list.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/analiza")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/analiza" || location.pathname === "/analiza/") {
      throw redirect({ to: "/cont/rapoarte" });
    }
  },
});
