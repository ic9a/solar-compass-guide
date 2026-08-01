import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("sitewide redesign PR2 core tools", () => {
  it("keeps the recommendation as six explicit steps with a pre-calculation review", () => {
    const source = read("src/routes/recomandare-sistem.tsx");
    expect(source).toContain('{ id: 6, label: "Rezultat" }');
    expect(source).toContain("Verificare înainte de calcul");
    expect(source).toContain("WizardStepStory");
  });

  it("covers upload, manual entry, solar map and example report states", () => {
    expect(read("src/routes/upload-oferta.tsx")).toContain("OfferDocumentVisual");
    expect(read("src/routes/upload-oferta.tsx")).toContain('role="progressbar"');
    expect(read("src/routes/introducere-manuala.tsx")).toContain("Revizuire înainte de trimitere");
    expect(read("src/routes/harta-solara-romania.tsx")).toContain("aria-busy={loading}");
    expect(read("src/routes/exemplu-raport.tsx")).toContain(
      "Datele, furnizorul și concluziile sunt fictive",
    );
  });

  it("does not introduce a new recommendation engine or analysis path", () => {
    expect(read("src/routes/recomandare-sistem.tsx")).toContain("recommendSystemV2");
    expect(read("src/routes/upload-oferta.tsx")).toContain("initOfferUpload");
    expect(read("src/routes/introducere-manuala.tsx")).toContain("submitManualOffer");
    expect(read("src/routes/harta-solara-romania.tsx")).toContain("fetchPvgis");
  });
});
