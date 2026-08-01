// Solar data contracts. UI and services must exchange only these shapes so
// that seed data can be swapped for real PVGIS/backend responses without
// touching the UI. No "unknown" states allowed — the UI must guide the user
// to a valid choice with helper text and form validation.

export type Orientation =
  | "sud"
  | "sud-est"
  | "sud-vest"
  | "est-vest"
  | "est"
  | "vest"
  | "ne-nv"
  | "nord";

export type Shading =
  | "deloc"       // Fără umbrire
  | "usoara"      // Umbrire ușoară
  | "moderata"    // Umbrire moderată
  | "semnificativa"; // Umbrire semnificativă

export type PotentialLevel = "scazut" | "mediu" | "bun" | "foarte_bun";

export type SolarSource = "seed" | "PVGIS" | "local_estimate";

export interface SolarCountyPotential {
  countyName: string;
  countyCode: string;
  region: "S" | "SE" | "SV" | "E" | "V" | "NV" | "NE" | "C" | "B";
  lat: number;
  lng: number;
  annualKwhPerKwp: number;
  irradiationAnnual: number;
  potentialLevel: PotentialLevel;
  monthlyDistribution: number[];
  source: SolarSource;
  lastUpdatedAt: string;
  deltaVsNationalAverage: number;
}

export interface ProductionEstimate {
  countyCode: string;
  systemKwp: number;
  orientation: Orientation;
  shading: Shading;
  annualProductionKwh: number;
  monthlyProductionKwh: number[];
  peakMonthIndex: number;
  summerKwh: number;
  winterKwh: number;
  source: SolarSource;
  lastUpdatedAt: string;
}
