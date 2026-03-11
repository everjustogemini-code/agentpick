import { config } from 'dotenv';
config();
config({ path: '.env.local', override: true });
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createHash } from 'crypto';
import { BENCHMARK_AGENTS } from '../prisma/seed-data/benchmark-agents';
import { ALL_BENCHMARK_QUERIES } from '../prisma/seed-data/benchmark-queries';

function createClient() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL!;
  if (url.startsWith('prisma+postgres://')) {
    const apiKey = new URL(url).searchParams.get('api_key');
    if (apiKey) {
      const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString());
      const tcpUrl = decoded.databaseUrl as string;
      const adapter = new PrismaPg({ connectionString: tcpUrl });
      return new PrismaClient({ adapter });
    }
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

const prisma = createClient();

function hash(key: string) {
  return createHash('sha256').update(key).digest('hex');
}

async function seedBenchmarkAgents() {
  console.log('Seeding 50 benchmark agents...');
  let created = 0;
  let skipped = 0;

  for (const ba of BENCHMARK_AGENTS) {
    const apiKeyHash = hash(`benchmark-key-${ba.name}`);

    // Check if agent already exists
    const existing = await prisma.agent.findUnique({ where: { apiKeyHash } });
    if (existing) {
      // Check if benchmark agent record exists
      const existingBA = await prisma.benchmarkAgent.findUnique({ where: { agentId: existing.id } });
      if (existingBA) {
        skipped++;
        continue;
      }
      // Create benchmark agent record for existing agent
      await prisma.benchmarkAgent.create({
        data: {
          agentId: existing.id,
          domain: ba.domain,
          modelProvider: ba.modelProvider,
          modelName: ba.modelName,
          complexity: ba.complexity,
        },
      });
      created++;
      continue;
    }

    // Create base Agent
    const agent = await prisma.agent.create({
      data: {
        apiKeyHash,
        name: ba.name,
        modelFamily: ba.modelFamily,
        orchestrator: 'agentpick-benchmark',
        description: `AgentPick benchmark agent for ${ba.domain} domain using ${ba.modelName}`,
        tier: 0, // benchmark tier
        reputationScore: 0.5,
        persona: `benchmark-${ba.domain}`,
        commentStyle: 'technical',
        languages: ['en'],
      },
    });

    // Create BenchmarkAgent record
    await prisma.benchmarkAgent.create({
      data: {
        agentId: agent.id,
        domain: ba.domain,
        modelProvider: ba.modelProvider,
        modelName: ba.modelName,
        complexity: ba.complexity,
      },
    });

    created++;
  }

  console.log(`  ✓ ${created} benchmark agents created, ${skipped} skipped`);
}

async function seedBenchmarkQueries() {
  console.log(`Seeding ${ALL_BENCHMARK_QUERIES.length} benchmark queries...`);

  // Check existing count
  const existing = await prisma.benchmarkQuery.count();
  if (existing >= ALL_BENCHMARK_QUERIES.length) {
    console.log(`  ✓ Already have ${existing} queries, skipping`);
    return;
  }

  // Clear existing queries if partial
  if (existing > 0) {
    await prisma.benchmarkQuery.deleteMany();
    console.log(`  Cleared ${existing} existing queries`);
  }

  // Insert in batches
  const batchSize = 50;
  for (let i = 0; i < ALL_BENCHMARK_QUERIES.length; i += batchSize) {
    const batch = ALL_BENCHMARK_QUERIES.slice(i, i + batchSize);
    await prisma.benchmarkQuery.createMany({
      data: batch.map((q) => ({
        domain: q.domain,
        complexity: q.complexity,
        query: q.query,
        intent: q.intent,
      })),
    });
    process.stdout.write(`  ${Math.min(i + batchSize, ALL_BENCHMARK_QUERIES.length)}/${ALL_BENCHMARK_QUERIES.length}\r`);
  }

  // Verify domain distribution
  const domains = await prisma.benchmarkQuery.groupBy({
    by: ['domain'],
    _count: true,
  });
  console.log('\n  Query distribution:');
  for (const d of domains) {
    console.log(`    ${d.domain}: ${d._count}`);
  }
}

async function main() {
  console.log('═══ Benchmark Data Seeder ═══\n');
  await seedBenchmarkAgents();
  await seedBenchmarkQueries();
  console.log('\n✓ Done!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
