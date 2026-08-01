# Offline energy-model validation

This directory benchmarks the production TypeScript recommendation engine without changing its runtime architecture.

## Reproducible workflow

```bash
npm ci
npx --yes tsx@4.20.6 validation/energy-model/export-current.ts
python -m venv .venv-energy
.venv-energy/bin/pip install -r validation/energy-model/requirements.txt
.venv-energy/bin/python validation/energy-model/run_comparison.py --label baseline
```

Ordinary CI reads committed PVGIS fixtures and never calls PVGIS, REopt, Supabase or any production service.

`python validation/energy-model/update_fixtures.py` is the only explicit weather/profile refresh path. Review fixture diffs and regenerate both reports when refreshing.

## Model boundary

- Production remains deterministic TypeScript on Cloudflare Workers.
- Python is offline validation only.
- pvlib provides the principal independent PVWatts-style reference.
- NREL-PySAM is pinned as a second reference package and used for manually reviewed parity subsets; it is not a production dependency.
- The transparent optimizer does not import the TypeScript ranking implementation.

## Licences

- pvlib: BSD-3-Clause.
- NREL-PySAM: BSD-3-Clause.
- PVGIS data/API: European Commission JRC source attribution retained in every metadata fixture.

Review thresholds are investigation triggers rather than automatic proof that either model is wrong.
