import { OpsCard, Panel } from "@/lib/ops/ui";

export const dynamic = "force-dynamic";

type GrowthMetrics = {
  generatedAt: string;
  acquisition: {
    totalAgents: number;
    agentsToday: number;
    agentsThisWeek: number;
    totalRouterCalls: number;
    routerCallsToday: number;
    routerCallsThisWeek: number;
    uniqueAgentsRouting: number;
  };
  conversion: {
    paidAccounts: number;
    checkoutSessionsCreated: number | null;
    conversionRate: number;
  };
  funnel: {
    registered: number;
    made1Call: number;
    made10Calls: number;
    paid: number;
  };
  content: {
    blogPostCount: number;
    totalProducts: number;
  };
  aeoScores: Array<{
    query: string;
    score: number | null;
    notes: string;
    checkedAt: string | null;
  }>;
  growthTrend: Array<{ date: string; count: number }>;
};

async function fetchMetrics(): Promise<GrowthMetrics | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const res = await fetch(`${baseUrl}/api/v1/admin/growth-metrics`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function scoreColor(score: number | null): string {
  if (score === null) return "#999";
  if (score >= 75) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function scoreLabel(score: number | null): string {
  if (score === null) return "Not checked";
  if (score >= 75) return "Top result";
  if (score >= 40) return "Page 2";
  return "Not found";
}

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums">
          {value.toLocaleString()} <span className="text-black/40">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-black/10">
        <div
          className="h-2 rounded-full bg-black/70 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function GrowthDashboardPage() {
  const data = await fetchMetrics();

  if (!data) {
    return (
      <div className="p-8 text-center text-black/50">
        Failed to load growth metrics. Check that the API is running.
      </div>
    );
  }

  const { acquisition, conversion, funnel, content, aeoScores, growthTrend, generatedAt } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Growth Metrics</h1>
          <p className="mt-1 text-sm text-black/50">
            AEO &amp; acquisition dashboard — updated {new Date(generatedAt).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Big Numbers */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OpsCard title="Total Agents" value={acquisition.totalAgents.toLocaleString()} />
        <OpsCard
          title="Agents This Week"
          value={acquisition.agentsThisWeek.toLocaleString()}
          hint={`${acquisition.agentsToday} today`}
        />
        <OpsCard
          title="Router Calls Today"
          value={acquisition.routerCallsToday.toLocaleString()}
          hint={`${acquisition.routerCallsThisWeek} this week`}
        />
        <OpsCard
          title="Paid Accounts"
          value={conversion.paidAccounts.toLocaleString()}
          hint={`${conversion.conversionRate.toFixed(1)}% conversion`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {/* Conversion Funnel */}
        <Panel title="Conversion Funnel">
          <div className="space-y-4 py-2">
            <FunnelBar label="Registered" value={funnel.registered} max={funnel.registered} />
            <FunnelBar label="Made 1+ Call" value={funnel.made1Call} max={funnel.registered} />
            <FunnelBar label="Made 10+ Calls" value={funnel.made10Calls} max={funnel.registered} />
            <FunnelBar label="Paid" value={funnel.paid} max={funnel.registered} />
          </div>
        </Panel>

        {/* Content & Reach */}
        <Panel title="Content &amp; Reach">
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-3">
              <span className="text-sm font-medium">Blog Posts</span>
              <span className="text-2xl font-semibold tabular-nums">{content.blogPostCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-3">
              <span className="text-sm font-medium">Products Listed</span>
              <span className="text-2xl font-semibold tabular-nums">{content.totalProducts}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-3">
              <span className="text-sm font-medium">Unique Routing Agents</span>
              <span className="text-2xl font-semibold tabular-nums">
                {acquisition.uniqueAgentsRouting}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-3">
              <span className="text-sm font-medium">Total Router Calls</span>
              <span className="text-2xl font-semibold tabular-nums">
                {acquisition.totalRouterCalls.toLocaleString()}
              </span>
            </div>
          </div>
        </Panel>
      </section>

      {/* AEO Scores */}
      <Panel title="AEO Scores — Search Visibility">
        <div className="py-2">
          <p className="mb-4 text-xs text-black/50">
            Score: 0 = not found, 50 = page 2, 100 = top 3 result. Update via{" "}
            <code className="rounded bg-black/5 px-1 py-0.5 text-xs">
              POST /api/v1/admin/growth-metrics/aeo-score
            </code>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left text-xs text-black/50">
                  <th className="pb-2 pr-4 font-medium">Query</th>
                  <th className="pb-2 pr-4 font-medium">Score</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Last Checked</th>
                </tr>
              </thead>
              <tbody>
                {aeoScores.map((row) => (
                  <tr key={row.query} className="border-b border-black/5 last:border-0">
                    <td className="py-3 pr-4 font-medium">&ldquo;{row.query}&rdquo;</td>
                    <td className="py-3 pr-4">
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                        style={{ background: scoreColor(row.score) }}
                      >
                        {row.score ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-black/60">{scoreLabel(row.score)}</td>
                    <td className="py-3 text-black/40 text-xs">
                      {row.checkedAt ? new Date(row.checkedAt).toLocaleDateString() : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>

      {/* Growth Trend */}
      <Panel title="New Agents — Last 30 Days">
        <div className="py-2">
          {growthTrend.length === 0 ? (
            <p className="text-sm text-black/40">No data yet.</p>
          ) : (
            <div className="space-y-1">
              {/* Find max for bar scaling */}
              {(() => {
                const maxCount = Math.max(...growthTrend.map((d) => d.count), 1);
                return growthTrend.map((day) => (
                  <div key={day.date} className="flex items-center gap-3 text-xs">
                    <span className="w-20 shrink-0 text-black/50 tabular-nums">{day.date}</span>
                    <div className="flex flex-1 items-center gap-2">
                      <div className="h-4 flex-1 rounded bg-black/5">
                        <div
                          className="h-4 rounded bg-black/60 transition-all"
                          style={{
                            width: `${Math.round((day.count / maxCount) * 100)}%`,
                            minWidth: day.count > 0 ? "4px" : "0",
                          }}
                        />
                      </div>
                      <span className="w-6 shrink-0 text-right tabular-nums text-black/70">
                        {day.count}
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
