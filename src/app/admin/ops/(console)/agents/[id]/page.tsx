import { notFound } from "next/navigation";
import { AgentDetailClient } from "@/lib/ops/client";
import { getBenchmarkAgentById, listQuerySets } from "@/lib/ops/data";

export default async function AgentConfigPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [agent, querySets] = await Promise.all([getBenchmarkAgentById(id), listQuerySets()]);

  if (!agent) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{agent.displayName}</h1>
        <p className="mt-2 text-sm text-black/60">Edit identity, tools, schedules, and OpenClaw participation for this agent.</p>
      </div>
      <AgentDetailClient agent={agent} querySets={querySets} />
    </div>
  );
}
