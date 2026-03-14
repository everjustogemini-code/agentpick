import { runDueBenchmarkAgents, runBatchBenchmark } from '@/lib/ops/runner';

export const maxDuration = 55; // Vercel cron has 60s timeout; keep under

function verifySecret(request: Request) {
  const auth = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    throw new Error('Unauthorized');
  }
}

export async function GET(request: Request) {
  try {
    verifySecret(request);
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Primary: run one batch across all eligible tools for a rotating domain.
    // Target: 3 batch runs per hour (cron every 20 min, 1 batch per invocation).
    const batch = await runBatchBenchmark();

    return Response.json({
      ok: true,
      batch: {
        batchId: batch.batchId,
        domain: batch.domain,
        query: batch.query,
        toolsRun: batch.toolsRun,
        results: batch.results,
      },
    });
  } catch (error) {
    console.error('Benchmark cron failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Benchmark cron failed' },
      { status: 500 },
    );
  }
}
