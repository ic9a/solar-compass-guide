import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");
const tracked = () =>
  execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter(Boolean);

const workflows = [
  ".github/workflows/ci.yml",
  ".github/workflows/phase-1-quality.yml",
  ".github/workflows/real-world-calibration-validation.yml",
];

describe("public repository readiness", () => {
  it("contains no tracked personal email address", () => {
    const email = /([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})/gi;
    const publicDomains = new Set(["raportsolar.ro", "example.com", "example.org", "example.net"]);
    const genericMailbox = /^(?:test|admin|support|hello|noreply|no-reply|onboarding|contact|user|owner|security|privacy|team|from|to)(?:[+._-].*)?$/i;
    const matches = tracked().filter((path) => {
      try {
        return [...read(path).matchAll(email)].some(
          (match) => !publicDomains.has(match[2].toLowerCase()) && !genericMailbox.test(match[1]),
        );
      } catch {
        return false;
      }
    });
    expect(matches).toEqual([]);
  });

  it("removes identity-based admin bootstrap from historical and corrective SQL", () => {
    const historical = read("supabase/migrations/20260725153000_set_admin_bootstrap_email.sql");
    const corrective = read("supabase/migrations/20260801020000_remove_email_admin_bootstrap.sql");

    for (const sql of [historical, corrective]) {
      expect(sql).toContain("VALUES (NEW.id, 'user'::public.app_role)");
      expect(sql).toContain("SECURITY DEFINER");
      expect(sql).toContain("SET search_path = ''");
      expect(sql).toContain("REVOKE EXECUTE ON FUNCTION public.handle_new_user()");
      expect(sql).not.toMatch(/IF[\s\S]*NEW\.email/i);
      expect(sql).not.toContain("'admin'::public.app_role");
    }

    expect(corrective).not.toMatch(/(?:DELETE|UPDATE)\s+(?:FROM\s+)?public\.user_roles/i);
    expect(corrective).toContain("Existing role assignments are intentionally preserved");
  });

  it("locks the source-available licence and package publication boundary", () => {
    const licence = read("LICENSE");
    const readme = read("README.md");
    const contribution = read("CONTRIBUTING.md");
    const pkg = JSON.parse(read("package.json")) as { private?: boolean; license?: string };

    expect(licence).toContain("Copyright © 2026 RaportSolar. All rights reserved.");
    expect(licence).toContain("SOURCE-AVAILABLE NOTICE");
    expect(licence).toMatch(/does not grant any\s+additional licence or reuse rights/);
    expect(readme).toMatch(/source available|source-available/i);
    expect(readme).not.toMatch(/\bopen[ -]source project\b/i);
    expect(contribution).toContain("may be incorporated and distributed under RaportSolar's source-available terms");
    expect(pkg.private).toBe(true);
    expect(pkg.license).toBe("UNLICENSED");
  });

  it("keeps the environment example non-sensitive", () => {
    for (const line of read(".env.example").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, name, value] = match;
      if (name === "AI_MODEL") expect(value).toMatch(/^gemini-[a-z0-9.-]+$/);
      else expect(value).toBe("");
    }
  });

  it("hardens workflows without reducing required gates", () => {
    const joined = workflows.map(read).join("\n");
    expect(joined).not.toContain("pull_request_target");
    expect(joined).not.toMatch(/permissions:\s*write-all/);
    for (const path of workflows) {
      const workflow = read(path);
      expect(workflow).toContain("permissions:\n  contents: read");
      expect(workflow).toContain("concurrency:");
      for (const line of workflow.split(/\r?\n/).filter((item) => item.trim().startsWith("uses:"))) {
        expect(line).toMatch(/@[0-9a-f]{40}(?:\s+#\s+v[^\s]+)?$/);
      }
    }

    const ci = read(workflows[0]);
    expect(ci).toContain("npm run typecheck");
    expect(ci).toContain("npm run lint:phase1");
    expect(ci).toContain("npm run lint:phase2");
    expect(ci).toContain("npm run lint:final");
    expect(ci).toContain("npm test");
    expect(ci).toContain("npm run build");
    expect(ci).toContain("npm run public:verify");
    expect(ci).toContain("gitleaks/gitleaks-action@");
    expect(ci).not.toMatch(/CLOUDFLARE_API_TOKEN|SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|GOOGLE_GENERATIVE_AI_API_KEY/);

    const quality = read(workflows[1]);
    for (const gate of [
      "Energy model validation",
      "Chromium mobile",
      "Chromium desktop",
      "Firefox",
      "WebKit",
      "Browser gate",
      "Clean public snapshot",
    ]) {
      expect(quality).toContain(gate);
    }
    for (const viewport of ["mobile-320", "mobile-360", "mobile-375", "mobile-390", "mobile-412", "landscape", "tablet", "desktop-1024", "desktop-1280", "desktop-1440"]) {
      expect(quality).toContain(viewport);
    }
    expect(quality).toContain("persist-credentials: false");
    expect(quality).not.toContain("wrangler deploy");
  });

  it("disables public Worker preview URLs and declares server-only bindings", () => {
    const config = read("wrangler.jsonc");
    expect(config).toContain('"preview_urls": false');
    for (const name of [
      "SUPABASE_SERVICE_ROLE_KEY",
      "GOOGLE_GENERATIVE_AI_API_KEY",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
    ]) {
      expect(config).toContain(`"${name}"`);
    }
  });

  it("maps every committed public fixture to redistributable source metadata", () => {
    const registry = JSON.parse(read("validation/real-world-data/sources.json")) as {
      sources: Array<{ licence: string; status: string; output: string | null }>;
    };
    const fixtureNames = readdirSync("validation/real-world-data/fixtures").sort();
    const accepted = registry.sources.filter((source) => source.status.startsWith("accepted-") && source.output);
    const mapped = accepted
      .map((source) => source.output?.replace(/^fixtures\//, ""))
      .filter((value): value is string => Boolean(value))
      .sort();

    expect(mapped).toEqual(fixtureNames);
    for (const source of accepted) {
      expect(source.licence).toMatch(/^(?:CC-BY-4\.0|CC0-1\.0|ODC-BY-1\.0)$/);
    }
    expect(read(".publicignore")).toContain("validation/real-world-data/private/");
  });

  it("redacts secret scanner output", () => {
    const directory = mkdtempSync(join(tmpdir(), "public-readiness-"));
    try {
      writeFileSync(join(directory, ".env.example"), "");
      const fake = ["sk", "test", "never-print-this-value"].join("_");
      writeFileSync(join(directory, "fixture.txt"), fake);
      const result = spawnSync(
        process.execPath,
        [join(process.cwd(), "scripts/public-snapshot.mjs"), "verify"],
        { cwd: directory, encoding: "utf8" },
      );
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("[stripe-secret-key] fixture.txt");
      expect(result.stderr).not.toContain(fake);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("keeps forbidden operational files out of exports", () => {
    const policy = read(".publicignore");
    for (const entry of [".env", ".dev.vars", ".wrangler/", ".output/", "test-results/", "playwright-report/", "uploads/"]) {
      expect(policy).toContain(entry);
    }
    const script = read("scripts/public-snapshot.mjs");
    expect(script).toContain('execFileSync("git", ["-C", base, "ls-files", "-z"]');
    expect(script).toContain('isForbiddenPath(path)');
    expect(script).toContain('copyFileSync(source, target)');
    expect(script).toContain('path === "node_modules"');
    expect(script).toContain('"PUBLICATION-MANIFEST.json"');
    expect(script).toContain("gitHistoryCopied: false");
    expect(script).toContain('execFileSync("git", ["-C", root, "rev-parse", "HEAD"]');
  });
});
