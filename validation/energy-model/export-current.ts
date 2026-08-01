import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { recommendSystemV2 } from "../../src/lib/recommendation-v2/engine";
import type { RecommendationInputV2, SolarProductionProfile } from "../../src/lib/recommendation-v2/types";

type Scenario = {
  id: string;
  weatherKey: string;
  input: RecommendationInputV2;
};
type Profile = { monthlyKwhPerKwp: number[]; annualKwhPerKwp: number };

const root = new URL(".", import.meta.url);
const scenarios = JSON.parse(readFileSync(new URL("scenarios/canonical-scenarios.json", root), "utf8"))
  .scenarios as Scenario[];
const profiles = JSON.parse(readFileSync(new URL("fixtures/pvgis/normalized-monthly.json", root), "utf8"))
  .profiles as Record<string, Profile>;

mkdirSync(new URL("output", root), { recursive: true });

const output = scenarios.map((scenario) => {
  const fixture = profiles[scenario.weatherKey];
  if (!fixture) throw new Error(`Missing PVGIS fixture ${scenario.weatherKey}`);
  const productionProfile: SolarProductionProfile = {
    source: "PVGIS",
    normalizedMonthlyKwhPerKwp: fixture.monthlyKwhPerKwp,
    normalizedAnnualKwhPerKwp: fixture.annualKwhPerKwp,
    locationPrecision: scenario.input.locationPrecision === "county" ? "county" : "precise",
    fetchedAt: "2026-07-30T00:00:00.000Z",
    orientationIncluded: true,
    shadingIncluded: false,
  };
  const result = recommendSystemV2(scenario.input, productionProfile, "2026-07-30T00:00:00.000Z");
  return {
    id: scenario.id,
    assumptionsVersion: result.assumptionsVersion,
    preferred: result.preferred,
    smaller: result.smaller,
    larger: result.larger,
    confidence: result.confidence,
    consumption: result.consumption,
    recommendedRangeKwp: result.recommendedRangeKwp,
    elapsedMarker: "offline-deterministic",
  };
});

writeFileSync(
  new URL("output/current-engine.json", root),
  JSON.stringify({ generatedAt: "2026-07-30T00:00:00.000Z", scenarios: output }, null, 2) + "\n",
);
