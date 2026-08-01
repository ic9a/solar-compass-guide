// Deterministic scoring engine.
// Input: normalized extraction JSON + verified market band (lei/kWp) + active rules.
// Output: per-category scores 0-100 + overall + strengths[] + risks[] + questions[].
// Pure TS, no side effects.

import { classifyInverter, classifyPanel } from "./tiers";

export type ExtractedOffer = {
  supplier_name?: string | null;
  system_kwp?: number | null;
  panel_brand?: string | null;
  panel_model?: string | null;
  panel_count?: number | null;
  panel_wattage?: number | null;
  inverter_brand?: string | null;
  inverter_model?: string | null;
  inverter_kva?: number | null;
  inverter_phases?: 1 | 3 | null;
  battery_present?: boolean | null;
  battery_kwh?: number | null;
  mounting_type?: string | null;
  total_price_lei?: number | null;
  vat_included?: boolean | null;
  price_breakdown?: Array<{ item: string; amount_lei?: number | null }> | null;
  warranties?: {
    panels_years?: number | null;
    inverter_years?: number | null;
    workmanship_years?: number | null;
  } | null;
  included_services?: string[] | null;
  excluded_items?: string[] | null;
  payment_terms?: string | null;
  permit_included?: boolean | null;
  commissioning_included?: boolean | null;
  monitoring_included?: boolean | null;
};

export type ScoringRules = {
  weights: {
    component: number;
    price_fairness: number;
    completeness: number;
    warranty: number;
    risk: number;
  };
  thresholds: {
    panel_tiers: Record<string, number>;
    inverter_tiers: Record<string, number>;
    warranty_years: {
      panels_min: number;
      inverter_min: number;
      workmanship_min: number;
    };
    risk_penalty: {
      missing_permit: number;
      missing_commissioning: number;
      missing_workmanship_warranty: number;
      vague_payment_terms: number;
      undisclosed_exclusions: number;
    };
    price_band_percentile: {
      cheap: number;
      fair_low: number;
      fair_high: number;
      expensive: number;
    };
  };
};

export type MarketBand = {
  sampleSize: number;
  p20: number;
  p50: number;
  p80: number;
} | null;

export type ScoringResult = {
  overall: number;
  category_scores: {
    component: number;
    price_fairness: number;
    completeness: number;
    warranty: number;
    risk: number;
  };
  strengths: string[];
  risks: string[];
  questions_to_ask: string[];
  free_preview: {
    total_score: number;
    top_strengths: string[];
    top_risks: string[];
  };
  price_position: {
    lei_per_kwp: number | null;
    band: MarketBand;
    label: "sub_median" | "in_line" | "peste_median" | "necunoscut";
  };
};

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

function scoreComponent(off: ExtractedOffer, rules: ScoringRules): number {
  const panelTier = classifyPanel(off.panel_brand);
  const invTier = classifyInverter(off.inverter_brand);
  const panelScore = rules.thresholds.panel_tiers[panelTier] ?? 40;
  const invScore = rules.thresholds.inverter_tiers[invTier] ?? 40;
  // Weight: panels 55%, inverter 40%, battery presence bonus 5% if declared kwh.
  const batteryBonus = off.battery_present && (off.battery_kwh ?? 0) > 0 ? 5 : 0;
  return clamp(panelScore * 0.55 + invScore * 0.4 + batteryBonus);
}

function scorePriceFairness(off: ExtractedOffer, band: MarketBand, rules: ScoringRules): {
  score: number;
  leiPerKwp: number | null;
  label: ScoringResult["price_position"]["label"];
} {
  const kwp = off.system_kwp ?? 0;
  const price = off.total_price_lei ?? 0;
  if (!kwp || !price) return { score: 50, leiPerKwp: null, label: "necunoscut" };
  const perKwp = price / kwp;
  if (!band || band.sampleSize < 3) {
    // No verified market band yet — neutral score, honest label.
    return { score: 50, leiPerKwp: perKwp, label: "necunoscut" };
  }
  // Percentile approximation from p20/p50/p80.
  let pct: number;
  if (perKwp <= band.p20) pct = 10;
  else if (perKwp <= band.p50) pct = 20 + ((perKwp - band.p20) / (band.p50 - band.p20)) * 30;
  else if (perKwp <= band.p80) pct = 50 + ((perKwp - band.p50) / (band.p80 - band.p50)) * 30;
  else pct = 85 + Math.min(15, ((perKwp - band.p80) / band.p80) * 100);

  // Lower percentile (cheaper) => higher score, but not linearly — "too cheap" also has risk.
  let score: number;
  if (pct < rules.thresholds.price_band_percentile.cheap) score = 78; // suspiciously cheap
  else if (pct < rules.thresholds.price_band_percentile.fair_low) score = 92;
  else if (pct < rules.thresholds.price_band_percentile.fair_high) score = 85;
  else if (pct < rules.thresholds.price_band_percentile.expensive) score = 60;
  else score = 35;

  const label: ScoringResult["price_position"]["label"] =
    perKwp < band.p50 ? "sub_median" : perKwp <= band.p80 ? "in_line" : "peste_median";

  return { score: clamp(score), leiPerKwp: perKwp, label };
}

function scoreCompleteness(off: ExtractedOffer): number {
  const checks = [
    off.permit_included === true,
    off.commissioning_included === true,
    off.monitoring_included === true,
    (off.included_services?.length ?? 0) >= 3,
    off.vat_included === true,
    (off.price_breakdown?.length ?? 0) >= 3,
  ];
  const hits = checks.filter(Boolean).length;
  return clamp((hits / checks.length) * 100);
}

function scoreWarranty(off: ExtractedOffer, rules: ScoringRules): number {
  const w = off.warranties ?? {};
  const p = w.panels_years ?? 0;
  const i = w.inverter_years ?? 0;
  const m = w.workmanship_years ?? 0;
  const pScore = clamp((p / rules.thresholds.warranty_years.panels_min) * 100);
  const iScore = clamp((i / rules.thresholds.warranty_years.inverter_min) * 100);
  const mScore = clamp((m / rules.thresholds.warranty_years.workmanship_min) * 100);
  return clamp(pScore * 0.4 + iScore * 0.4 + mScore * 0.2);
}

function scoreRisk(off: ExtractedOffer, rules: ScoringRules): { score: number; risks: string[] } {
  let penalty = 0;
  const risks: string[] = [];
  const p = rules.thresholds.risk_penalty;
  if (off.permit_included !== true) {
    penalty += p.missing_permit;
    risks.push("Dosar prosumator neinclus explicit.");
  }
  if (off.commissioning_included !== true) {
    penalty += p.missing_commissioning;
    risks.push("Punerea în funcțiune nu este menționată clar.");
  }
  if (!off.warranties?.workmanship_years || off.warranties.workmanship_years < 2) {
    penalty += p.missing_workmanship_warranty;
    risks.push("Garanția de manoperă lipsește sau este sub 2 ani.");
  }
  if (!off.payment_terms || off.payment_terms.length < 20) {
    penalty += p.vague_payment_terms;
    risks.push("Termenii de plată sunt vagi sau nemenționați.");
  }
  if ((off.excluded_items?.length ?? 0) === 0) {
    penalty += p.undisclosed_exclusions;
    risks.push("Nu sunt precizate elementele excluse din preț.");
  }
  return { score: clamp(100 - penalty), risks };
}

function buildStrengths(off: ExtractedOffer, prices: { label: ScoringResult["price_position"]["label"] }): string[] {
  const out: string[] = [];
  const p = classifyPanel(off.panel_brand);
  const i = classifyInverter(off.inverter_brand);
  if (p === "tier1") out.push(`Panouri de top (${off.panel_brand}).`);
  else if (p === "tier2") out.push(`Panouri mid-tier bine cunoscute (${off.panel_brand}).`);
  if (i === "tier1") out.push(`Invertor premium (${off.inverter_brand}).`);
  else if (i === "tier2") out.push(`Invertor solid (${off.inverter_brand}).`);
  if ((off.warranties?.panels_years ?? 0) >= 25) out.push("Garanție panouri 25 ani.");
  if ((off.warranties?.inverter_years ?? 0) >= 10) out.push("Garanție invertor 10+ ani.");
  if (off.permit_included) out.push("Dosarul de prosumator este inclus.");
  if (off.commissioning_included) out.push("Punerea în funcțiune este inclusă.");
  if (off.vat_included) out.push("TVA este inclus în preț.");
  if (prices.label === "sub_median") out.push("Preț sub mediana pieței pentru această putere.");
  if (prices.label === "in_line") out.push("Preț în linie cu piața pentru această putere.");
  return out;
}

function buildQuestions(off: ExtractedOffer): string[] {
  const q: string[] = [];
  if (off.permit_included !== true) q.push("Este inclus dosarul complet de prosumator (Anexa 2, ATR, aviz DEER, contract prosumator)?");
  if (off.commissioning_included !== true) q.push("Punerea în funcțiune și configurarea invertorului sunt incluse în preț?");
  if (!off.warranties?.workmanship_years) q.push("Câți ani este garanția de manoperă și ce acoperă concret?");
  if ((off.excluded_items?.length ?? 0) === 0) q.push("Ce lucrări sau materiale NU sunt incluse în preț (troliu, mansardă, întăriri, protecții AC/DC suplimentare)?");
  if (!off.payment_terms || off.payment_terms.length < 20) q.push("Care este graficul de plată exact (avans, la livrare, la PIF)?");
  if (off.battery_present && !off.battery_kwh) q.push("Care este capacitatea nominală și cea utilă a bateriei? Care este RTE și numărul minim de cicluri garantate?");
  if (!off.inverter_phases) q.push("Invertorul este monofazic sau trifazic? Se pretează la conexiunea existentă?");
  q.push("Ce randament pe an garantează pentru panouri (degradare max %) și cum se activează garanția?");
  q.push("Cine emite factura pentru energia injectată și cât durează procesul de racordare estimat?");
  return q.slice(0, 10);
}

export type ExtractionConfidence = {
  field_confidence?: Record<string, "high" | "medium" | "low" | null>;
  contradictions?: string[];
  overall?: "high" | "medium" | "low" | "insufficient";
};

const LOW_CONFIDENCE_MSG = "Valoare identificată cu încredere redusă în ofertă.";
const CONTRADICTION_MSG = "Oferta conține informații contradictorii.";

export function scoreOffer(
  extraction: ExtractedOffer,
  band: MarketBand,
  rules: ScoringRules,
  confidence: ExtractionConfidence = {},
): ScoringResult & { confidence: Required<ExtractionConfidence> } {
  const fc = confidence.field_confidence ?? {};
  const contradictions = confidence.contradictions ?? [];

  const component = scoreComponent(extraction, rules);
  const price = scorePriceFairness(extraction, band, rules);
  const completeness = scoreCompleteness(extraction);
  const warranty = scoreWarranty(extraction, rules);
  const risk = scoreRisk(extraction, rules);

  const w = rules.weights;
  let overall =
    component * w.component +
    price.score * w.price_fairness +
    completeness * w.completeness +
    warranty * w.warranty +
    risk.score * w.risk;

  const penalties = rules.thresholds.risk_penalty as unknown as Record<string, number>;
  const lowConfPenalty = penalties.low_confidence_field ?? 5;
  const contradictionPenalty = penalties.contradiction ?? 10;
  const lowFields = Object.entries(fc).filter(([, v]) => v === "low").map(([k]) => k);
  overall -= Math.min(20, lowFields.length * lowConfPenalty * 0.5);
  overall -= Math.min(25, contradictions.length * contradictionPenalty * 0.5);
  overall = clamp(overall);

  const extraRisks: string[] = [];
  for (const c of contradictions) extraRisks.push(`${CONTRADICTION_MSG} ${c}`);
  if (lowFields.length > 0)
    extraRisks.push(`${LOW_CONFIDENCE_MSG} Câmpuri afectate: ${lowFields.join(", ")}.`);

  const strengths = buildStrengths(extraction, { label: price.label });
  const questions = buildQuestions(extraction);
  const risks = [...extraRisks, ...risk.risks];

  const overallLabel: NonNullable<ExtractionConfidence["overall"]> =
    confidence.overall ??
    (contradictions.length >= 2 || lowFields.length >= 4
      ? "low"
      : contradictions.length >= 1 || lowFields.length >= 2
        ? "medium"
        : "high");

  return {
    overall: Math.round(overall),
    category_scores: {
      component: Math.round(component),
      price_fairness: Math.round(price.score),
      completeness: Math.round(completeness),
      warranty: Math.round(warranty),
      risk: Math.round(risk.score),
    },
    strengths,
    risks,
    questions_to_ask: questions,
    free_preview: {
      total_score: Math.round(overall),
      top_strengths: strengths.slice(0, 2),
      top_risks: risks.slice(0, 2),
    },
    price_position: {
      lei_per_kwp: price.leiPerKwp,
      band,
      label: price.label,
    },
    confidence: {
      field_confidence: fc,
      contradictions,
      overall: overallLabel,
    },
  };
}

// Deterministic contradiction detection over an extracted offer. Never invents; only
// flags conflicts that are unambiguously derivable from stated fields.
export function detectContradictions(off: ExtractedOffer): string[] {
  const out: string[] = [];
  const kwp = off.system_kwp ?? null;
  const pc = off.panel_count ?? null;
  const pw = off.panel_wattage ?? null;
  if (kwp && pc && pw) {
    const derived = (pc * pw) / 1000;
    if (Math.abs(derived - kwp) / kwp > 0.08) {
      out.push(
        `Puterea declarată (${kwp} kWp) diferă de nr. panouri × wattage (${derived.toFixed(2)} kWp).`,
      );
    }
  }
  if (kwp && off.inverter_kva) {
    const ratio = off.inverter_kva / kwp;
    if (ratio < 0.6 || ratio > 1.4) {
      out.push(
        `Puterea invertorului (${off.inverter_kva} kVA) nu se potrivește cu puterea sistemului (${kwp} kWp).`,
      );
    }
  }
  if (off.total_price_lei && off.vat_included === null) {
    out.push("Nu este clar dacă prețul total include sau nu TVA.");
  }
  if (off.battery_present && !off.battery_kwh) {
    out.push("Bateria este menționată, dar fără capacitate nominală în kWh.");
  }
  if (
    off.warranties?.inverter_years &&
    off.warranties?.panels_years &&
    off.warranties.inverter_years > off.warranties.panels_years
  ) {
    out.push("Garanția invertorului este mai mare decât cea a panourilor — verifică sursa afirmației.");
  }
  return out;
}

