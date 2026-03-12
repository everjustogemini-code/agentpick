import 'dotenv/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local which has the real DATABASE_URL
dotenv.config({ path: path.resolve(__dirname, '../.env.local'), override: true });

import { seedDefaultBenchmarkAgents } from '../src/lib/ops/seed';

async function main() {
  console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
  console.log('Seeding default benchmark agents...');
  const result = await seedDefaultBenchmarkAgents();
  console.log(`Planned: ${result.planned}, Created: ${result.createdCount}`);
  console.log('Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
