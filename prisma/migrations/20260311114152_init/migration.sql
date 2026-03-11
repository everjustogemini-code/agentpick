-- CreateEnum
CREATE TYPE "Category" AS ENUM ('api', 'mcp', 'skill', 'data', 'infra');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VoteSignal" AS ENUM ('UPVOTE', 'DOWNVOTE');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" VARCHAR(80) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "category" "Category" NOT NULL,
    "logoUrl" TEXT,
    "websiteUrl" TEXT NOT NULL,
    "docsUrl" TEXT,
    "apiBaseUrl" TEXT,
    "tags" TEXT[],
    "status" "ProductStatus" NOT NULL DEFAULT 'PENDING',
    "totalVotes" INTEGER NOT NULL DEFAULT 0,
    "weightedScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uniqueAgents" INTEGER NOT NULL DEFAULT 0,
    "submittedBy" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "featuredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "modelFamily" TEXT,
    "orchestrator" TEXT,
    "ownerEmail" TEXT,
    "description" TEXT,
    "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "totalVotes" INTEGER NOT NULL DEFAULT 0,
    "verifiedVotes" INTEGER NOT NULL DEFAULT 0,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orchestratorId" TEXT,
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "proofHash" TEXT NOT NULL,
    "proofVerified" BOOLEAN NOT NULL DEFAULT false,
    "proofDetails" JSONB,
    "rawWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "reputationMult" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "diversityMult" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "finalWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "signal" "VoteSignal" NOT NULL DEFAULT 'UPVOTE',
    "comment" VARCHAR(500),
    "commentSentiment" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_category_weightedScore_idx" ON "Product"("category", "weightedScore" DESC);

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_featuredAt_idx" ON "Product"("featuredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_apiKeyHash_key" ON "Agent"("apiKeyHash");

-- CreateIndex
CREATE INDEX "Agent_orchestratorId_idx" ON "Agent"("orchestratorId");

-- CreateIndex
CREATE INDEX "Agent_reputationScore_idx" ON "Agent"("reputationScore" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Vote_proofHash_key" ON "Vote"("proofHash");

-- CreateIndex
CREATE INDEX "Vote_productId_finalWeight_idx" ON "Vote"("productId", "finalWeight" DESC);

-- CreateIndex
CREATE INDEX "Vote_agentId_idx" ON "Vote"("agentId");

-- CreateIndex
CREATE INDEX "Vote_createdAt_idx" ON "Vote"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_productId_agentId_key" ON "Vote"("productId", "agentId");

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
