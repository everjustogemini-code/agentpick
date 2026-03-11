import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-50 text-gray-600',
  running: 'bg-blue-50 text-blue-600',
  paused: 'bg-yellow-50 text-yellow-600',
  completed: 'bg-green-50 text-green-600',
  failed: 'bg-red-50 text-red-600',
};

export default async function AdminCampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      _count: { select: { actions: true } },
    },
  });

  return (
    <div className="min-h-screen bg-bg-page">
      <header className="border-b border-border-default bg-bg-page/80 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <h1 className="font-display text-xl font-bold text-text-primary">Campaigns</h1>
          <div className="flex items-center gap-4">
            <Link href="/admin/agents" className="text-sm text-text-muted hover:text-text-primary">
              Agents
            </Link>
            <Link href="/admin" className="text-sm text-text-muted hover:text-text-primary">
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Create campaign */}
        <div className="rounded-lg border border-border-default bg-white p-6">
          <h2 className="mb-4 font-mono text-[10px] uppercase tracking-wider text-text-dim">
            New Campaign
          </h2>
          <form action="/api/admin/campaigns/create" method="POST" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-text-primary">Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="mt-1 w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm"
                  placeholder="Q1 Badge Outreach"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary">Type</label>
                <select
                  name="type"
                  className="mt-1 w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm"
                >
                  <option value="badge_outreach">Badge Outreach</option>
                  <option value="twitter_draft">Twitter Drafts</option>
                  <option value="benchmark_notify">Benchmark Notifications</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary">Batch Size</label>
                <input
                  type="number"
                  name="batchSize"
                  defaultValue={10}
                  className="mt-1 w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="rounded bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              Create Campaign
            </button>
          </form>
        </div>

        {/* Campaign list */}
        <div>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-text-dim">
            All Campaigns ({campaigns.length})
          </h2>
          {campaigns.length === 0 ? (
            <p className="text-sm text-text-muted">No campaigns created yet.</p>
          ) : (
            <div className="space-y-2">
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-border-default bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-text-primary">{c.name}</span>
                    <span className="font-mono text-[10px] text-text-dim">{c.type}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${statusColors[c.status] ?? 'bg-gray-50 text-gray-600'}`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 font-mono text-[11px] text-text-dim">
                    <span>{c._count.actions} actions</span>
                    <span>
                      {c.successCount}/{c.totalActions} success
                    </span>
                    <span>batch: {c.batchSize}</span>
                    <span>{c.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
