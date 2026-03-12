# AgentPick Ops Merge Notes

This module is designed to be copied into an existing Next.js App Router project.

## Copy Targets

- `app/admin/ops/*`
- `app/api/admin/ops/*`
- `src/lib/ops/*`
- `prisma/schema.prisma` additions

## Required Env Vars

- `ADMIN_PASSWORD`
- `OPS_SESSION_SECRET` (recommended)
- `OPS_ENCRYPTION_KEY` (recommended)

## Merge Steps

1. Append the Prisma models from [schema.prisma](/Users/pwclaw/Documents/Playground/prisma/schema.prisma) into the main project's existing Prisma schema.
2. Create a Prisma migration in the main project and run `prisma generate`.
3. Copy the `app/admin/ops`, `app/api/admin/ops`, and `src/lib/ops` trees into the main app.
4. Wire the existing `/api/cron/benchmark-run` route to call `buildCronAdapterPayload` or `runDueBenchmarkAgents` from [runner.ts](/Users/pwclaw/Documents/Playground/src/lib/ops/runner.ts).
5. Review [agent-adapter.ts](/Users/pwclaw/Documents/Playground/src/lib/ops/agent-adapter.ts) against the existing `Agent` model if that schema differs from the common `name/slug/description` pattern.

## Notes

- The benchmark runner in this module is self-contained and stores `BenchmarkAgentRun` rows, but it does not modify an existing non-ops cron route directly.
- `BenchmarkOpsSettings` was added as a singleton model so the schedule and OpenClaw screens can persist global ops settings cleanly.
- Vault keys are encrypted before storage and resolved automatically when agent configs are saved.
