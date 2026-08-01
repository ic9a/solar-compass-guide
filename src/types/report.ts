// Report + recommendation data contracts.

export type InclusionStatus = "included" | "unclear" | "missing";
export type Severity = "info" | "warn" | "danger";

export interface ScoreBreakdown {
  overall: number; // 0..100
  price: number;
  equipment: number;
  transparency: number;
  risk: number;
}

export interface ReportInclusion {
  key: string;
  label: string;
  status: InclusionStatus;
  note?: string;
}

export interface ReportRedFlag {
  id: string;
  title: string;
  detail: string;
  severity: Severity;
}

export interface ReportQuestion {
  id: string;
  category: "Preț" | "Echipamente" | "Baterie" | "Instalare" | "Garanții" | "Financiar";
  text: string;
}

export interface ReportEquipment {
  panels: { brand: string; model: string; wp: number; tier: string; warrantyYears: number };
  inverter: { brand: string; model: string; type: "string" | "hibrid" | "microinvertor"; warrantyYears: number };
  battery?: { brand: string; model: string; kwh: number; chemistry: string; warrantyYears: number };
}

export interface ReportFinancial {
  offerPrice: number;
  benchmarkMin: number;
  benchmarkMedian: number;
  benchmarkMax: number;
  monthlyBillNow: number;
  monthlySavingsMin: number;
  monthlySavingsMax: number;
  paybackYearsMin: number;
  paybackYearsMax: number;
  irrPct?: number;
}

export interface ReportInstallation {
  scaffoldingIncluded: InclusionStatus;
  acDcProtectionsIncluded: InclusionStatus;
  prosumerFileIncluded: InclusionStatus;
  monitoringIncluded: InclusionStatus;
  smartMeterIncluded: InclusionStatus;
  warrantyLaborYears: number | null;
}

export interface OfferReport {
  offerName: string;
  systemKwp: number;
  systemType: "on-grid" | "hibrid";
  phase: "monofazat" | "trifazat";
  county: string;
  scores: ScoreBreakdown;
  verdict: "excelent" | "bun" | "acceptabil" | "atentie" | "risc";
  summary: string;
  equipment: ReportEquipment;
  financial: ReportFinancial;
  installation: ReportInstallation;
  inclusions: ReportInclusion[];
  redFlags: ReportRedFlag[];
  questions: ReportQuestion[];
  generatedAt: string;
}

export type FitScore = "acceptabilă" | "bună" | "foarte bună";
export type BatteryPref = "fara" | "consum-seara" | "backup" | "compara";

export interface RecommendationResult {
  recommendedKwpMin: number;
  recommendedKwpMax: number;
  recommendedLabel: string;
  systemType: "on-grid" | "hibrid";
  batteryRecommendation: {
    advised: boolean;
    kwhMin: number;
    kwhMax: number;
    rationale: string;
  };
  annualProductionKwh: number;
  monthlyProductionKwh: number[];
  estimatedPriceMin: number;
  estimatedPriceMax: number;
  monthlySavingsMin: number;
  monthlySavingsMax: number;
  paybackYearsMin: number;
  paybackYearsMax: number;
  fitScore: FitScore;
  riskNotes: string[];
  equipmentChecklist: string[];
  explanation: string;
  panelCountEstimate: number;
}
