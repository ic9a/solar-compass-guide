import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import {
  BrandSurface,
  JourneyScene,
  MarketingPageHero,
  PageState,
  SectionIntro,
} from "@/components/brand-system";
import { useServerFn } from "@tanstack/react-start";
import { submitContactMessage } from "@/lib/contact.functions";
import { ContactSchema } from "@/lib/schemas";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — raportsolar.ro" },
      {
        name: "description",
        content:
          "Contactează echipa raportsolar.ro pentru întrebări, feedback sau sugestii legate de analiza ofertelor fotovoltaice.",
      },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Page,
});

const inputCls = "field-control";

function Page() {
  const submit = useServerFn(submitContactMessage);
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "submitting" }
    | { kind: "sent" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const parsed = ContactSchema.safeParse({
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      subject: String(fd.get("subject") ?? "") || undefined,
      message: String(fd.get("message") ?? ""),
    });
    if (!parsed.success) {
      setState({ kind: "error", message: parsed.error.issues[0]?.message ?? "Date invalide" });
      return;
    }
    setState({ kind: "submitting" });
    try {
      await submit({ data: parsed.data });
      setState({ kind: "sent" });
      form.reset();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Trimiterea a eșuat";
      setState({ kind: "error", message: msg });
    }
  }

  return (
    <SiteLayout>
      <MarketingPageHero
        eyebrow="Contact"
        title="Ai o întrebare despre RaportSolar? Scrie-ne."
        description="Te putem ajuta cu folosirea aplicației, o analiză care nu se încarcă sau o informație neclară de pe site. Pentru proiectare și verificarea instalației, discută cu un specialist care poate vedea locuința."
        visual={<JourneyScene kind="contact" />}
      />
      <main className="brand-section brand-section--paper">
        <div className="brand-shell grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <SectionIntro
              number="01"
              title="Trimite doar informațiile necesare"
              description="Nu include parole, date de card, documente de identitate sau alte date sensibile. Pentru o problemă tehnică, descrie pasul la care ai ajuns și mesajul afișat."
            />
            <BrandSurface tone="green" className="mt-7">
              <h2 className="text-xl font-bold">Poți folosi și emailul</h2>
              <p className="mt-3 text-sm leading-6 text-white/70">
                Scrie la{" "}
                <a
                  href="mailto:contact@raportsolar.ro"
                  className="font-bold text-[#ffd05a] underline underline-offset-4"
                >
                  contact@raportsolar.ro
                </a>
                . Răspunsul va veni la adresa de pe care ne contactezi.
              </p>
            </BrandSurface>
          </div>
          <BrandSurface tone="light">
            {state.kind === "sent" ? (
              <div>
                <PageState
                  kind="success"
                  title="Mesajul a fost trimis"
                  description="L-am primit. Îți vom răspunde la adresa de email introdusă."
                />
                <button
                  type="button"
                  onClick={() => setState({ kind: "idle" })}
                  className="brand-button brand-button--secondary mt-5"
                >
                  Trimite alt mesaj
                </button>
              </div>
            ) : (
              <form className="grid gap-5" onSubmit={onSubmit} noValidate>
                <div>
                  <p className="home-v2-eyebrow">Formular de contact</p>
                  <h2 className="mt-3 text-3xl font-bold tracking-[-.04em]">
                    Cu ce te putem ajuta?
                  </h2>
                </div>
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5">
                    Nume <span aria-hidden="true">*</span>
                  </span>
                  <input name="name" className={inputCls} required minLength={2} maxLength={120} />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5">
                    Email <span aria-hidden="true">*</span>
                  </span>
                  <input name="email" type="email" className={inputCls} required maxLength={255} />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5">Subiect (opțional)</span>
                  <input name="subject" className={inputCls} maxLength={200} />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5">
                    Mesaj <span aria-hidden="true">*</span>
                  </span>
                  <textarea
                    name="message"
                    className={inputCls}
                    rows={5}
                    required
                    minLength={10}
                    maxLength={4000}
                  />
                  <span className="mt-1.5 block text-xs text-muted-foreground">
                    Nu include date sensibile sau documente de client.
                  </span>
                </label>
                {state.kind === "error" && (
                  <div
                    role="alert"
                    className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                  >
                    {state.message}
                  </div>
                )}
                <div>
                  <button
                    className="brand-button brand-button--primary disabled:opacity-50"
                    type="submit"
                    disabled={state.kind === "submitting"}
                  >
                    {state.kind === "submitting" ? "Trimitem mesajul…" : "Trimite mesajul"}
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Prin trimiterea formularului confirmi că datele tale (nume, email, mesaj) sunt
                  salvate pentru a-ți putea răspunde.
                </p>
              </form>
            )}
          </BrandSurface>
        </div>
      </main>
    </SiteLayout>
  );
}
