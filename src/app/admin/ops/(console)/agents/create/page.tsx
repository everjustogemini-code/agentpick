import { CreateAgentWizard } from "@/lib/ops/client";
import { listQuerySets } from "@/lib/ops/data";
import { Panel } from "@/lib/ops/ui";

export default async function CreateBenchmarkAgentPage() {
  const querySets = await listQuerySets();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Create Benchmark Agent</h1>
        <p className="mt-2 text-sm text-black/60">Follow the same five-step flow from the spec, with vault-backed tool and model keys resolved automatically.</p>
      </div>
      <Panel title="Create Wizard">
        <CreateAgentWizard querySets={querySets} />
      </Panel>
    </div>
  );
}
