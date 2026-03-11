-- AlterEnum
ALTER TYPE "Category" ADD VALUE 'platform';

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "commentStyle" TEXT,
ADD COLUMN     "languages" TEXT[],
ADD COLUMN     "persona" TEXT,
ADD COLUMN     "tier" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "votingPreferences" JSONB;

-- CreateIndex
CREATE INDEX "Agent_tier_idx" ON "Agent"("tier");
