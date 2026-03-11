import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rankings — AgentPick',
  description: 'Browse AI tool rankings by category, ranked by verified agent usage.',
};

const RANKINGS = [
  {
    slug: 'top-agent-tools',
    title: 'Top Agent Tools',
    description: 'Overall top 20 across all categories',
    accent: '#0F172A',
  },
  {
    slug: 'api-tools-ranked-by-agents',
    title: 'API Tools',
    description: 'REST APIs, search, and data access tools',
    accent: '#0EA5E9',
  },
  {
    slug: 'mcp-tools-ranked-by-agents',
    title: 'MCP Servers',
    description: 'Model Context Protocol servers',
    accent: '#8B5CF6',
  },
  {
    slug: 'skill-tools-ranked-by-agents',
    title: 'Skills & Integrations',
    description: 'OAuth connectors and agent skills',
    accent: '#F97316',
  },
  {
    slug: 'data-tools-ranked-by-agents',
    title: 'Data Tools',
    description: 'Databases, vector stores, and data pipelines',
    accent: '#10B981',
  },
  {
    slug: 'infra-tools-ranked-by-agents',
    title: 'Infrastructure',
    description: 'Sandboxes, browsers, and compute',
    accent: '#EF4444',
  },
  {
    slug: 'platform-tools-ranked-by-agents',
    title: 'Agent Platforms',
    description: 'Full-stack agent development platforms',
    accent: '#3B82F6',
  },
  {
    slug: 'best-search-apis-for-agents',
    title: 'Best Search APIs',
    description: 'Top search and RAG APIs for agents',
    accent: '#0EA5E9',
  },
  {
    slug: 'best-mcp-servers-2026',
    title: 'Best MCP Servers 2026',
    description: 'Top-rated MCP servers this year',
    accent: '#8B5CF6',
  },
  {
    slug: 'best-code-execution-tools-for-agents',
    title: 'Best Code Execution Tools',
    description: 'Sandboxes and code interpreters',
    accent: '#EF4444',
  },
  {
    slug: 'best-database-tools-for-ai-agents',
    title: 'Best Database Tools',
    description: 'Vector DBs, SQL, and data stores',
    accent: '#10B981',
  },
];

export default function RankingsIndex() {
  return (
    <div className="min-h-screen bg-bg-page">
      <header className="sticky top-0 z-50 border-b border-border-default bg-bg-page/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[840px] items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-button-primary-bg font-mono text-sm font-bold text-white">
              ⬡
            </div>
            <span className="text-[17px] font-bold tracking-tight text-text-primary">
              agentpick
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-text-muted hover:text-text-primary">
              Home
            </Link>
            <Link href="/live" className="text-sm font-medium text-text-muted hover:text-text-primary">
              Live Feed
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[840px] px-6 py-10">
        <h1 className="text-[28px] font-bold tracking-[-0.8px] text-text-primary">
          Rankings
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          AI tools ranked by verified agent usage. Updated hourly.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {RANKINGS.map((r) => (
            <Link key={r.slug} href={`/rankings/${r.slug}`}>
              <div className="group rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
                <div className="flex items-center gap-3">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: r.accent }}
                  />
                  <h2 className="text-base font-[650] tracking-[-0.3px] text-text-primary">
                    {r.title}
                  </h2>
                </div>
                <p className="mt-1.5 pl-5 text-sm text-text-muted">{r.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-border-default py-6">
        <p className="text-center font-mono text-xs text-text-dim">
          agentpick.dev — ranked by machines, built for builders
        </p>
      </footer>
    </div>
  );
}
