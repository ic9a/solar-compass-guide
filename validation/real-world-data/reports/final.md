# Real-world calibration validation — final report

Date: 2026-07-30  
Branch: `agent/real-world-calibration`  
Baseline: `f9ea315184cea9dc13ebaa9708f668ded44fef57`  
Candidate artifact: `real-world-calibration-2026.08-v1`

## Ingested evidence

- Utrecht: all 175 system metadata records, CC BY 4.0. Annual-yield median 1,006 kWh/kWp; IQR 955–1,034; range 679–1,113.
- Cyprus: all 24 measured monthly files, CC BY 4.0. Integrated positive PV energy per file has median 21.259 kWh and IQR 14.291–30.204.
- Energy community: all 250 actual-based-synthetic profiles, CC BY 4.0; 200 contain PV. Positive PV-sum median 36.271 and IQR 24.595–70.693 in the source workbook's published units.
- Eurostat `nrg_pc_204`: accepted as tariff context only; it does not set export value.

No raw workbook or high-frequency stream is included in the production bundle. Fixture counts and provenance are checked without network access.

## Exclusions

- Utrecht time series: not frozen; upstream filtered sources total about 6 GB, so the requested approximately 24-system sample remains incomplete.
- ANRE: official monthly/annual reports located through May 2026, but no explicit redistribution licence verified.
- OPCOM: official PZU context located, but no explicit redistribution licence verified; PZU is not an ordinary residential export proxy.
- SEAP/data.gov.ro and installer offers: the requested 50 verified awards and 30–50 comparable offers from 10 installers were not completed with record-specific reuse/terms verification.
- PVOutput: disabled; no licence granted.

## Calibration and holdout

Romania-specific measured-system count is 0, below the minimum of 30; offer count is 0, below 30; verified award count is 0, below 50. Foreign single-site and actual-based-synthetic data are not promoted into national coefficients.

Therefore all correction multipliers remain exactly 1.0 and the artifact is `enabled: false`. The candidate is identical to baseline for production behavior; annual-production holdout MAPE remains 3.370% (delta 0.000 percentage points). No TypeScript engine, PVGIS request, sizing rule, self-consumption formula, price default or report claim changed.

## Release gate

| Gate | Result |
|---|---|
| Accepted source licences resolved | Pass |
| Rejected/unresolved sources excluded from fixtures | Pass |
| Baseline committed before calibration artifact | Pass |
| No raw data in production | Pass |
| Frozen CI independent of live APIs | Pass |
| Holdout not worsened | Pass (unchanged) |
| Requested Romanian commercial/procurement coverage complete | **Fail** |
| Requested Utrecht measured time-series sample complete | **Fail** |

## Decision

**Do not merge or deploy this PR.** Keep it as a draft provenance/ingestion checkpoint. The task's explicit merge condition is not met because two requested evidence blocks remain incomplete. This is preferable to shipping an unsupported “real-world calibrated” claim.

To unblock release, add a licence-verified Romanian commercial/procurement sample, freeze a reproducible Utrecht time-series subset (or formally remove that requirement), rerun the baseline and deterministic 70/30 protocol, and demonstrate non-worsening holdout metrics. Only then may the calibration artifact be enabled and the public methodology updated.
