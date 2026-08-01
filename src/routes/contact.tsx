import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Card, PageHero, Section } from "@/components/primitives";
import { useServerFn } from "@tanstack/react-start";
import { submitContactMessage } from "@/lib/contact.functions";
import { ContactSchema } from "@/lib/schemas";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — raportsolar.ro" },
      { name: "description", content: "Contactează echipa raportsolar.ro pentru întrebări, feedback sau sugestii legate de analiza ofertelor fotovoltaice." },
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
    { kind: "idle" } | { kind: "submitting" } | { kind: "sent" } | { kind: "error"; message: string }
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
      <PageHero
        eyebrow="Contact"
        title="Spune-ne cum te putem ajuta."
        description="Pentru întrebări despre o analiză, sugestii sau probleme tehnice, trimite-ne un mesaj. Răspundem pe adresa de email indicată."
      />
      <Section className="!py-10 md:!py-16">
        <div className="max-w-2xl mx-auto">
          <p className="mb-6 text-sm text-muted-foreground">
            Ne poți scrie și direct la{" "}
            <a href="mailto:contact@raportsolar.ro" className="font-semibold" style={{ color: "var(--brand-green)" }}>
              contact@raportsolar.ro
            </a>.
          </p>

          <Card className="p-6 md:p-9">
            {state.kind === "sent" ? (
              <div className="text-center py-6">
                <div className="mx-auto h-12 w-12 rounded-full bg-gradient-brand grid place-items-center text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-bold">Mesajul a fost trimis</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  L-am salvat și îl vom vedea în scurt timp. Îți răspundem pe email.
                </p>
                <button
                  type="button"
                  onClick={() => setState({ kind: "idle" })}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline"
                >
                  Trimite alt mesaj
                </button>
              </div>
            ) : (
              <form className="grid gap-5" onSubmit={onSubmit}>
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5">Nume</span>
                  <input name="name" className={inputCls} required minLength={2} maxLength={120} />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5">Email</span>
                  <input name="email" type="email" className={inputCls} required maxLength={255} />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5">Subiect (opțional)</span>
                  <input name="subject" className={inputCls} maxLength={200} />
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5">Mesaj</span>
                  <textarea name="message" className={inputCls} rows={5} required minLength={10} maxLength={4000} />
                </label>
                {state.kind === "error" && (
                  <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {state.message}
                  </div>
                )}
                <div>
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
                    type="submit"
                    disabled={state.kind === "submitting"}
                  >
                    {state.kind === "submitting" ? "Se trimite..." : "Trimite mesaj"}
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Prin trimiterea formularului confirmi că datele tale (nume, email, mesaj) sunt salvate pentru a-ți putea răspunde.
                </p>
              </form>
            )}
          </Card>
        </div>
      </Section>
    </SiteLayout>
  );
}
