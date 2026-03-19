-- Add source field to RouterCall to distinguish MCP-sourced calls from direct API calls.
ALTER TABLE "RouterCall" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'router';
