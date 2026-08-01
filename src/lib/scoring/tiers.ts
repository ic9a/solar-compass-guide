// Panel and inverter brand tiers used by scoring.
// Tier 1 = top-tier bankable brands with long track record.
// Tier 2 = solid mid-tier.
// Tier 3 = budget / less-established.
// Unknown = brand not recognized (usually indicates a risk to flag).

const PANEL_TIER_1 = [
  "sunpower", "maxeon", "rec", "lg", "panasonic",
  "qcells", "q cells", "hanwha q",
  "jinko tiger neo", "canadian solar higher tier",
];
const PANEL_TIER_2 = [
  "jinko", "ja solar", "trina", "canadian solar", "longi",
  "risen", "seraphim", "znshine", "astronergy", "phono",
];

const INVERTER_TIER_1 = [
  "sma", "fronius", "solaredge", "enphase", "victron",
];
const INVERTER_TIER_2 = [
  "huawei", "sungrow", "goodwe", "growatt", "kostal",
  "solis", "solplanet", "delta", "ingeteam",
];
const INVERTER_TIER_3 = [
  "deye", "livoltek", "must", "afore", "solax",
];

function normalize(input: string | null | undefined): string {
  return (input ?? "").toLowerCase().trim();
}

function matches(brand: string, list: string[]): boolean {
  return list.some((needle) => brand.includes(needle));
}

export function classifyPanel(brand: string | null | undefined): "tier1" | "tier2" | "tier3" | "unknown" {
  const b = normalize(brand);
  if (!b) return "unknown";
  if (matches(b, PANEL_TIER_1)) return "tier1";
  if (matches(b, PANEL_TIER_2)) return "tier2";
  return "tier3";
}

export function classifyInverter(brand: string | null | undefined): "tier1" | "tier2" | "tier3" | "unknown" {
  const b = normalize(brand);
  if (!b) return "unknown";
  if (matches(b, INVERTER_TIER_1)) return "tier1";
  if (matches(b, INVERTER_TIER_2)) return "tier2";
  if (matches(b, INVERTER_TIER_3)) return "tier3";
  return "unknown";
}
