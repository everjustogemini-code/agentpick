import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  const [reports, digests] = await Promise.all([
    prisma.weeklyReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.dailyDigest.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    }),
  ]);

  return (
    <div className="min-h-screen bg-bg-page">
      <header className="border-b border-border-default bg-bg-page/80 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <h1 className="font-display text-xl font-bold text-text-primary">Content Engine</h1>
          <Link href="/admin" className="text-sm text-text-muted hover:text-text-primary">
            Back to Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-10">
        {/* Weekly Reports */}
        <section>
          <h2 className="mb-4 font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Weekly Reports ({reports.length})
          </h2>
          {reports.length === 0 ? (
            <p className="text-sm text-text-muted">No reports generated yet. The weekly cron runs every Monday at midnight.</p>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-border-default bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-text-primary">{r.week}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                        r.status === 'published'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-yellow-50 text-yellow-600'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.status === 'published' && (
                      <Link
                        href={`/reports/weekly/${r.week}`}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        View
                      </Link>
                    )}
                    <form action={`/api/admin/content/publish`} method="POST">
                      <input type="hidden" name="type" value="weekly" />
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        className={`rounded px-3 py-1 text-xs font-medium ${
                          r.status === 'published'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                        disabled={r.status === 'published'}
                      >
                        {r.status === 'published' ? 'Published' : 'Publish'}
                      </button>
                    </form>
                    <span className="font-mono text-[10px] text-text-dim">
                      {r.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Twitter Drafts */}
        <section>
          <h2 className="mb-4 font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Latest Twitter Draft
          </h2>
          {reports[0]?.twitterDraft ? (
            <div className="rounded-lg border border-border-default bg-white p-4">
              <p className="whitespace-pre-wrap text-sm text-text-secondary">{reports[0].twitterDraft}</p>
              <p className="mt-2 font-mono text-[10px] text-text-dim">From: {reports[0].week}</p>
            </div>
          ) : (
            <p className="text-sm text-text-muted">No drafts available.</p>
          )}
        </section>

        {/* Daily Digests */}
        <section>
          <h2 className="mb-4 font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Daily Digests ({digests.length})
          </h2>
          {digests.length === 0 ? (
            <p className="text-sm text-text-muted">No digests generated yet. The daily cron runs at midnight.</p>
          ) : (
            <div className="space-y-2">
              {digests.map((d) => {
                const risers = d.risers as { name: string; votes: number }[];
                const stats = d.benchmarkStats as { tests_today?: number };
                const pStats = d.playgroundStats as { sessions_today?: number };
                return (
                  <div
                    key={d.id}
                    className="rounded-lg border border-border-default bg-white px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-text-primary">
                          {d.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                            d.status === 'published'
                              ? 'bg-green-50 text-green-600'
                              : 'bg-yellow-50 text-yellow-600'
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 font-mono text-[11px] text-text-dim">
                        <span>{risers.length} risers</span>
                        <span>{stats.tests_today ?? 0} benchmarks</span>
                        <span>{pStats.sessions_today ?? 0} playground</span>
                      </div>
                    </div>
                    {d.twitterDraft && (
                      <p className="mt-2 text-xs text-text-muted line-clamp-2">{d.twitterDraft}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
