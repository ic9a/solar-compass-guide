import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/legal/confidentialitate")({
  head: () => ({
    meta: [
      { title: "Politica de confidențialitate — raportsolar.ro" },
      {
        name: "description",
        content: "Cum colectăm, folosim și protejăm datele tale personale pe raportsolar.ro.",
      },
    ],
    links: [{ rel: "canonical", href: "/legal/confidentialitate" }],
  }),
  component: Page,
});

function Page() {
  return (
    <SiteLayout>
      <LegalPage
        eyebrow="Protecția datelor"
        title="Politica de confidențialitate"
        description="Ce date folosește raportsolar.ro, de ce sunt necesare și ce opțiuni ai asupra lor."
      >
        <p>
          Această politică descrie cum raportsolar.ro („noi") colectează, folosește și protejează
          datele tale personale în calitate de operator de date, conform Regulamentului (UE)
          2016/679 (GDPR).
        </p>
        <h2>1. Ce date colectăm</h2>
        <ul>
          <li>
            <strong>Cont:</strong> adresa de email folosită la autentificare.
          </li>
          <li>
            <strong>Documente de ofertă:</strong> fișierele PDF/imagine încărcate voluntar pentru
            analiză.
          </li>
          <li>
            <strong>Date de calcul:</strong> localizarea (județ/oraș), consum estimat, tip acoperiș,
            echipamente.
          </li>
          <li>
            <strong>Tehnice:</strong> hash IP pentru anti-abuz, timestamp-uri.
          </li>
        </ul>
        <h2>2. Scopurile prelucrării</h2>
        <ul>
          <li>Furnizarea analizei automate a ofertei (bază legală: executarea contractului).</li>
          <li>Prevenirea abuzurilor și a fraudei (interes legitim).</li>
          <li>Administrarea contului și răspunsul la solicitările transmise de utilizator.</li>
        </ul>
        <h2>3. Cât timp păstrăm datele</h2>
        <p>
          Ofertele și analizele rămân asociate contului până la ștergere. Documentele originale pot
          fi eliminate după perioada de retenție configurată pentru serviciu. Poți solicita
          ștergerea contului și a datelor asociate din setările contului.
        </p>
        <h2>4. Cui transmitem datele</h2>
        <ul>
          <li>Furnizori de găzduire cloud (Cloudflare și Supabase)</li>
          <li>
            Furnizor extracție AI (Google Gemini API) — doar conținutul ofertei, fără date de
            identificare inutile
          </li>
          <li>Resend (livrare email)</li>
        </ul>
        <p>Nu vindem datele către terți.</p>
        <h2>5. Drepturile tale</h2>
        <ul>
          <li>Acces, rectificare, ștergere, restricționare, portabilitate, opoziție.</li>
          <li>Retragerea consimțământului fără efecte retroactive.</li>
          <li>
            Depunerea unei plângeri la <a href="https://www.dataprotection.ro">ANSPDCP</a>.
          </li>
        </ul>
        <p>
          Poți solicita ștergerea contului din <em>Contul meu → Setări</em> sau scriindu-ne la{" "}
          <a href="mailto:contact@raportsolar.ro">contact@raportsolar.ro</a>.
        </p>
        <h2>6. Cookies</h2>
        <p>
          Vezi <a href="/legal/cookies">Politica de cookies</a>.
        </p>
        <h2>7. Contact</h2>
        <p>
          Pentru orice întrebare privind datele tale:{" "}
          <a href="mailto:contact@raportsolar.ro">contact@raportsolar.ro</a>.
        </p>
        <p className="text-xs text-muted-foreground">
          Datele de identificare ale operatorului (denumire, CUI, adresă) se completează în Setări
          Admin și vor apărea aici.
        </p>
      </LegalPage>
    </SiteLayout>
  );
}
