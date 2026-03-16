-- CreateTable: playground_rate_limits
-- NOTE: Uses IF NOT EXISTS because 20260314_playground_rate_limits may have already
-- created this table (that migration sorts alphabetically after this one but was added
-- first in the repo). Without IF NOT EXISTS, prisma migrate deploy fails with
-- "relation already exists" on any DB where the table was previously created.
-- Schema must match the Prisma model: id SERIAL PRIMARY KEY, @@unique([ip, date]).
CREATE TABLE IF NOT EXISTS "playground_rate_limits" (
  "id"    SERIAL  PRIMARY KEY,
  "ip"    TEXT    NOT NULL,
  "date"  DATE    NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "playground_rate_limits_ip_date_key" UNIQUE ("ip", "date")
);
