-- Add BYOK storage and per-call tracking for router requests.
ALTER TABLE "DeveloperAccount"
ADD COLUMN IF NOT EXISTS "byokKeys" JSONB;

ALTER TABLE "RouterCall"
ADD COLUMN IF NOT EXISTS "byokUsed" BOOLEAN NOT NULL DEFAULT false;
