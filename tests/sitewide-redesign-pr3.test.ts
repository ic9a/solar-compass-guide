import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("sitewide redesign phase 3", () => {
  it("keeps protected report and payment behavior intact", () => {
    const full = read("src/routes/raport-complet.$analysisId.tsx");
    expect(full).toContain('to: "/rezultat-gratuit/$analysisId"');
    expect(full).toContain("replace: true");
    expect(read("src/routes/raport-complet.tsx")).toContain('to: "/cont/rapoarte"');
  });

  it("keeps analysis and account routes private", () => {
    for (const path of [
      "src/routes/analiza.$offerId.tsx",
      "src/routes/corectare.$offerId.tsx",
      "src/routes/rezultat-gratuit.$analysisId.tsx",
      "src/routes/autentificare.tsx",
      "src/routes/cont.tsx",
      "src/routes/cont.rapoarte.tsx",
      "src/routes/cont.setari.tsx",
    ])
      expect(read(path)).toMatch(/noindex/);
  });

  it("provides a coherent analysis journey and account shell", () => {
    expect(read("src/components/report/AnalysisJourney.tsx")).toContain("Etapele analizei");
    expect(read("src/components/account/AccountShell.tsx")).toContain('aria-label="Navigare cont"');
    expect(read("src/routes/autentificare.tsx")).toContain(
      "Dacă ai început fără cont, păstrăm analiza curentă.",
    );
  });

  it("supports reduced motion for new document scenes", () => {
    const css = read("src/styles.css");
    expect(css).toMatch(/\.analysis-document svg\s*\{\s*animation:\s*none/);
    expect(css).toMatch(/\.auth-document\s*\{\s*transform:\s*none/);
  });
});
