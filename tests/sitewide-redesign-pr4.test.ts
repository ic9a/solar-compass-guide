import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("sitewide redesign phase 4", () => {
  it("keeps every admin surface inside the authenticated route tree", () => {
    const files = [
      "admin",
      "admin.audit",
      "admin.mesaje",
      "admin.oferte",
      "admin.piata",
      "admin.plati",
      "admin.setari",
      "admin.webhooks",
    ];
    for (const file of files)
      expect(read(`src/routes/_authenticated/${file}.tsx`)).toContain("/_authenticated/admin");
  });

  it("provides navigation for every administrative area", () => {
    const shell = read("src/routes/_authenticated/admin.tsx");
    for (const route of [
      "/admin/oferte",
      "/admin/piata",
      "/admin/mesaje",
      "/admin/plati",
      "/admin/webhooks",
      "/admin/setari",
      "/admin/audit",
    ])
      expect(shell).toContain(route);
  });

  it("uses reusable loading, empty and status states", () => {
    const primitives = read("src/components/admin/AdminPrimitives.tsx");
    expect(primitives).toContain("AdminLoading");
    expect(primitives).toContain("AdminEmpty");
    expect(primitives).toContain("AdminStatus");
  });

  it("keeps admin motion restrained and reduced-motion aware", () => {
    expect(read("src/styles.css")).toMatch(
      /prefers-reduced-motion: ?reduce[\s\S]*admin-content tbody tr/,
    );
  });
});
