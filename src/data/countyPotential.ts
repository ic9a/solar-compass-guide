// Local orientative solar potential per județ. Values are estimated annual
// specific PV yield for a well-oriented, low-shading, south-facing 1 kWp
// system (kWh/kWp/year). LOCAL FALLBACKS — real values should come from
// PVGIS when reachable. County names match the GeoJSON `shapeName` values
// after `normalizeCountyName()`.

export type Potential = "scăzut" | "mediu" | "bun" | "foarte bun";

export interface CountyPotential {
  county: string;      // display name with diacritics
  code: string;        // ISO 3166-2:RO code suffix
  shapeName: string;   // normalized (uppercase, no diacritics) for GeoJSON match
  lat: number;
  lng: number;
  region: "S" | "SE" | "SV" | "E" | "V" | "NV" | "NE" | "C" | "B";
  yieldPerKwp: number; // kWh/kWp/year
  irradiation: number; // kWh/m²/year (annual)
  potential: Potential;
}

const p = (y: number): Potential =>
  y >= 1350 ? "foarte bun" : y >= 1250 ? "bun" : y >= 1150 ? "mediu" : "scăzut";

type Row = Omit<CountyPotential, "potential" | "shapeName" | "irradiation"> & {
  irradiation?: number;
};

const RAW: Row[] = [
  { county: "Alba",             code: "AB", lat: 46.07, lng: 23.57, region: "C",  yieldPerKwp: 1210 },
  { county: "Arad",             code: "AR", lat: 46.18, lng: 21.32, region: "V",  yieldPerKwp: 1270 },
  { county: "Argeș",            code: "AG", lat: 44.86, lng: 24.87, region: "S",  yieldPerKwp: 1260 },
  { county: "Bacău",            code: "BC", lat: 46.57, lng: 26.91, region: "E",  yieldPerKwp: 1230 },
  { county: "Bihor",            code: "BH", lat: 47.06, lng: 21.93, region: "NV", yieldPerKwp: 1200 },
  { county: "Bistrița-Năsăud",  code: "BN", lat: 47.13, lng: 24.50, region: "NV", yieldPerKwp: 1180 },
  { county: "Botoșani",         code: "BT", lat: 47.75, lng: 26.66, region: "NE", yieldPerKwp: 1200 },
  { county: "Brașov",           code: "BV", lat: 45.66, lng: 25.60, region: "C",  yieldPerKwp: 1220 },
  { county: "Brăila",           code: "BR", lat: 45.27, lng: 27.98, region: "SE", yieldPerKwp: 1345 },
  { county: "București",        code: "B",  lat: 44.43, lng: 26.10, region: "B",  yieldPerKwp: 1310 },
  { county: "Buzău",            code: "BZ", lat: 45.15, lng: 26.82, region: "SE", yieldPerKwp: 1290 },
  { county: "Călărași",         code: "CL", lat: 44.20, lng: 27.33, region: "S",  yieldPerKwp: 1360 },
  { county: "Caraș-Severin",    code: "CS", lat: 45.30, lng: 22.20, region: "V",  yieldPerKwp: 1260 },
  { county: "Cluj",             code: "CJ", lat: 46.77, lng: 23.60, region: "NV", yieldPerKwp: 1180 },
  { county: "Constanța",        code: "CT", lat: 44.17, lng: 28.65, region: "SE", yieldPerKwp: 1400 },
  { county: "Covasna",          code: "CV", lat: 45.85, lng: 25.78, region: "C",  yieldPerKwp: 1200 },
  { county: "Dâmbovița",        code: "DB", lat: 44.93, lng: 25.45, region: "S",  yieldPerKwp: 1280 },
  { county: "Dolj",             code: "DJ", lat: 44.32, lng: 23.80, region: "SV", yieldPerKwp: 1360 },
  { county: "Galați",           code: "GL", lat: 45.43, lng: 28.03, region: "SE", yieldPerKwp: 1330 },
  { county: "Giurgiu",          code: "GR", lat: 43.90, lng: 25.97, region: "S",  yieldPerKwp: 1340 },
  { county: "Gorj",             code: "GJ", lat: 45.03, lng: 23.28, region: "SV", yieldPerKwp: 1290 },
  { county: "Harghita",         code: "HR", lat: 46.36, lng: 25.80, region: "C",  yieldPerKwp: 1180 },
  { county: "Hunedoara",        code: "HD", lat: 45.75, lng: 22.90, region: "V",  yieldPerKwp: 1230 },
  { county: "Ialomița",         code: "IL", lat: 44.60, lng: 27.38, region: "S",  yieldPerKwp: 1355 },
  { county: "Iași",             code: "IS", lat: 47.16, lng: 27.59, region: "NE", yieldPerKwp: 1230 },
  { county: "Ilfov",            code: "IF", lat: 44.53, lng: 26.05, region: "B",  yieldPerKwp: 1315 },
  { county: "Maramureș",        code: "MM", lat: 47.66, lng: 23.58, region: "NV", yieldPerKwp: 1170 },
  { county: "Mehedinți",        code: "MH", lat: 44.63, lng: 22.65, region: "SV", yieldPerKwp: 1330 },
  { county: "Mureș",            code: "MS", lat: 46.55, lng: 24.56, region: "C",  yieldPerKwp: 1210 },
  { county: "Neamț",            code: "NT", lat: 46.93, lng: 26.37, region: "NE", yieldPerKwp: 1200 },
  { county: "Olt",              code: "OT", lat: 44.43, lng: 24.36, region: "SV", yieldPerKwp: 1350 },
  { county: "Prahova",          code: "PH", lat: 45.10, lng: 26.02, region: "S",  yieldPerKwp: 1250 },
  { county: "Sălaj",            code: "SJ", lat: 47.20, lng: 23.05, region: "NV", yieldPerKwp: 1180 },
  { county: "Satu Mare",        code: "SM", lat: 47.79, lng: 22.88, region: "NV", yieldPerKwp: 1180 },
  { county: "Sibiu",            code: "SB", lat: 45.79, lng: 24.15, region: "C",  yieldPerKwp: 1230 },
  { county: "Suceava",          code: "SV", lat: 47.65, lng: 26.25, region: "NE", yieldPerKwp: 1170 },
  { county: "Teleorman",        code: "TR", lat: 43.80, lng: 25.35, region: "S",  yieldPerKwp: 1345 },
  { county: "Timiș",            code: "TM", lat: 45.75, lng: 21.23, region: "V",  yieldPerKwp: 1290 },
  { county: "Tulcea",           code: "TL", lat: 45.18, lng: 28.80, region: "SE", yieldPerKwp: 1380 },
  { county: "Vâlcea",           code: "VL", lat: 45.10, lng: 24.37, region: "SV", yieldPerKwp: 1260 },
  { county: "Vaslui",           code: "VS", lat: 46.63, lng: 27.72, region: "E",  yieldPerKwp: 1240 },
  { county: "Vrancea",          code: "VN", lat: 45.70, lng: 27.19, region: "E",  yieldPerKwp: 1270 },
];

export function normalizeCountyName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ș|Ș/g, "s")
    .replace(/ț|Ț/g, "t")
    .replace(/ă|Ă/g, "a")
    .replace(/â|Â/g, "a")
    .replace(/î|Î/g, "i")
    .toUpperCase()
    .trim();
}

export const COUNTIES: CountyPotential[] = RAW.map((r) => ({
  ...r,
  shapeName: normalizeCountyName(r.county),
  irradiation: r.irradiation ?? Math.round(r.yieldPerKwp * 1.1),
  potential: p(r.yieldPerKwp),
}));

export const NATIONAL_AVG_YIELD = Math.round(
  COUNTIES.reduce((a, c) => a + c.yieldPerKwp, 0) / COUNTIES.length,
);

export function getCounty(name: string): CountyPotential | undefined {
  const n = normalizeCountyName(name);
  return COUNTIES.find((c) => c.shapeName === n);
}

export function getCountyByCode(code: string): CountyPotential | undefined {
  return COUNTIES.find((c) => c.code === code);
}
