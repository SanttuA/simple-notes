# Contributing

Run the same checks GitHub Actions runs before opening a pull request:

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test:ci
npm run audit
```

The app is intentionally offline-first. Do not add analytics, crash reporting, ads, account login, remote config, sync, or broad Android permissions without an explicit product decision.
