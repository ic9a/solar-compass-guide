// Seed example offer report. Feeds /exemplu-raport via reportAnalysisService.

import type { OfferReport } from "@/types/report";

export const SEED_REPORT: OfferReport = {
  offerName: "Ofertă exemplu — sistem 5 kWp cu baterie",
  systemKwp: 5,
  systemType: "hibrid",
  phase: "monofazat",
  county: "Cluj",
  verdict: "bun",
  summary:
    "Sistem hibrid 5 kWp cu baterie 5 kWh, echipamente de calitate bună, preț ușor peste media pieței. Câteva puncte necesită clarificare înainte de semnare.",
  scores: { overall: 78, price: 72, equipment: 82, transparency: 70, risk: 85 },
  equipment: {
    panels: { brand: "JA Solar", model: "JAM54S30", wp: 415, tier: "Tier 1", warrantyYears: 25 },
    inverter: { brand: "Huawei", model: "SUN2000-5KTL-M1", type: "hibrid", warrantyYears: 10 },
    battery: { brand: "Huawei", model: "LUNA2000-5", kwh: 5, chemistry: "LFP", warrantyYears: 10 },
  },
  financial: {
    offerPrice: 44000,
    benchmarkMin: 34000, benchmarkMedian: 41000, benchmarkMax: 52000,
    monthlyBillNow: 480,
    monthlySavingsMin: 240, monthlySavingsMax: 360,
    paybackYearsMin: 8, paybackYearsMax: 11,
    irrPct: 9.2,
  },
  installation: {
    scaffoldingIncluded: "included",
    acDcProtectionsIncluded: "unclear",
    prosumerFileIncluded: "included",
    monitoringIncluded: "included",
    smartMeterIncluded: "missing",
    warrantyLaborYears: 2,
  },
  inclusions: [
    { key: "panels", label: "Panouri fotovoltaice", status: "included" },
    { key: "inverter", label: "Invertor hibrid", status: "included" },
    { key: "battery", label: "Baterie 5 kWh LFP", status: "included" },
    { key: "mount", label: "Structură de montaj", status: "included" },
    { key: "cabling", label: "Cablare DC/AC", status: "included" },
    { key: "protections", label: "Protecții AC/DC complete", status: "unclear", note: "Neprecizat brand/model." },
    { key: "prosumer", label: "Dosar prosumator", status: "included" },
    { key: "monitoring", label: "Monitorizare cloud", status: "included" },
    { key: "smartmeter", label: "Smart meter dedicat", status: "missing" },
    { key: "labor-warranty", label: "Garanție lucrare 5+ ani", status: "unclear", note: "În ofertă figurează doar 2 ani." },
  ],
  redFlags: [
    { id: "rf1", title: "Protecții AC/DC neprecizate", detail: "Oferta nu menționează brand/model pentru protecțiile AC și DC.", severity: "warn" },
    { id: "rf2", title: "Garanție lucrare 2 ani", detail: "Sub media pieței (recomandat minim 5 ani pentru lucrare).", severity: "warn" },
    { id: "rf3", title: "Smart meter lipsă", detail: "Pentru sistem hibrid cu autoconsum, smart meter-ul e important pentru optimizare.", severity: "danger" },
  ],
  questions: [
    { id: "q1", category: "Preț",       text: "Prețul include TVA-ul complet și toate taxele? Există costuri suplimentare la punerea în funcțiune?" },
    { id: "q2", category: "Echipamente", text: "Ce brand și model au protecțiile AC și DC și ce garanție au?" },
    { id: "q3", category: "Baterie",     text: "Care este numărul de cicluri garantate pentru baterie și capacitatea reziduală la finalul garanției?" },
    { id: "q4", category: "Instalare",   text: "Structura de montaj este dedicată tipului meu de acoperiș? Cine execută eventualele reparații la acoperiș după montaj?" },
    { id: "q5", category: "Garanții",    text: "Ce garanție oferiți pentru lucrare (nu pentru echipamente) și cum se rezolvă intervențiile în perioada de garanție?" },
    { id: "q6", category: "Financiar",   text: "Cum se face facturarea în regim de prosumator după punerea în funcțiune și cine se ocupă de dosar?" },
  ],
  generatedAt: new Date().toISOString(),
};
