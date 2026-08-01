import { createFileRoute, redirect } from "@tanstack/react-router";

// Payments are intentionally disabled. Preserve old bookmarks by sending the
// visitor to the analysis result that is currently available.
export const Route = createFileRoute("/raport-complet/$analysisId")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/rezultat-gratuit/$analysisId",
      params: { analysisId: params.analysisId },
      replace: true,
    });
  },
});
