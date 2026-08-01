import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Upload,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Card, PageHero, Section } from "@/components/primitives";
import { useServerFn } from "@tanstack/react-start";
import { initOfferUpload, finalizeOfferUpload } from "@/lib/offers.functions";
import { useAuthSessionContext, ensureAuthAccessToken } from "@/lib/auth/AuthSessionProvider";
import { trackAnalytics } from "@/lib/analytics";
import { OfferDocumentVisual } from "@/components/core-tool-visuals";

export const Route = createFileRoute("/upload-oferta")({
  head: () => ({
    meta: [
      { title: "Verifică o ofertă fotovoltaică — raportsolar.ro" },
      {
        name: "description",
        content:
          "Încarcă oferta primită sau introdu datele manual pentru o analiză gratuită orientativă.",
      },
      { property: "og:url", content: "/upload-oferta" },
    ],
    links: [{ rel: "canonical", href: "/upload-oferta" }],
  }),
  component: Page,
});

const ALLOWED_MIMES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);
const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg", "webp"]);

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

type Stage =
  | { kind: "idle" }
  | { kind: "picked"; file: File }
  | { kind: "uploading"; progress: number; file: File }
  | { kind: "uploaded"; offerId: string }
  | { kind: "error"; message: string; file?: File; retryable?: boolean };

function Page() {
  const nav = useNavigate();
  const init = useServerFn(initOfferUpload);
  const finalize = useServerFn(finalizeOfferUpload);
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const auth = useAuthSessionContext();

  const sessionBlocked = !auth.ready;
  const sessionError = auth.error;
  const analyticsSession = auth.ready && !auth.isAnonymous ? "authenticated" : "anonymous";

  useEffect(() => {
    trackAnalytics("upload_page_view", { session: analyticsSession });
  }, [analyticsSession]);

  useEffect(
    () => () => {
      xhrRef.current?.abort();
    },
    [],
  );

  function pickFile(file: File | null | undefined) {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLocaleLowerCase("ro-RO") ?? "";
    if (file.size === 0) {
      setStage({ kind: "error", message: "Fișierul este gol. Alege documentul original." });
      return;
    }
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      setStage({
        kind: "error",
        message: "Format neacceptat. Extensii acceptate: PDF, PNG, JPG, JPEG sau WEBP.",
      });
      return;
    }
    if (!ALLOWED_MIMES.has(file.type)) {
      setStage({ kind: "error", message: "Format acceptat: PDF, PNG, JPG sau WEBP." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setStage({ kind: "error", message: "Fișierul depășește 20 MB." });
      return;
    }
    setStage({ kind: "picked", file });
    trackAnalytics("upload_file_selected", { session: analyticsSession });
  }

  async function startUpload() {
    if (stage.kind !== "picked") return;
    const file = stage.file;
    setStage({ kind: "uploading", progress: 0, file });
    trackAnalytics("upload_started", { session: analyticsSession });
    try {
      // Guarantee a valid access token before hitting protected server fns.
      await ensureAuthAccessToken();

      const initRes = await init({
        data: {
          originalFilename: file.name,
          mimeType: file.type as
            "application/pdf" | "image/png" | "image/jpeg" | "image/jpg" | "image/webp",
          fileSizeBytes: file.size,
        },
      });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open("PUT", initRes.signedUrl, true);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.timeout = 120_000;
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setStage({ kind: "uploading", progress: pct, file });
          }
        };
        xhr.onload = () => {
          xhrRef.current = null;
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Încărcarea a eșuat (HTTP ${xhr.status})`));
        };
        xhr.onerror = () => {
          xhrRef.current = null;
          reject(new Error("Conexiunea s-a întrerupt în timpul încărcării."));
        };
        xhr.ontimeout = () => {
          xhrRef.current = null;
          reject(new Error("Încărcarea a durat prea mult și a fost oprită."));
        };
        xhr.onabort = () => {
          xhrRef.current = null;
          reject(new Error("Încărcarea a fost anulată."));
        };
        xhr.send(file);
      });

      await finalize({ data: { offerId: initRes.offerId } });
      setStage({ kind: "uploaded", offerId: initRes.offerId });
      trackAnalytics("upload_completed", { session: analyticsSession, outcome: "success" });
      nav({ to: "/analiza/$offerId", params: { offerId: initRes.offerId } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Încărcarea a eșuat";
      setStage({
        kind: "error",
        message: `${msg} Documentul selectat a fost păstrat.`,
        file,
        retryable: true,
      });
      trackAnalytics("upload_failed", {
        session: analyticsSession,
        outcome: "failure",
        failureCategory: /sesiun/i.test(msg)
          ? "session"
          : /format|fișier|document|corupt/i.test(msg)
            ? "validation"
            : /încărc|storage/i.test(msg)
              ? "storage"
              : "network",
      });
    }
  }

  return (
    <SiteLayout>
      <PageHero
        className="upload-page-hero core-tool-hero"
        eyebrow="Verificarea ofertei"
        title="Încarcă oferta fotovoltaică"
        description="Primești o analiză clară a prețului, echipamentelor, instalării și garanțiilor."
        aside={
          <div className="upload-hero-story">
            <OfferDocumentVisual />
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-green-soft text-brand-green">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">Document privat</div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Fișierul este păstrat într-un spațiu privat și poate fi accesat numai în sesiunea
                  sau contul tău.
                </p>
              </div>
            </div>
          </div>
        }
      />
      <Section className="!py-5 md:!py-12">
        <div className="max-w-5xl mx-auto">
          {sessionError && (
            <div
              role="alert"
              className="mt-6 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive inline-flex items-start gap-2"
            >
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Sesiune indisponibilă</div>
                <div>{sessionError}</div>
                <button onClick={() => auth.refresh()} className="mt-2 underline font-semibold">
                  Reîncearcă
                </button>
              </div>
            </div>
          )}

          {sessionBlocked && !sessionError && (
            <div className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Se pregătește sesiunea sigură...
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
            <Card className="p-4 sm:p-6 md:p-8">
              <div className="h-11 w-11 rounded-xl bg-gradient-brand grid place-items-center text-white">
                <Upload className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-bold tracking-[-0.035em] md:mt-5 md:text-2xl">
                Oferta ta
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                PDF sau fotografii clare ale tuturor paginilor.
              </p>

              <label
                className={`mt-5 block ${sessionBlocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0])}
                  disabled={stage.kind === "uploading" || sessionBlocked}
                />
                <div
                  className="rounded-[1.35rem] border-2 border-dashed border-brand-green/25 bg-[#f4f7f2] px-4 py-6 text-center text-sm transition-colors hover:border-brand-green/55 md:px-5 md:py-10"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (sessionBlocked) return;
                    pickFile(e.dataTransfer.files?.[0]);
                  }}
                >
                  {stage.kind === "picked" || stage.kind === "uploading" ? (
                    <span className="font-semibold">Alege alt document</span>
                  ) : stage.kind === "uploaded" ? (
                    <span className="font-semibold text-[color:var(--brand-green)]">Încărcat</span>
                  ) : (
                    <span className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-brand px-5 py-3 font-semibold text-white shadow-glow">
                      Selectează oferta
                    </span>
                  )}
                </div>
              </label>

              <p className="mt-2 text-center text-xs text-muted-foreground">
                PDF, PNG, JPG sau WEBP · maximum 20 MB
              </p>

              {(stage.kind === "picked" || stage.kind === "uploading") && (
                <div className="mt-4 flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-white p-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-green-soft text-brand-green">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{stage.file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {stage.file.type === "application/pdf" ? "PDF" : "Imagine"} ·{" "}
                      {formatBytes(stage.file.size)}
                    </div>
                  </div>
                  {stage.kind === "picked" && (
                    <button
                      type="button"
                      onClick={() => {
                        setStage({ kind: "idle" });
                        if (inputRef.current) inputRef.current.value = "";
                      }}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-muted"
                      aria-label="Elimină documentul selectat"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {stage.kind === "uploading" && (
                <div
                  className="mt-4 space-y-1"
                  role="progressbar"
                  aria-label="Progresul încărcării documentului"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={stage.progress}
                >
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-[color:var(--brand-green)] transition-all"
                      style={{ width: `${stage.progress}%` }}
                    />
                  </div>
                  <p
                    className="text-xs text-muted-foreground inline-flex items-center gap-1"
                    aria-live="polite"
                  >
                    <Loader2 className="h-3 w-3 animate-spin" /> Se încarcă {stage.progress}%
                  </p>
                </div>
              )}

              {stage.kind === "error" && (
                <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-3 text-sm text-destructive">
                  <div role="alert" className="inline-flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{stage.message}</span>
                  </div>
                  {stage.retryable && stage.file && (
                    <button
                      type="button"
                      className="mt-3 min-h-11 rounded-full border border-destructive/30 bg-white px-4 font-semibold"
                      onClick={() => setStage({ kind: "picked", file: stage.file! })}
                    >
                      Reîncearcă în siguranță
                    </button>
                  )}
                </div>
              )}

              {stage.kind === "uploaded" ? (
                <div className="mt-5 space-y-3" aria-live="polite">
                  <div className="rounded-lg border border-[color:var(--brand-green)]/40 bg-[color:var(--brand-green)]/5 px-3 py-2 text-sm inline-flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-[color:var(--brand-green)] shrink-0" />
                    <span>Documentul este în siguranță. Se pornește analiza automată...</span>
                  </div>
                </div>
              ) : (
                <button
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-brand px-5 py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                  disabled={stage.kind !== "picked" || sessionBlocked}
                  onClick={startUpload}
                  title={sessionBlocked ? "Se pregătește sesiunea..." : undefined}
                >
                  Analizează oferta <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </Card>

            <Card className="p-4 sm:p-6 md:p-8">
              <div className="h-11 w-11 rounded-xl bg-gradient-brand grid place-items-center text-white">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-bold tracking-[-0.035em] md:mt-5 md:text-2xl">
                Nu ai PDF-ul?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Introdu manual informațiile principale din ofertă și primești aceeași analiză
                orientativă.
              </p>
              <Link
                to="/introducere-manuala"
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold hover:bg-muted sm:w-auto"
              >
                Introdu datele manual <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}
