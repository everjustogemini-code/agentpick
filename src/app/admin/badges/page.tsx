import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminBadgesPage() {
  const products = await prisma.product.findMany({
    where: { status: 'APPROVED' },
    orderBy: { weightedScore: 'desc' },
    take: 30,
    select: { name: true, slug: true, totalVotes: true, weightedScore: true, isClaimed: true },
  });

  return (
    <div className="min-h-screen bg-bg-page">
      <header className="border-b border-border-default bg-bg-page/80 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <h1 className="font-display text-xl font-bold text-text-primary">Badges</h1>
          <div className="flex items-center gap-4">
            <Link href="/admin/outreach" className="text-sm text-text-muted hover:text-text-primary">
              Outreach
            </Link>
            <Link href="/admin" className="text-sm text-text-muted hover:text-text-primary">
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <section>
          <h2 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">
            Badge Embed Code
          </h2>
          <p className="mb-6 text-sm text-text-muted">
            Each approved product has an embeddable SVG badge. Share embed snippets with makers.
          </p>

          <div className="space-y-3">
            {products.map((p) => {
              const badgeUrl = `https://agentpick.dev/badges/${p.slug}.svg`;
              const embedHtml = `<a href="https://agentpick.dev/products/${p.slug}"><img src="${badgeUrl}" alt="AgentPick Verified" /></a>`;
              const embedMd = `[![AgentPick Verified](${badgeUrl})](https://agentpick.dev/products/${p.slug})`;

              return (
                <div
                  key={p.slug}
                  className="rounded-lg border border-border-default bg-white px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/products/${p.slug}`}
                        className="text-sm font-semibold text-text-primary hover:underline"
                      >
                        {p.name}
                      </Link>
                      <span className="font-mono text-[10px] text-text-dim">
                        {p.totalVotes} votes · {p.weightedScore.toFixed(1)} score
                      </span>
                      {p.isClaimed && (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-green-600">
                          CLAIMED
                        </span>
                      )}
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/badges/${p.slug}.svg`} alt="badge preview" className="h-5" />
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-indigo-600 hover:underline">
                      Embed code
                    </summary>
                    <div className="mt-2 space-y-2">
                      <div>
                        <p className="font-mono text-[10px] text-text-dim">HTML</p>
                        <code className="block rounded bg-gray-50 p-2 text-[11px] text-text-secondary break-all">
                          {embedHtml}
                        </code>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] text-text-dim">Markdown</p>
                        <code className="block rounded bg-gray-50 p-2 text-[11px] text-text-secondary break-all">
                          {embedMd}
                        </code>
                      </div>
                    </div>
                  </details>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
