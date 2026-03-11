import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { templates } from '@/lib/outreach-templates';

export const dynamic = 'force-dynamic';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-50 text-gray-600',
  READY: 'bg-blue-50 text-blue-600',
  SENT: 'bg-yellow-50 text-yellow-600',
  OPENED: 'bg-indigo-50 text-indigo-600',
  REPLIED: 'bg-green-50 text-green-600',
  BOUNCED: 'bg-red-50 text-red-600',
};

export default async function AdminOutreachPage() {
  const [contacts, statusCounts] = await Promise.all([
    prisma.outreachContact.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { product: { select: { name: true, slug: true } } },
    }),
    prisma.outreachContact.groupBy({
      by: ['status'],
      _count: true,
    }),
  ]);

  const counts = Object.fromEntries(statusCounts.map((s) => [s.status, s._count]));

  return (
    <div className="min-h-screen bg-bg-page">
      <header className="border-b border-border-default bg-bg-page/80 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <h1 className="font-display text-xl font-bold text-text-primary">Outreach</h1>
          <div className="flex items-center gap-4">
            <Link href="/admin/badges" className="text-sm text-text-muted hover:text-text-primary">
              Badges
            </Link>
            <Link href="/admin/content" className="text-sm text-text-muted hover:text-text-primary">
              Content
            </Link>
            <Link href="/admin" className="text-sm text-text-muted hover:text-text-primary">
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Status overview */}
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {['DRAFT', 'READY', 'SENT', 'OPENED', 'REPLIED', 'BOUNCED'].map((status) => (
            <div key={status} className="rounded-lg border border-border-default bg-white p-3 text-center">
              <p className="font-mono text-lg font-bold text-text-primary">{counts[status] ?? 0}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-text-dim">{status}</p>
            </div>
          ))}
        </div>

        {/* Templates */}
        <section>
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Email Templates ({templates.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {templates.map((t) => (
              <div key={t.id} className="rounded-lg border border-border-default bg-white p-4">
                <p className="text-sm font-semibold text-text-primary">{t.name}</p>
                <p className="mt-1 text-xs text-text-muted">{t.id}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Generate emails for top products */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Contacts ({contacts.length})
            </h2>
            <form action="/api/admin/outreach/generate" method="POST">
              <button
                type="submit"
                className="rounded bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
              >
                Generate for Top Products
              </button>
            </form>
          </div>

          {contacts.length === 0 ? (
            <p className="mt-4 text-sm text-text-muted">
              No outreach contacts yet. Click &quot;Generate for Top Products&quot; to create draft emails for unclaimed top products.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-border-default bg-white px-4 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">{c.name}</span>
                      <span className="text-xs text-text-muted">{c.email}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${statusColors[c.status] ?? 'bg-gray-50 text-gray-600'}`}
                      >
                        {c.status}
                      </span>
                    </div>
                    {c.product && (
                      <p className="mt-0.5 text-xs text-text-dim">
                        {c.product.name} · {c.templateUsed ?? 'no template'} · {c.company}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {c.emailSubject && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-indigo-600 hover:underline">Preview</summary>
                        <div className="absolute right-6 z-10 mt-1 w-96 rounded-lg border border-border-default bg-white p-4 shadow-lg">
                          <p className="font-semibold text-text-primary">{c.emailSubject}</p>
                          <pre className="mt-2 whitespace-pre-wrap text-[11px] text-text-secondary">{c.emailBody}</pre>
                        </div>
                      </details>
                    )}
                    <span className="font-mono text-[10px] text-text-dim">
                      {c.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
