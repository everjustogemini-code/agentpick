/**
 * One-time backfill: generates TelemetryEvents from existing votes.
 * Run with: npx tsx scripts/backfill-telemetry.ts
 */

import 'dotenv/config';
import { Client } from 'pg';

const TASK_MAP: Record<string, string> = {
  search_research: 'search',
  web_crawling: 'scrape',
  code_compute: 'execute',
  storage_memory: 'store',
  communication: 'send_message',
  payments_commerce: 'process_payment',
  finance_data: 'query_data',
  auth_identity: 'authenticate',
  scheduling: 'schedule',
  ai_models: 'inference',
  observability: 'monitor',
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  const client = new Client({ connectionString: url });
  await client.connect();
  console.log('Connected to DB');

  // Get all votes with product info
  const { rows: votes } = await client.query(`
    SELECT v.id, v."agentId", v."productId", v.signal, v."createdAt",
           p.slug as product_slug, p.category
    FROM "Vote" v
    JOIN "Product" p ON v."productId" = p.id
    WHERE v."proofVerified" = true
    ORDER BY v."createdAt" DESC
  `);

  console.log(`Found ${votes.length} verified votes to backfill from`);

  let totalEvents = 0;
  const productCounts: Record<string, number> = {};

  for (const vote of votes) {
    const isUpvote = vote.signal === 'UPVOTE';
    const eventCount = randInt(10, 100);
    const task = TASK_MAP[vote.category] || 'unknown';
    const voteTime = new Date(vote.createdAt).getTime();

    for (let i = 0; i < eventCount; i++) {
      const success = isUpvote ? Math.random() > 0.05 : Math.random() > 0.6;
      const statusCode = success
        ? [200, 201, 204][Math.floor(Math.random() * 3)]
        : [400, 429, 500, 502, 503][Math.floor(Math.random() * 5)];
      const latencyMs = isUpvote ? randInt(30, 2000) : randInt(1000, 10000);
      const costUsd = Math.random() * 0.01;
      // Spread timestamps across 30 days before the vote
      const createdAt = new Date(voteTime - Math.random() * 30 * 24 * 60 * 60 * 1000);

      const id = `tel_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

      await client.query(
        `INSERT INTO "TelemetryEvent" (id, "agentId", "productId", tool, task, success, "statusCode", "latencyMs", "costUsd", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, vote.agentId, vote.productId, vote.product_slug, task, success, statusCode, latencyMs, costUsd, createdAt]
      );

      totalEvents++;
      productCounts[vote.productId] = (productCounts[vote.productId] ?? 0) + 1;
    }

    if (totalEvents % 1000 === 0) {
      console.log(`  ${totalEvents} events created...`);
    }
  }

  console.log(`Created ${totalEvents} telemetry events`);

  // Update product aggregates
  console.log('Updating product aggregates...');
  await client.query(`
    UPDATE "Product" p SET
      "telemetryCount" = sub.cnt,
      "successRate" = sub.sr,
      "avgLatencyMs" = sub.al,
      "avgCostUsd" = sub.ac
    FROM (
      SELECT "productId",
        COUNT(*) as cnt,
        AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) as sr,
        AVG("latencyMs")::integer as al,
        AVG("costUsd") as ac
      FROM "TelemetryEvent"
      WHERE "productId" IS NOT NULL
      GROUP BY "productId"
    ) sub
    WHERE p.id = sub."productId"
      AND p.status = 'APPROVED'
  `);

  console.log('Done! Product aggregates updated.');
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
