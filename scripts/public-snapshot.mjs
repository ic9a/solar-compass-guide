import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { execFileSync } from "node:child_process";

const root = resolve(process.cwd());
const mode = process.argv[2] ?? "verify";
const destination = resolve(process.argv[3] ?? join(root, ".public-snapshot"));

const forbiddenPrefixes = [
  ".git/",
  ".wrangler/",
  ".output/",
  "dist/",
  "dist-ssr/",
  "test-results/",
  "playwright-report/",
  "blob-report/",
  "uploads/",
  "upload/",
  "docs/public-repository/private/",
  "validation/real-world-data/private/",
  ".public-snapshot/",
];

const forbiddenExact = new Set([".env", ".dev.vars"]);
const binaryExtensions = new Set([
  ".avif", ".gif", ".ico", ".jpeg", ".jpg", ".pdf", ".png", ".webp", ".woff", ".woff2",
]);

const sensitivePatterns = [
  ["supabase-secret-key", /\bsb_secret_[A-Za-z0-9_-]+\b/g],
  ["stripe-secret-key", /\bsk_(?:live|test)_[A-Za-z0-9_-]+\b/g],
  ["stripe-webhook-secret", /\bwhsec_[A-Za-z0-9_-]+\b/g],
  ["google-api-key", /\bAIza[0-9A-Za-z_-]{30,}\b/g],
  ["github-token", /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/g],
  ["cloudflare-token", /\b(?:CLOUDFLARE_API_TOKEN|CF_API_TOKEN)\s*=\s*[^\s#]+/gi],
  ["database-url", /\b(?:postgres|postgresql):\/\/[^\s"'<>]+/gi],
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["bearer-token", /\bBearer\s+[A-Za-z0-9._~+\/-]{20,}={0,2}\b/gi],
  ["password-assignment", /\b(?:PASSWORD|DB_PASSWORD)\s*=\s*[^\s#]+/gi],
];

function normalizePath(path) {
  return path.split(sep).join("/").replace(/^\.\//, "");
}

function isForbiddenPath(path) {
  const normalized = normalizePath(path);
  if (forbiddenExact.has(normalized)) return true;
  if (normalized.startsWith(".env.") && normalized !== ".env.example") return true;
  if (normalized.startsWith(".dev.vars.")) return true;
  return forbiddenPrefixes.some((prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix));
}

function trackedFiles(base) {
  if (existsSync(join(base, ".git"))) {
    return execFileSync("git", ["-C", base, "ls-files", "-z"], { encoding: "utf8" })
      .split("\0")
      .filter(Boolean)
      .map(normalizePath);
  }
  const files = [];
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name);
      const path = normalizePath(relative(base, absolute));
      if (entry.isDirectory() && (path === "node_modules" || path.startsWith("node_modules/"))) continue;
      if (entry.isDirectory()) walk(absolute);
      else files.push(path);
    }
  };
  walk(base);
  return files.sort();
}

function report(category, path) {
  process.stderr.write(`public verification failed [${category}] ${normalizePath(path)}\n`);
}

function verify(base) {
  const failures = [];
  const files = trackedFiles(base);

  for (const path of files) {
    if (isForbiddenPath(path)) {
      failures.push(["forbidden-path", path]);
      continue;
    }

    const absolute = join(base, path);
    if (lstatSync(absolute).isSymbolicLink()) {
      failures.push(["symbolic-link", path]);
      continue;
    }
    if (binaryExtensions.has(extname(path).toLowerCase())) continue;
    if (lstatSync(absolute).size > 2_000_000) continue;

    const content = readFileSync(absolute, "utf8");
    const emailPattern = /([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})/gi;
    const publicDomains = new Set(["raportsolar.ro", "example.com", "example.org", "example.net"]);
    const genericMailbox = /^(?:test|admin|support|hello|noreply|no-reply|onboarding|contact|user|owner|security|privacy|team|from|to)(?:[+._-].*)?$/i;
    for (const match of content.matchAll(emailPattern)) {
      const [, mailbox, domain] = match;
      if (!publicDomains.has(domain.toLowerCase()) && !genericMailbox.test(mailbox)) {
        failures.push(["personal-email-identifier", path]);
        break;
      }
    }
    for (const [category, pattern] of sensitivePatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) failures.push([category, path]);
    }
  }

  const envExample = join(base, ".env.example");
  if (!existsSync(envExample)) failures.push(["missing-env-example", ".env.example"]);
  else {
    for (const line of readFileSync(envExample, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, name, value] = match;
      if (value && name !== "AI_MODEL") failures.push(["nonempty-env-example", ".env.example"]);
    }
  }

  const unique = new Map(failures.map(([category, path]) => [`${category}:${path}`, [category, path]]));
  for (const [category, path] of unique.values()) report(category, path);
  if (unique.size) process.exitCode = 1;
  else process.stdout.write(`public verification passed (${files.length} files)\n`);
  return unique.size === 0;
}

function exportSnapshot() {
  if (destination === root || !destination.startsWith(`${root}${sep}`)) {
    throw new Error("Export destination must be a dedicated directory inside the repository workspace.");
  }
  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });

  const files = trackedFiles(root);
  for (const path of files) {
    if (isForbiddenPath(path)) continue;
    const source = join(root, path);
    if (lstatSync(source).isSymbolicLink()) {
      report("symbolic-link", path);
      process.exit(1);
    }
    const target = join(destination, path);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
  }

  const sourceCommit = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const manifest = {
    schemaVersion: 1,
    sourceCommit,
    generatedAtUtc: new Date().toISOString(),
    command: "npm run public:export -- .public-snapshot",
    fileCount: files.filter((path) => !isForbiddenPath(path)).length + 1,
    validation: {
      secrets: "passed-redacted",
      personalIdentifiers: "passed-redacted",
      forbiddenPaths: "passed",
      symlinks: "passed",
    },
    gitHistoryCopied: false,
    statement: "Created from tracked public-safe files only; private Git history, branches, pull requests, issues, logs, user data, and environment files were not copied.",
  };
  writeFileSync(join(destination, "PUBLICATION-MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  if (!verify(destination)) process.exit(1);
  process.stdout.write(`clean public snapshot exported to ${normalizePath(relative(root, destination))}\n`);
}

if (mode === "verify") {
  verify(root);
} else if (mode === "export") {
  exportSnapshot();
} else {
  process.stderr.write("Usage: node scripts/public-snapshot.mjs <verify|export> [destination]\n");
  process.exitCode = 2;
}
