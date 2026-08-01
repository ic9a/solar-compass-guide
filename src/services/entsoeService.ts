// Future integration for ENTSO-E historical load, generation and cross-border
// flows. Requires an API token stored server-side. Not yet implemented.
// Do NOT expose API tokens in the frontend.

export interface EntsoeHistoricalPoint {
  timestamp: string;
  valueMw: number;
}

export async function fetchEntsoeHistorical(): Promise<EntsoeHistoricalPoint[]> {
  // TODO: implement via server proxy with ENTSO-E token.
  return [];
}
