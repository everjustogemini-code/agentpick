import { runDueBenchmarkAgents } from '@/lib/ops/runner';

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
    // Pick 5 due agents per invocation. At every-30-min schedule,
    // all 50 agents cycle through within ~5 hours.
    const agents = await runDueBenchmarkAgents(5);

    return Response.json({
      ok: true,
      triggered: agents.length,
      agents: agents.map((a: any) => ({
        id: a?.id,
        displayName: a?.displayName,
        lastRunAt: a?.lastRunAt,
        lastRunSuccess: a?.lastRunSuccess,
      })),
    });
  } catch (error) {
    console.error('Benchmark cron failed:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Benchmark cron failed' },
      { status: 500 },
    );
  }
}
