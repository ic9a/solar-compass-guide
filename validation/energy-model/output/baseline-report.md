# Baseline energy-model benchmark

## Method and versions

- Scenarios: 64 curated Romanian cases.
- pvlib: 0.15.2; PySAM fixture parity package: 7.1.1.post1.
- Weather: frozen PVGIS 5.3 SARAH3/ERA5 TMY snapshots, 8,760 hours per location.
- Production: independent pvlib PVWatts-style POA, Faiman cell temperature, inverter conversion and 14% aggregate loss.
- Energy flow: independent hourly state-of-charge dispatch with 90% round-trip efficiency and strict conservation.
- Sizing: independent exhaustive integer-panel and practical whole-kWh battery search.

## Aggregate results

- Annual production MAPE: **3.37%**; max: **9.201%**.
- Direct self-consumption MAPE: **12.447%**.
- Mean absolute panel difference: **0.578**; max: **7**.
- Mean absolute battery difference: **5.438 kWh**.
- Base payback MAPE: **23.433%**.
- Maximum hourly energy-balance error: **4.441e-16 kWh**.

## Largest discrepancies

| Scenario | Orientation | TS panels | Reference panels | Direct-use error |
|---|---:|---:|---:|---:|
| RO-005 | east-west | 11 | 11 | -29.8% |
| RO-026 | south-east | 15 | 14 | 28.9% |
| RO-033 | east | 10 | 14 | -28.8% |
| RO-058 | west | 19 | 23 | -28.6% |
| RO-003 | east | 8 | 8 | -28.3% |
| RO-050 | south-east | 14 | 13 | -26.9% |
| RO-049 | south | 11 | 12 | 25.8% |
| RO-014 | south-east | 12 | 12 | 25.7% |

## Root-cause interpretation

- Annual production differences combine PVGIS PVcalc versus pvlib transposition/temperature/inverter assumptions; threshold breaches are not automatically production defects.
- The current engine matches production and demand monthly, so it can overstate direct self-consumption when generation and demand occur at different hours.
- The current battery model applies a monthly throughput cap and has no hourly state of charge or power constraint; differences are expected for evening EV and backup cases.
- Candidate differences inherit those energy-flow differences and the intentionally simplified customer objective.

## Current strengths

- Integer panel counts and installed kWp remain internally consistent.
- Production uses official PVGIS location/orientation fixtures in production rather than a national scalar.
- Economic scenarios are internally ordered and deterministic.
- Battery losses are non-negative and the independent reference closes its hourly energy balance.

## Proposed corrections

- Replace monthly self-consumption matching with a compact precomputed representative-hour profile only if the direct-use threshold is materially breached.
- Preserve PVGIS as the production source; do not retune orientation factors where PVGIS already includes orientation.
- Separate production, market-cost and user-input uncertainty in presentation.

## Corrections not recommended

- Do not replace the production engine with Python, pvlib, PySAM or a live optimization API.
- Do not tune annual production solely to match pvlib because weather and component assumptions differ.
- Do not present this benchmark as certification, an engineering design or guaranteed production.

## Limitations

- No site-specific horizon, roof obstruction survey, module stringing, inverter clipping study or degradation cash-flow model.
- PySAM is retained as a pinned secondary parity tool; the required PR check uses the faster pvlib/hourly subset, while the full workflow installs both packages.
