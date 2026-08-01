# RaportSolar

RaportSolar helps Romanian homeowners understand photovoltaic offers, estimate a suitable system and inspect the assumptions behind production, storage and economic scenarios.

This is the public, source-available RaportSolar repository. It was created from a verified clean snapshot with a new root commit; private development history, user data, credentials, and operational artifacts were not copied.

## Development

See [architecture and local development](docs/public-repository/architecture-and-local-development.md) and copy `.env.example` only into an ignored local environment file.

```sh
npm ci
npm run dev
```

## Quality gates

```sh
npm run typecheck
npm run lint:phase1
npm run lint:phase2
npm run lint:final
npm test
npm run build
npm run public:verify
```

GitHub Actions also enforce deterministic energy validation, Chromium mobile/desktop, Firefox, WebKit, a final browser gate, Gitleaks and a clean-room public snapshot.

## Security and data

Read [SECURITY.md](SECURITY.md), the [environment matrix](docs/public-repository/environment-matrix.md), and the [data licence audit](docs/public-repository/data-licence-audit.md). Never commit environment files, credentials, user uploads or customer data.

## Licence

RaportSolar is **source available**, not open source. Copyright remains with RaportSolar and reuse is restricted by the root [LICENSE](LICENSE). Viewing, cloning, or forking the repository does not grant permission to copy, modify, redistribute, sublicense, sell, or operate a derivative service. Third-party dependencies and datasets retain their own licences.

RaportSolar is educational decision support, not an engineering design, certification, guaranteed production forecast, legal opinion or financial advice.
