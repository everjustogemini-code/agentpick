import Link from "next/link";
import { getDashboardSnapshot } from "@/lib/ops/data";
import { CoverageRow, Meter, OpsCard, Panel, QuickAction, RunSummary, StatusBadge } from "@/lib/ops/ui";

export default async function OpsDashboardPage() {
  const dashboard = await getDashboardSnapshot();

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OpsCard title="Total Agents" value={dashboard.totalAgents} />
        <OpsCard title="Active Now" value={dashboard.activeAgents} />
        <OpsCard title="Paused" value={dashboard.pausedAgents} />
        <OpsCard title="Tests Today" value={dashboard.testsToday.toLocaleString()} hint={`Fleet avg success ${Math.round(dashboard.avgSuccessRate * 100)}%`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <Panel
          title="API Key Status"
          action={
            <Link href="/admin/ops/keys">
              <StatusBadge label="Open Vault" tone="neutral" />
            </Link>
          }
        >
          <div className="space-y-4">
            {dashboard.apiKeys.map((key) => {
              const usagePct = key.monthlyLimit ? Math.round((key.usedThisMonth / key.monthlyLimit) * 100) : null;
              return (
                <div key={key.id} className="grid gap-3 rounded-[22px] border p-4 md:grid-cols-[1fr_1.3fr]" style={{ borderColor: "#e8dfcb" }}>
                  <div>
                    <p className="text-sm font-medium">{key.displayName}</p>
                    <p className="mt-1 text-xs text-black/60">{key.keyPreview}</p>
                  </div>
                  <Meter value={usagePct} numerator={key.usedThisMonth} denominator={key.monthlyLimit} />
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Recent Runs">
          <div className="space-y-1">
            {dashboard.recentRuns.map((run) => (
              <RunSummary key={run.id} run={run} />
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Domain Coverage">
          <div className="space-y-1">
            {dashboard.domainCoverage.map((item) => (
              <CoverageRow key={item.domain} domain={item.domain} agents={item.agents} tests={item.tests} avgSuccessRate={item.avgSuccessRate} />
            ))}
          </div>
        </Panel>

        <Panel title="Quick Actions">
          <div className="flex flex-wrap gap-3">
            <QuickAction href="/admin/ops/agents/create" label="+ Create Agent" />
            <QuickAction href="/admin/ops/schedule" label="Schedule Settings" />
            <QuickAction href="/admin/ops/keys" label="API Keys" />
            <QuickAction href="/admin/ops/openclaw" label="OpenClaw Export" />
          </div>
        </Panel>
      </section>
    </div>
  );
}
