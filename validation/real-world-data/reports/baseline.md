# Real-world calibration baseline

Frozen: 2026-07-30  
Production baseline: `f9ea315184cea9dc13ebaa9708f668ded44fef57`  
Engine assumptions: `RO-2026.07-v3`

This report is intentionally committed before any calibration or production-formula change. It extends, but does not replace, the existing 64-scenario PVGIS/pvlib/PySAM benchmark.

## Existing independent benchmark

| Metric | Baseline |
|---|---:|
| Annual production MAPE | 3.370% |
| Annual production maximum error | 9.201% |
| Direct self-consumption MAPE | 12.447% |
| Mean absolute panel difference | 0.578 |
| Mean absolute battery difference | 5.438 kWh |
| Payback MAPE | 23.433% |
| Maximum hourly energy-balance error | 4.441e-16 kWh |

## Real-world evidence admitted at baseline

| Dataset | Units admitted | Intended use | Calibration eligible? |
|---|---:|---|---|
| Utrecht PV fleet | 175 systems (metadata) | Annual-yield plausibility and coverage | No: Netherlands climate and no frozen time-series sample |
| Cyprus prosumer | 24 monthly files | Ingestion, interval integration and behavioural shape checks | No: one site outside Romania |
| Energy community | 250 profiles / 200 PV | Profile-distribution and data-pipeline validation | No: actual-based synthetic community |
| Eurostat `nrg_pc_204` | context only | Household tariff sanity checks | No: not an export tariff |

ANRE and OPCOM materials are official but excluded from redistributed fixtures until explicit reuse terms are verified. Romanian procurement records and installer offers are also excluded because the requested comparable, licence-verified sample was not completed.

## Baseline decision

The current evidence does **not** meet the minimum requirement for a Romania-specific production or financial correction. No coefficient, PVGIS output, sizing rule, self-consumption rule, tariff default, or payback formula may change on this baseline.

The only releasable artifact is an auditable ingestion/validation layer with a disabled production calibration. Holdout performance therefore remains identical to the authoritative production baseline.

## Known gaps

- No Romanian measured residential PV time-series.
- No frozen sample of approximately 24 Utrecht power series; the upstream filtered files total roughly 6 GB.
- No licence-cleared, normalized ANRE/OPCOM redistribution fixture.
- No 50-award procurement or 30–50 installer-offer verified sample.
- No evidence supporting a regional Romanian correction or a central-value formula change.
