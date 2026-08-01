export const RECOMMENDATION_ASSUMPTIONS_V2 = {
  version: "RO-2026.07-v4",
  effectiveDate: "2026-07-30",
  lastReviewDate: "2026-07-30",
  methodology:
    "PVGIS monthly production plus deterministic monthly consumption matching. Economics use internally coherent conservative, base and optimistic scenarios; values remain orientative market assumptions, not official tariffs or quotations.",
  sources: [
    {
      title: "PVGIS 5.3 API and grid-connected photovoltaic methodology",
      institution: "European Commission Joint Research Centre",
      url: "https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en",
      accessed: "2026-07-29",
      limitation: "Long-term modelled production; not a roof survey or guarantee.",
    },
    {
      title: "Rules for electricity supplied by Romanian prosumers",
      institution: "ANRE",
      url: "https://anre.ro/consumatori/energie-electrica/cum-devin-prosumator/",
      accessed: "2026-07-29",
      limitation: "Compensation and supplier contracts vary; no universal retail tariff.",
    },
    {
      title: "Official daily exchange rates and XML series",
      institution: "Banca Națională a României",
      url: "https://www.bnr.ro/en/561-exchange-rates",
      accessed: "2026-07-29",
      limitation: "Used as the authoritative source architecture for future deterministic currency conversion; extraction preserves the original currency.",
    },
  ],
  electricity: {
    importTariffLeiPerKwh: { conservative: 1.0, base: 1.3, optimistic: 1.55 },
    exportValueLeiPerKwh: { conservative: 0.35, base: 0.55, optimistic: 0.8 },
    billConversionLeiPerKwh: 1.3,
  },
  pv: {
    panelNominalKwp: 0.45,
    panelAreaM2: 2.05,
    generalLossPercent: 14,
    annualDegradationPercent: 0.5,
    orientationFactor: {
      south: 1,
      "south-east": 0.96,
      "south-west": 0.96,
      "east-west": 0.9,
      east: 0.84,
      west: 0.84,
      north: 0.55,
      unknown: 0.85,
    },
    shadingFactor: { none: 1, light: 0.94, moderate: 0.82, severe: 0.6, unknown: 0.82 },
  },
  investment: {
    onGridLeiPerKwp: { min: 4300, max: 6000 },
    fixedExtrasLei: { min: 3500, max: 6500 },
    hybridInverterExtraLei: { min: 3500, max: 6500 },
    batteryLeiPerUsableKwh: { min: 2200, max: 3500 },
    includesVatInstallationAndDocumentation: true,
    methodology:
      "Broad Romanian market orientation band; supplier quotes, roof works and grid upgrades are not included unless stated.",
  },
  battery: {
    depthOfDischarge: 0.9,
    roundTripEfficiency: 0.9,
    annualDegradationPercent: 2,
    replacementYear: 12,
  },
  selfConsumption: {
    directDaylightShare: { day: 0.62, evening: 0.3, constant: 0.48, commercial: 0.72 },
  },
} as const;

export type RecommendationAssumptions = typeof RECOMMENDATION_ASSUMPTIONS_V2;
