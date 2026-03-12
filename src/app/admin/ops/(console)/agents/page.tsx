import Link from "next/link";
import { AgentsTableClient, SeedFleetButton } from "@/lib/ops/client";
import { listBenchmarkAgents } from "@/lib/ops/data";
import { Panel } from "@/lib/ops/ui";

export default async function OpsAgentsPage() {
  const agents = await listBenchmarkAgents();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Agent Fleet</h1>
          <p className="mt-2 text-sm text-black/60">Filter, inspect, and operate benchmark agents across every domain.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SeedFleetButton />
          <Link href="/admin/ops/agents/create" className="rounded-full border border-black px-4 py-2 text-sm font-medium">
            + Create Agent
          </Link>
        </div>
      </div>

      <Panel title="Fleet Inventory">
        <AgentsTableClient agents={agents} />
      </Panel>
    </div>
  );
}
