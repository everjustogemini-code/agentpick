import { RunsClient } from "@/lib/ops/client";
import { listBenchmarkAgents, listRuns } from "@/lib/ops/data";

export default async function RunsPage() {
  const [runs, agents] = await Promise.all([listRuns({ hours: 24 }), listBenchmarkAgents()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Run History</h1>
        <p className="mt-2 text-sm text-black/60">Inspect recent benchmark executions, spot failures quickly, and drill into per-query/per-tool results.</p>
      </div>
      <RunsClient initialRuns={runs} agents={agents} />
    </div>
  );
}
