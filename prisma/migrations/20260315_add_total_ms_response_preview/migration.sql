-- Add totalMs (end-to-end wall-clock time) and responsePreview (500-char truncated tool response)
-- to RouterCall for the Request Inspector drawer (NEXT_VERSION v0.69).
ALTER TABLE "RouterCall" ADD COLUMN IF NOT EXISTS "totalMs" INTEGER;
ALTER TABLE "RouterCall" ADD COLUMN IF NOT EXISTS "responsePreview" TEXT;
