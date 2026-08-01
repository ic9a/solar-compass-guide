import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const root = new URL('../validation/real-world-data/', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')
const rows = (path) => read(path).trim().split(/\r?\n/).slice(1)
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const registry = JSON.parse(read('sources.json'))
const calibration = JSON.parse(read('calibration/real-world-calibration-2026.08-v1.json'))
const utrecht = rows('fixtures/utrecht-systems.csv')
const cyprus = rows('fixtures/cyprus-monthly.csv')
const community = rows('fixtures/energy-community-profiles.csv')

assert(registry.schemaVersion === 1, 'unsupported provenance schema')
assert(registry.policy.productionRawData === false, 'raw data must not enter production')
assert(registry.policy.liveNetworkInRequiredChecks === false, 'required checks must be offline')
for (const source of registry.sources) {
  assert(source.id && source.url && source.status, 'incomplete source provenance')
  if (source.status.startsWith('accepted')) {
    assert(source.licence !== 'unresolved', `accepted source ${source.id} has unresolved licence`)
  }
}
assert(utrecht.length === 175, `expected 175 Utrecht systems, got ${utrecht.length}`)
assert(cyprus.length === 24, `expected 24 Cyprus files, got ${cyprus.length}`)
assert(community.length === 250, `expected 250 community profiles, got ${community.length}`)
assert(community.filter((line) => Number(line.split(',')[3]) > 0).length === 200, 'expected 200 PV profiles')
assert(calibration.enabled === false, 'calibration must remain disabled without Romanian measured evidence')
assert(calibration.admitted.romaniaMeasuredSystems === 0, 'unexpected Romanian measured systems')
assert(calibration.corrections.annualProductionMultiplier === 1, 'production multiplier changed')
assert(calibration.corrections.selfConsumptionMultiplier === 1, 'self-consumption multiplier changed')
assert(calibration.holdout.deltaPercentagePoints <= 0, 'holdout worsened')

const fingerprint = createHash('sha256')
  .update(read('sources.json'))
  .update(read('fixtures/utrecht-systems.csv'))
  .update(read('fixtures/cyprus-monthly.csv'))
  .update(read('fixtures/energy-community-profiles.csv'))
  .digest('hex')

console.log(JSON.stringify({
  status: 'pass',
  frozenFixtureFingerprint: fingerprint,
  counts: { utrecht: utrecht.length, cyprus: cyprus.length, community: community.length },
  calibrationEnabled: calibration.enabled,
  holdoutDeltaPercentagePoints: calibration.holdout.deltaPercentagePoints,
}, null, 2))
