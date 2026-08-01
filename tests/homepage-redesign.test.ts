import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AnalyticsPayloadSchema } from "../src/lib/analytics";
import { editorialPages } from "../src/lib/seo-content";

const read = (path: string) => readFileSync(path, "utf8");

describe("homepage redesign baseline", () => {
  it("keeps the two primary decisions and supporting product paths explicit", () => {
    const source = read("src/routes/index.tsx");
    expect(source).toContain("Află ce sistem fotovoltaic ți se potrivește");
    expect(source).toContain('to="/recomandare-sistem"');
    expect(source).toContain("Calculează sistemul potrivit");
    expect(source).toContain('to="/upload-oferta"');
    expect(source).toContain("Verifică oferta primită");
    expect(source).toContain('to="/harta-solara-romania"');
    expect(source).toContain('to="/exemplu-raport"');
    expect(source).toContain("RaportSolar nu vinde panouri");
  });

  it("renders homepage guide groups from the central editorial registry", () => {
    expect(editorialPages).toHaveLength(18);
    const homepage = read("src/routes/index.tsx");
    expect(homepage).toContain("const pages = editorialPages");
    expect(homepage).toContain(".filter((page)");
    expect(read("src/routes/index.tsx")).not.toContain("const articles =");
  });

  it("uses the approved brand assets and favicon metadata", () => {
    expect(read("src/components/Logo.tsx")).toContain("/brand/raportsolar-wordmark.png");
    expect(read("src/routes/__root.tsx")).toContain("/brand/favicon-32.png");
    expect(read("src/routes/__root.tsx")).toContain("/brand/apple-touch-icon.png");
    expect(read("src/routes/__root.tsx")).toContain("/manifest.webmanifest");
    expect(read("public/manifest.webmanifest")).toContain("/brand/icon-512.png");
  });

  it("removes every rejected phrase from the homepage", () => {
    const source = read("src/routes/index.tsx");
    for (const phrase of [
      "Interval, nu promisiune",
      "Două puncte de plecare",
      "Datele tale devin o decizie",
      "Context local bazat pe PVGIS",
      "Separat de vânzarea sistemului",
      "sensibilitate la ipoteze",
      "Ipoteze vizibile",
    ])
      expect(source).not.toContain(phrase);
  });

  it("keeps guides visible in desktop, mobile and footer navigation", () => {
    const header = read("src/components/SiteHeader.tsx");
    const footer = read("src/components/SiteFooter.tsx");
    expect(header).toContain('label: "Ghiduri"');
    expect(header).toContain("NAV.map");
    expect(footer).toContain("Ghiduri");
  });

  it("keeps homepage analytics strictly enumerated and privacy safe", () => {
    const base = {
      route: "/",
      viewport: "desktop" as const,
      session: "unknown" as const,
    };
    expect(
      AnalyticsPayloadSchema.safeParse({
        ...base,
        event: "homepage_primary_cta_clicked",
        destinationTool: "recommendation",
      }).success,
    ).toBe(true);
    expect(
      AnalyticsPayloadSchema.safeParse({
        ...base,
        event: "homepage_tool_opened",
        destinationTool: "solar_map",
        locality: "București",
      }).success,
    ).toBe(false);
    expect(
      AnalyticsPayloadSchema.safeParse({
        ...base,
        event: "homepage_secondary_cta_clicked",
        email: "test@example.com",
      }).success,
    ).toBe(false);
  });

  it("preserves required global navigation and legal destinations", () => {
    const header = read("src/components/SiteHeader.tsx");
    const footer = read("src/components/SiteFooter.tsx");
    for (const route of [
      "/recomandare-sistem",
      "/upload-oferta",
      "/harta-solara-romania",
      "/ghid-panouri-fotovoltaice",
      "/exemplu-raport",
    ]) {
      expect(header).toContain(route);
      expect(footer).toContain(route);
    }
    expect(footer).toContain("/legal/confidentialitate");
    expect(footer).toContain("/legal/termeni");
    expect(footer).toContain("/legal/cookies");
    expect(footer).toContain('to="/cont"');
  });
});
