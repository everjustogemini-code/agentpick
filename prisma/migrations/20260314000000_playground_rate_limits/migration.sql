-- CreateTable
CREATE TABLE "playground_rate_limits" (
  "ip"    TEXT NOT NULL,
  "date"  DATE NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY ("ip", "date")
);
