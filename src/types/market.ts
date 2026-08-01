// Market benchmark segments — source-based orientative price ranges.
// Each entry includes the source, publication date, scope (VAT, installation,
// prosumer file) and a confidence score so the UI can present intervals
// honestly instead of pretending a single number is "the market price".

export type SystemType = "on-grid" | "hibrid" | "hibrid-cu-baterie" | "off-grid";
export type Phase = "monofazat" | "trifazat" | "mixt";

export interface MarketBenchmark {
  segmentName: string;
  sourceName: string;
  sourceUrl?: string;
  sourceDate: string;              // ISO
  systemKwMin: number;
  systemKwMax: number;
  systemType: SystemType;
  phase: Phase;
  batteryIncluded: boolean;
  batteryKwhMin: number;
  batteryKwhMax: number;
  priceMin: number;
  priceMedian: number;
  priceMax: number;
  currency: "RON";
  vatIncluded: boolean;
  installationIncluded: boolean;
  prosumerFileIncluded: boolean;
  confidenceScore: number;         // 0..1
  notes: string;
}
