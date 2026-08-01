# Final energy-model benchmark

## Method and versions

- Same 64 curated Romanian scenarios and frozen PVGIS 5.3 SARAH3/ERA5 TMY fixtures as baseline.
- Production reference: pvlib 0.15.2 PVWatts-style POA, Faiman temperature, inverter conversion and 14% loss.
- Scientific environment: Python 3.13; NREL-PySAM 7.1.1.post1 pinned as a secondary parity package.
- Energy-flow reference: independent 8,760-hour state-of-charge dispatch with 90% round-trip efficiency and numerical conservation.
- Sizing reference: independent exhaustive integer-panel and practical whole-kWh battery search.

## Final aggregate results

| Metric | Baseline | Final | Review threshold |
|---|---:|---:|---:|
| Annual production MAPE | 3.370% | 3.370% | 5% |
| Annual production max error | 9.201% | 9.201% | investigate |
| Monthly normalized MAE | — | 8.896% | 10% |
| Maximum monthly deviation | — | 64.535% | investigate |
| Direct self-consumption MAPE | 12.447% | 12.447% | investigate |
| Mean absolute panel difference | 0.578 | 0.578 | 1 panel |
| Maximum panel difference | 7 | 7 | investigate |
| Mean absolute battery difference | 5.438 kWh | 5.438 kWh | 1 kWh |
| Base payback MAPE | 23.433% | 23.433% | 5% with identical assumptions |
| Maximum hourly energy-balance error | 4.441e-16 kWh | 4.441e-16 kWh | 1e-9 kWh |

## Evidence-based correction decision

A representative-hour TypeScript experiment was evaluated on the same matrix. It reduced mean panel difference from 0.578 to 0.562 and battery difference from 5.438 to 5.406 kWh, but worsened direct self-consumption MAPE from 12.447% to 15.311% and payback MAPE from 23.433% to 23.618%. The experiment was rejected and removed. Production retains its deterministic monthly formula.

No annual-production retuning was made: PVGIS and pvlib use different weather, transposition, temperature and inverter assumptions. Threshold breaches are investigation signals, not proof that either model is defective.

## Retained targeted changes

- Explicit unknown orientation and shading inputs now use prudent factors and reduce confidence.
- Production, market-cost and economic sensitivity are presented separately.
- The main result uses homeowner language; methodology is in a collapsed “Cum am calculat” section.
- Orientation and shading cards use distinct accessible inline SVG illustrations.

## Largest original discrepancies

The largest errors remain concentrated in west/east/east–west direct-use timing, northern production, roof-constrained sizing and battery/backup cases. The detailed CSV preserves every scenario’s TypeScript result, reference result and signed error.

## Performance impact

No 8,760-hour calculation was moved into the browser. Production calculation complexity remains the baseline 12-month model. Presentation and SVG changes add no modelling loop, production API call or Python dependency.

## Intentionally retained differences and limitations

- The independent hourly load shapes are reference assumptions, not measured household interval data.
- The production engine remains PVGIS-based; it is not replaced by pvlib, PySAM or REopt.
- PySAM is installed and pinned as a secondary parity tool; this required deterministic matrix uses pvlib plus the transparent hourly validator.
- REopt was not made a CI dependency because no reproducible credential-free fixture path was required for this release.
- No site-specific horizon survey, obstruction survey, stringing/clipping study, degradation cash flow or installer quotation is represented.
- Results are orientation and sizing guidance, not certification, engineering design, guaranteed production or proof of an optimal system.

Baseline audit commit: `1633c4dba7d43876e7bfb553423db6e8ddcb6f3c`.
