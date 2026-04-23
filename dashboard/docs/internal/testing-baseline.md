# Testing Baseline

## CI quality gate

Workflow: `.github/workflows/quality-gate.yml`

The quality gate runs on every pull request and on pushes to `main`:

1. `npm ci`
2. `npm run lint`
3. `npm run build`
4. Smoke placeholder

## Required environment

- `SMOKE_TEST_URL` (GitHub Actions secret)
  - Purpose: target URL used by the smoke placeholder check (`curl --fail`)
  - Example value: `https://staging.example.com/health`

## Fallback behavior

- If `SMOKE_TEST_URL` is **present**, the smoke placeholder runs and can fail the job.
- If `SMOKE_TEST_URL` is **missing**, the smoke placeholder is skipped intentionally and does not block the CI result.
- The baseline quality gate remains enforced by `lint` and `build` in both cases.
