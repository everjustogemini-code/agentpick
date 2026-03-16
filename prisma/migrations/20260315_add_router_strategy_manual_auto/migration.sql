-- Add MANUAL and AUTO to RouterStrategy enum.
-- These values are referenced by ensureDeveloperAccount (strategy: 'AUTO' default)
-- and recordRouterCall (strategyUsed='AUTO'/'MANUAL'). Without them the RouterCall
-- INSERT fails with an invalid-enum-value DB error, silently swallowed by handler.ts,
-- causing ALL calls from new accounts (which default to AUTO strategy) to not be
-- persisted. totalCalls stays 0 and /api/v1/router/calls returns [].
ALTER TYPE "RouterStrategy" ADD VALUE IF NOT EXISTS 'MANUAL';
ALTER TYPE "RouterStrategy" ADD VALUE IF NOT EXISTS 'AUTO';
