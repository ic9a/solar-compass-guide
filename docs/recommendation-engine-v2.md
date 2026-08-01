# Recommendation Engine V2

Assumptions version: `RO-2026.07-v2`  
Effective and reviewed: 2026-07-26

## V1 baseline audit

V1 silently initialized the wizard at 400 kWh/month and could still fall back to that value. It selected one capacity from fixed consumption tiers, added fixed capacity increments for large consumers without distinguishing whether they were already present in bills, and allowed “Nu am consumatori mari” to coexist with other choices. Location, county, tilt, roof area, connection type and housing constraints did not affect the core calculation. Production used a fixed national yield (`1260 × 0.90`), savings used one fixed self-consumption percentage, and battery selection mostly changed price rather than monthly energy flows. Prices and tariffs were scattered constants without a version or source trace.

## V2 architecture

The React wizard only collects and validates data. Pure typed modules under `src/lib/recommendation-v2/` handle:

1. input and mutually exclusive large-load normalization;
2. historical and future monthly consumption modelling;
3. normalized 1 kWp PVGIS profile adjustment;
4. roof-capacity derivation;
5. candidate generation (3–15 kWp);
6. monthly direct-use, export, import and battery-flow estimation;
7. investment, savings and payback ranges;
8. objective-aware ranking;
9. suitability, confidence and explanation.

The assumptions module is immutable and versioned. Supabase was deliberately not added because V2 has one reviewed configuration and does not need runtime editing.

## Core equations

- Bill estimate: `monthly bill / dated bill-conversion tariff`.
- Projected consumption: `historical consumption + future/not-included loads`.
- PV production: `PVGIS monthly kWh for 1 kWp × candidate kWp × orientation factor × shading factor`.
- Roof cap: minimum of `panel count × panel nominal power` and `floor(area / panel area) × panel nominal power`.
- Direct use: monthly minimum of PV and estimated daylight demand.
- Battery input: monthly minimum of PV surplus and `usable kWh × 30`.
- Battery output: minimum of evening demand and battery input after round-trip efficiency.
- Savings: avoided import at the import-tariff scenario plus exported energy at a separate export-value scenario.
- Payback range: low investment / high savings to high investment / low savings.

All outputs are orientative ranges. The model is not an installer design, grid approval, structural survey, horizon analysis, or financial guarantee.

## Sources

- European Commission Joint Research Centre, **PVGIS 5.3 API and grid-connected PV methodology**, accessed 2026-07-26. PVGIS supplies long-term monthly and annual performance for a specified location and configuration.
- ANRE, **Information for Romanian prosumers**, accessed 2026-07-26. Used to document the compensation context. It does not provide one universal retail tariff.
- Investment bands are a broad Romanian market-orientation methodology, include VAT/installation/prosumer documentation in the displayed baseline, and are explicitly not official statistics or supplier quotations.

## Scenario review

Automated scenarios cover 180, 400, 700 and 1,100 kWh/month across Miroslava, Craiova, Cluj-Napoca, Botoșani and Bucharest. Relationship assertions verify that higher consumption does not produce a smaller preferred system in the same location and that the higher-yield Craiova profile produces more than Botoșani for an equivalent system.

The invariant suite additionally verifies orientation, shading, bill conversion, load double-counting, winter/summer seasonality, roof caps, connection and apartment warnings, battery energy conservation, non-negative energy values, finite results and fallback confidence.

## Remaining limitations

- Monthly/time-of-use matching is deterministic and simplified; it is not an hourly smart-meter simulation.
- Shading is a disclosed factor, not a 3D or horizon survey.
- Future heat-pump defaults are not a heat-loss calculation.
- Battery power, EPS wiring and critical circuits require technical validation.
- Market prices and tariffs need periodic review and user-specific quotation/tariff confirmation.
- County fallback is provisional and lowers confidence.
