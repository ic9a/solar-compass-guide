# Real-world data ingestion and calibration

This directory is a versioned evidence layer. It never replaces PVGIS, the TypeScript recommendation engine, or the existing independent benchmark. Required CI reads only committed fixtures and never depends on live APIs.

## Layout

- `sources.json`: source URL, licence, evidence, status, checksum and attribution.
- `fixtures/`: compact derived data only; no upstream raw workbooks or high-frequency streams.
- `calibration/`: the small production-facing decision artifact. Version `2026.08-v1` is deliberately disabled.
- `reports/`: baseline and release decision records.
- `scripts/validate-real-world-calibration.mjs`: offline release gate.

## Canonical records

A measured-production record has: `source_id`, `system_id`, `timestamp_start`, `timestamp_end`, `timezone`, `energy_kwh`, `dc_capacity_kwp`, optional `ac_capacity_kw`, `tilt_deg`, `azimuth_deg`, `latitude`, `longitude`, `measurement_kind`, and `quality_flags`.

A market record has: `source_id`, `record_id`, `observed_at`, `county`, `vendor`, `system_kwp`, `battery_kwh`, `gross_price_ron`, `vat_included`, `equipment`, `installation_scope`, `warranty_years`, and `quality_flags`. Missing values remain null; they are never silently imputed.

## Quality score

Each candidate receives 0–100 points:

- 25: explicit licence and stable provenance;
- 20: checksum and reproducible transformation;
- 20: complete capacity/time/unit metadata;
- 15: continuity and physically valid values;
- 10: geographic relevance to Romania;
- 10: independence from another admitted record.

Records below 70 are excluded from calibration. `actual-based-synthetic` records may validate ingestion and profile dispersion but cannot establish a production correction. Market records must additionally include comparable scope, VAT treatment, capacity and observation date.

## Calibration protocol

Eligible records are assigned deterministically using `sha256(source_id + profile_id)`: buckets 0–69 calibrate and 70–99 are holdout. Medians and IQR are primary; MAD is used for outlier diagnostics. A correction needs the minimum sample count in the calibration artifact, a documented physical rationale, and non-worsening holdout error. Region-level factors require the per-region minimum independently. No national value may be inferred from one foreign system or synthetic profiles.

## Updating frozen data

1. Download only from the registered stable URL.
2. Verify the API-reported checksum and licence.
3. Keep raw files outside the production tree.
4. Run a reviewed transformation that normalizes units and emits compact CSV.
5. Update the registry, fixture checksum, counts, report and calibration version in one PR.
6. Run the offline validation workflow; never make its pass depend on the source being online.

## Future first-party ingestion

A future opt-in endpoint should accept signed, pseudonymous monthly or interval observations with explicit consent version, system metadata, timezone and unit. Validate with a strict size limit, idempotency key and schema version; quarantine invalid uploads; strip names, addresses, account identifiers and inverter serial numbers before durable storage. Store consent/audit metadata separately from measurements, enforce tenant RLS, encrypt at rest, define retention/deletion periods, and aggregate before calibration. A contributor must be able to export or delete their observations. Promotion into a frozen calibration release requires k-anonymity review, source diversity, deterministic train/holdout assignment and the same non-worsening holdout gate.

## Important boundary

ANRE and OPCOM are authoritative context, but their lack of a verified explicit redistribution licence keeps their documents out of this repository. PVOutput remains disabled without a separate licence. Eurostat household tariffs are not used as prosumer export prices, and OPCOM PZU is not presented as the ordinary residential export value.
