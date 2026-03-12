import { OpenClawClient } from "@/lib/ops/client";
import { ensureOpsSettings, listBenchmarkAgents } from "@/lib/ops/data";

export default async function OpenClawPage() {
  const [settings, agents] = await Promise.all([ensureOpsSettings(), listBenchmarkAgents()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">OpenClaw Integration</h1>
        <p className="mt-2 text-sm text-black/60">Configure monitoring exports, heartbeat cadence, and alert defaults for the benchmark fleet.</p>
      </div>
      <OpenClawClient settings={settings} agents={agents} />
    </div>
  );
}
