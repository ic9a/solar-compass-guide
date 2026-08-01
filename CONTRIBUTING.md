# Contributing

RaportSolar is public source / source available and is not an open-source project.

1. Create a focused branch and pull request.
2. Do not include credentials, environment files, user data, offers, addresses, production logs, or private fixtures.
3. Preserve deterministic recommendation, energy, and scoring behavior unless an issue explicitly authorizes a reviewed model change.
4. Add tests and documentation for behavioral changes.
5. Run the complete relevant validation locally.
6. By submitting a contribution, you confirm that you have the right to submit it and agree that, if accepted, it may be incorporated and distributed under RaportSolar's source-available terms in the root `LICENSE`.
7. Submission does not grant contributors or downstream users additional rights to the existing project.

Required commands:

```sh
npm ci
npm run typecheck
npm run lint:phase1
npm run lint:phase2
npm run lint:final
npm test
npm run build
npm run public:verify
```

Browser and energy-model gates run in CI. Fork validation receives no production secrets and cannot deploy.
