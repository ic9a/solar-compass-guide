// Recommendation service — data-based logic. No unknown/dont_know branches:
// callers pass valid guided choices. All results are labelled as
// orientative estimates in the UI.

export type BatteryPref =
  | "fara"               // Fără baterie
  | "consum-seara"       // Baterie pentru consum seara/noaptea
  | "backup"             // Baterie pentru backup
  | "compara";           // Vreau comparație cu și fără baterie

export type PeakTime = "zi" | "seara-noapte" | "constant";

export type Goal =
  | "factura" | "amortizare" | "independenta" | "backup" | "ev";

// Used when the user does not know their monthly kWh consumption and
// only enters a bill value. Editable — placeholder for a future config.
export const DEFAULT_PRICE_PER_KWH_LEI = 1.3;

export interface RecommendationInput {
  monthlyConsumptionKwh: number;
  monthlyBillLei?: number;
  bigLoads?: string[];
  bigLoadsOther?: string;
  peakTime?: PeakTime;
  county?: string;
  locality?: string;
  housingType?: string;
  housingTypeOther?: string;
  roofType?: string;
  roofTypeOther?: string;
  orientation?: string;
  shading?: string;
  batteryPref?: BatteryPref;
  budgetLei?: number;
  goal?: Goal;
}

export type FitScore = "acceptabilă" | "bună" | "foarte bună";

export interface RecommendationResult {
  recommendedKwp: number;
  systemType: "on-grid" | "hibrid" | "cu baterie" | "fără baterie";
  batteryRecommended: boolean;
  batteryReason: string;
  compareBatteryScenarios: boolean;
  panelCountEstimate: number; // ~450Wp panels
  priceMinLei: number;
  priceMaxLei: number;
  priceWithBatteryMinLei: number;
  priceWithBatteryMaxLei: number;
  estimatedAnnualKwh: number;
  monthlySavingsLei: number;
  paybackYears: number;
  fitScore: FitScore;
  consumptionCopy: string;
  consumptionSource: "kwh" | "bill_estimate";
  effectiveMonthlyKwh: number;
  checklist: string[];
  equipmentAsks: string[];
  risks: string[];
  notes: string[];
}

// On-grid price bands (RON, TVA + instalare incluse). Editable — mirrored
// in src/data/seedMarketBenchmarks.ts.
const PRICE_PER_KWP: Record<number, [number, number]> = {
  3: [18000, 25500],
  5: [24000, 32000],
  6: [28000, 36000],
  8: [38000, 48000],
  10: [45000, 58000],
  12: [55000, 72000],
};

// Battery add-on ranges (RON) for typical 5–10 kWh residential packs.
const BATTERY_ADD: [number, number] = [12000, 22000];

function pickBand(kwp: number): [number, number] {
  const keys = Object.keys(PRICE_PER_KWP).map(Number).sort((a, b) => a - b);
  const exact = PRICE_PER_KWP[kwp];
  if (exact) return exact;
  // Extrapolate: use nearest key.
  const nearest = keys.reduce((best, k) => Math.abs(k - kwp) < Math.abs(best - kwp) ? k : best, keys[0]);
  const [min, max] = PRICE_PER_KWP[nearest];
  const ratio = kwp / nearest;
  return [Math.round(min * ratio), Math.round(max * ratio)];
}

function copyForConsumption(kwh: number): string {
  if (kwh < 280)
    return "Consum mic — un sistem de aproximativ 3 kWp poate fi punctul de plecare. Bateria trebuie analizată cu grijă pentru că poate crește semnificativ perioada de amortizare.";
  if (kwh <= 520)
    return "Consum mediu — un sistem de aproximativ 5 kWp este de obicei zona cu cel mai bun raport cost/producție/amortizare.";
  if (kwh <= 750)
    return "Consum peste medie — un sistem de 6–8 kWp poate acoperi mai bine consumul anual, dar dimensionarea depinde de acoperiș și profilul orar.";
  if (kwh <= 1000)
    return "Consum ridicat — 8–10 kWp este intervalul potrivit dacă acoperișul permite. Verifică dacă ai branșament trifazic.";
  return "Consum foarte mare — recomandat 10 kWp+, iar dimensionarea exactă merită confirmată de un specialist care evaluează spațiul disponibil și limitările tehnice.";
}

export function recommendSystem(input: RecommendationInput): RecommendationResult {
  // 1. Effective monthly kWh — either directly provided, or derived from
  //    the invoice value using DEFAULT_PRICE_PER_KWH_LEI.
  let effectiveKwh = input.monthlyConsumptionKwh;
  let consumptionSource: "kwh" | "bill_estimate" = "kwh";
  if ((!effectiveKwh || effectiveKwh <= 0) && input.monthlyBillLei && input.monthlyBillLei > 0) {
    effectiveKwh = Math.round(input.monthlyBillLei / DEFAULT_PRICE_PER_KWH_LEI);
    consumptionSource = "bill_estimate";
  }
  if (!effectiveKwh || effectiveKwh <= 0) effectiveKwh = 400;

  const c = effectiveKwh;
  const loads = input.bigLoads ?? [];
  const hasEV = loads.includes("masina-electrica");
  const hasHP = loads.includes("pompa-caldura");
  const hasBoiler = loads.includes("boiler-electric");
  const hasAC = loads.includes("aer-conditionat");

  // 2. Base sizing tiers.
  let kwp: number;
  if (c < 280) kwp = 3;
  else if (c <= 520) kwp = 5;
  else if (c <= 750) kwp = 6;
  else if (c <= 1000) kwp = 8;
  else if (c <= 1400) kwp = 10;
  else kwp = 12;

  // 3. Adjustments for large consumers.
  if (hasHP) kwp += c > 700 ? 4 : 2;
  if (hasEV) kwp += c > 700 ? 5 : 2;
  if (hasBoiler) kwp += c > 500 ? 2 : 1;
  if (hasAC) kwp += 1;

  // Round to nearest common size.
  const commonSizes = [3, 5, 6, 8, 10, 12, 15];
  kwp = commonSizes.reduce((best, s) => Math.abs(s - kwp) < Math.abs(best - kwp) ? s : best, commonSizes[0]);

  // 4. Battery logic (no unknown branch).
  const eveningHeavy = input.peakTime === "seara-noapte";
  const wantsFastPayback = input.goal === "amortizare";
  const wantsIndependence = input.goal === "independenta" || input.goal === "backup";

  let batteryRecommended = false;
  let batteryReason = "";
  let compareBatteryScenarios = false;
  switch (input.batteryPref) {
    case "compara":
      compareBatteryScenarios = true;
      batteryRecommended = eveningHeavy || wantsIndependence;
      batteryReason = "Ai ales să compari ambele variante. Mai jos ai prețul orientativ și pentru sistemul on-grid, și pentru varianta cu baterie.";
      break;
    case "consum-seara":
      batteryRecommended = true;
      batteryReason = "Ai ales bateria pentru consum seara/noaptea. Bateria stochează surplusul produs în timpul zilei și îl folosește când soarele nu mai produce.";
      break;
    case "backup":
      batteryRecommended = true;
      batteryReason = "Ai ales bateria pentru backup. Verifică cu instalatorul ce circuite rămân alimentate la o pană de curent și autonomia estimată în kWh.";
      break;
    case "fara":
      batteryRecommended = false;
      batteryReason = "Ai ales sistem fără baterie. On-grid-ul are cost inițial mai mic și amortizare de obicei mai rapidă. Poți adăuga baterie mai târziu dacă profilul de consum o justifică.";
      break;
    default:
      // No explicit choice yet — infer conservatively.
      batteryRecommended = eveningHeavy || wantsIndependence;
      batteryReason = batteryRecommended
        ? "Profilul tău (consum seara/noaptea sau nevoie de independență) sugerează că bateria are sens. Confirmă capacitatea (kWh) cu instalatorul."
        : "Pentru consum diurn moderat, bateria adaugă cost fără economii semnificative. Poți începe on-grid și extinde ulterior.";
  }
  if (wantsFastPayback && batteryRecommended && input.batteryPref !== "backup") {
    // Warn but keep the user's preference.
    batteryReason += " Notă: bateria poate extinde amortizarea cu 1–3 ani.";
  }

  // 5. Prices.
  const [pMin, pMax] = pickBand(kwp);
  const priceWithBatteryMinLei = pMin + BATTERY_ADD[0];
  const priceWithBatteryMaxLei = pMax + BATTERY_ADD[1];
  const priceMinLei = batteryRecommended ? priceWithBatteryMinLei : pMin;
  const priceMaxLei = batteryRecommended ? priceWithBatteryMaxLei : pMax;

  // 6. Production & savings — orientative national average yield.
  const estimatedAnnualKwh = Math.round(kwp * 1260 * 0.90);
  const selfUseRatio = batteryRecommended ? 0.85 : 0.6;
  const priceKwh = 1.1;
  const yearlySavings = estimatedAnnualKwh * selfUseRatio * priceKwh;
  const monthlySavingsLei = Math.round(yearlySavings / 12);
  const midPrice = (priceMinLei + priceMaxLei) / 2;
  const paybackYears = Math.round((midPrice / yearlySavings) * 10) / 10;

  const panelCountEstimate = Math.ceil((kwp * 1000) / 450);

  // 7. Checklist / equipment / risks / notes.
  const checklist = [
    "Prețul total include TVA, transport, instalare și punere în funcțiune",
    "Protecții AC/DC sunt incluse în ofertă",
    "Dosarul de prosumator este menționat explicit",
    "Garanție echipamente (panouri ≥ 12 ani, invertor ≥ 10 ani)",
    "Garanție manoperă ≥ 2 ani",
    "Sunt specificate brand și model exact pentru panouri și invertor",
    batteryRecommended
      ? "Bateria are capacitate defalcată (kWh), brand, garanție și scenariu de backup"
      : "Sistemul este on-grid, fără baterie ascunsă la un preț global",
  ];

  const equipmentAsks: string[] = [
    "Panouri Tier 1 (Longi, Jinko, Trina, JA Solar sau echivalent), garanție produs ≥ 12 ani",
    `Invertor ${batteryRecommended ? "hibrid" : "on-grid"} cu 2 MPPT, garanție ≥ 10 ani`,
    "Structură de prindere adecvată tipului de acoperiș",
    "Tablou AC/DC cu protecții separate",
  ];
  if (batteryRecommended) equipmentAsks.push("Baterie LiFePO4 cu ≥ 6.000 cicluri, defalcat în kWh utilizabili");
  if (hasEV) equipmentAsks.push("Pregătire pentru încărcător mașină electrică (wallbox)");

  const risks: string[] = [];
  if (hasHP) risks.push("Iarna producția scade semnificativ — pompa de căldură poate necesita rețea/gaz suplimentar.");
  if (input.shading === "moderata") risks.push("Umbrire moderată — cere invertor cu suficiente MPPT-uri sau optimizatoare pe module.");
  if (input.shading === "semnificativa") risks.push("Umbrire semnificativă — producția reală poate scădea cu 30–40%. Solicită expertiză de umbrire.");
  if (input.orientation === "est" || input.orientation === "vest") risks.push("Orientarea est/vest reduce producția anuală cu ~18% față de sud.");
  if (input.orientation === "ne-nv") risks.push("Orientarea nord-est/nord-vest reduce producția cu ~35%. Sistemul rămâne fezabil, dar amortizarea crește.");
  if (input.orientation === "nord") risks.push("Orientarea nord reduce producția cu ~50%. Fotovoltaicul are rentabilitate slabă — evaluează alternative sau montaj înclinat pe structură dedicată.");
  if (kwp >= 8) risks.push("Sistemele ≥ 8 kWp pot necesita branșament trifazic — verifică cu operatorul de distribuție.");
  if (batteryRecommended && wantsFastPayback) risks.push("Bateria poate extinde perioada de amortizare cu 1–3 ani.");
  if (hasEV) risks.push("Mașina electrică se încarcă adesea seara — bateria sau încărcarea programată ziua îmbunătățesc auto-consumul.");

  const notes: string[] = [
    "Recomandarea este orientativă și depinde de amplasament, orientare, umbrire, echipamente și condițiile contractuale.",
  ];
  if (consumptionSource === "bill_estimate") {
    notes.push(`Consumul lunar a fost estimat din factură folosind un preț mediu de ${DEFAULT_PRICE_PER_KWH_LEI} lei/kWh.`);
  }
  if (c > 1000) notes.push("Consum ridicat — verifică dacă ai un abonament trifazic.");
  if (c > 1400) notes.push("Peste 1000 kWh/lună — dimensionarea exactă merită confirmată de un specialist.");

  const fitScore: FitScore = (() => {
    if (input.orientation === "nord") return "acceptabilă";
    if (input.shading === "semnificativa") return "acceptabilă";
    if (input.orientation === "ne-nv" || input.shading === "moderata") return "acceptabilă";
    if (input.orientation === "sud" && (input.shading === "deloc" || !input.shading)) return "foarte bună";
    return "bună";
  })();

  return {
    recommendedKwp: kwp,
    systemType: batteryRecommended ? (wantsIndependence ? "hibrid" : "cu baterie") : "on-grid",
    batteryRecommended,
    batteryReason,
    compareBatteryScenarios,
    panelCountEstimate,
    priceMinLei,
    priceMaxLei,
    priceWithBatteryMinLei,
    priceWithBatteryMaxLei,
    estimatedAnnualKwh,
    monthlySavingsLei,
    paybackYears,
    fitScore,
    consumptionCopy: copyForConsumption(c),
    consumptionSource,
    effectiveMonthlyKwh: c,
    checklist,
    equipmentAsks,
    risks,
    notes,
  };
}
