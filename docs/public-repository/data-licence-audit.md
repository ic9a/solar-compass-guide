# Public-data and licence audit

## Decision rule

A source is publishable only when its identity, stable provenance, explicit redistribution licence, attribution, transformation and output mapping are documented. Public accessibility alone is insufficient.

## Publishable derived fixtures

| Source family | Licence | Published form | Personal or household data | Decision |
|---|---|---|---|---|
| Utrecht multi-system PV generation | CC BY 4.0 | compact metadata and quality-controlled derived records | system identifiers are pseudonymous; no customer identity | include with attribution |
| Cyprus prosumer dataset | CC BY 4.0 | monthly energy aggregates | no names, addresses or account identifiers in derived output | include with attribution |
| Energy-community dataset | CC BY 4.0 | compact profile aggregates | synthetic/derived profile identifiers only | include with attribution |
| Eurostat household electricity prices | CC BY 4.0 | context only; no frozen output | aggregate public statistics | include attribution when used |

`validation/real-world-data/sources.json` is authoritative. Deterministic tests require every committed file under `fixtures/` to map to an accepted source with an allowed licence.

## Excluded or unresolved

ANRE reports, OPCOM material, record-specific procurement data, installer offers and PVOutput data have no committed redistributed output where rights are unresolved or not granted. They remain rejected, context-only, disabled or not ingested. Individual merchant offers, user uploads and household records are prohibited.

No private-only fixture is present in the publishable tree. The exporter excludes `validation/real-world-data/private/` if a future private fixture is introduced. Production validation must not be weakened to publish a dataset with uncertain rights.
