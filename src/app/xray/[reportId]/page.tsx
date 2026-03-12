import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ reportId: string }>;
}

interface DetectedTool {
  name: string;
  slug: string | null;
  category: string | null;
  rank: number | null;
  score: number | null;
}

interface Issue {
  severity: string;
  title: string;
  description: string;
  impact: string;
}

interface Recommendation {
  from: string;
  to: string | null;
  toSlug: string | null;
  improvement: string;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { reportId } = await params;
  const report = await prisma.xrayReport.findUnique({
    where: { id: reportId },
    select: { healthScore: true, detectedTools: true },
  });
  if (!report) return { title: 'Not Found' };

  const tools = report.detectedTools as unknown as DetectedTool[];
  const toolNames = tools.map(t => t.name).join(', ');

  return {
    title: `X-Ray Report: ${report.healthScore}/10 — AgentPick`,
    description: `Agent stack diagnosis: ${toolNames}. Health score: ${report.healthScore}/10. See issues and recommendations.`,
  };
}

export default async function XrayReportPage({ params }: Props) {
  const { reportId } = await params;

  const report = await prisma.xrayReport.findUnique({
    where: { id: reportId },
  });

  if (!report) notFound();

  const tools = report.detectedTools as unknown as DetectedTool[];
  const issues = report.issues as unknown as Issue[];
  const recommendations = report.recommendations as unknown as Recommendation[];
  const scoreColor = report.healthScore >= 7 ? '#22C55E' : report.healthScore >= 4 ? '#F59E0B' : '#EF4444';

  const toolSlugs = tools.filter(t => t.slug).map(t => t.slug).join(',');

  return (
    <div className="min-h-screen bg-bg-page">
      <header className="sticky top-0 z-50 border-b border-border-default bg-bg-page/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[960px] items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-button-primary-bg font-mono text-sm font-bold text-white">
              &#x2B21;
            </div>
            <span className="text-[17px] font-bold tracking-tight text-text-primary">
              agentpick
            </span>
          </Link>
          <Link
            href="/xray"
            className="rounded-lg bg-button-primary-bg px-4 py-[7px] text-[13px] font-semibold text-button-primary-text"
          >
            New X-Ray
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[880px] px-6 py-8">
        {/* Health Score Header */}
        <div className="mb-8 text-center">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-[2px] text-text-dim">
            X-Ray Report
          </div>
          <div className="font-mono text-[56px] font-bold leading-none" style={{ color: scoreColor }}>
            {report.healthScore.toFixed(1)}
          </div>
          <div className="mt-1 font-mono text-sm text-text-dim">/ 10 health score</div>
          <div className="mt-3 text-[13px] text-text-muted">
            {tools.length} tools detected &middot; {report.framework ?? 'No framework'} &middot; {report.inferredDomain ?? 'general'}
          </div>
        </div>

        {/* Detected Tools */}
        <div className="mb-8 rounded-xl border border-border-default bg-white p-5">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
            Detected Tools
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool, i) => (
              <div key={i} className="rounded-lg border border-border-default bg-bg-page p-3">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-green-600">&#x2713;</span>
                  <span className="text-[13px] font-semibold text-text-primary">{tool.name}</span>
                </div>
                {tool.category && (
                  <div className="mt-1 font-mono text-[10px] text-text-dim capitalize">
                    {tool.category.replace('_', ' ')}
                  </div>
                )}
                {tool.rank !== null ? (
                  <div className="mt-0.5 font-mono text-[10px] text-text-dim">
                    #{tool.rank} &middot; {tool.score?.toFixed(1)}/10
                  </div>
                ) : (
                  <div className="mt-0.5 font-mono text-[10px] text-text-dim">Not ranked</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Issues */}
        {issues.length > 0 && (
          <div className="mb-8 rounded-xl border border-border-default bg-white p-5">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
              Issues
            </div>
            <div className="space-y-3">
              {issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-lg bg-bg-page p-3">
                  <span className="mt-0.5 text-[13px]">
                    {issue.severity === 'high' ? '\u{1F534}' : issue.severity === 'medium' ? '\u26A0\uFE0F' : '\u{1F4A1}'}
                  </span>
                  <div>
                    <div className="text-[13px] font-medium text-text-primary">{issue.title}</div>
                    <div className="mt-0.5 text-[12px] text-text-secondary">{issue.description}</div>
                    <div className="mt-1 font-mono text-[10px] text-text-dim">Impact: {issue.impact}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-8 rounded-xl border border-border-default bg-white p-5">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
              Recommendations
            </div>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-bg-page p-3">
                  <span className="font-mono text-[14px] font-bold text-text-dim">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="text-[13px] text-text-primary">
                      <span className="text-text-dim">{rec.from}</span>
                      {rec.to && (
                        <>
                          <span className="mx-1.5 text-text-dim">&rarr;</span>
                          {rec.toSlug ? (
                            <Link href={`/products/${rec.toSlug}`} className="font-semibold text-button-primary-bg hover:underline">
                              {rec.to}
                            </Link>
                          ) : (
                            <span className="font-semibold">{rec.to}</span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-green-600">{rec.improvement}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/arena?tools=${toolSlugs}&scenario=${report.inferredDomain}`}
            className="rounded-lg bg-button-primary-bg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Verify in Arena
          </Link>
          <Link
            href="/xray"
            className="rounded-lg border border-border-default bg-white px-5 py-2.5 text-sm font-semibold text-text-primary hover:border-border-hover"
          >
            New X-Ray
          </Link>
        </div>
      </main>
    </div>
  );
}
