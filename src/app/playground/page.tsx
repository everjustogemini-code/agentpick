import { prisma } from '@/lib/prisma';
import { Suspense } from 'react';
import PlaygroundClient from '@/components/PlaygroundClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Playground — Test API Tools — AgentPick',
  description:
    'Compare search and crawling APIs with real queries. Watch results stream in real-time. Results contribute to AgentPick rankings.',
};

// Scenario cards with emoji + labels
const SCENARIOS = [
  { value: 'finance', label: 'Finance Research', emoji: '📊' },
  { value: 'legal', label: 'Legal Research', emoji: '⚖️' },
  { value: 'ecommerce', label: 'Commerce Agent', emoji: '🛒' },
  { value: 'devtools', label: 'DevTools Agent', emoji: '💻' },
  { value: 'news', label: 'News Agent', emoji: '📰' },
  { value: 'science', label: 'Science Research', emoji: '🔬' },
  { value: 'education', label: 'Education Agent', emoji: '🎓' },
  { value: 'general', label: 'General Purpose', emoji: '⚙️' },
];

async function getPrefilledQueries(): Promise<Record<string, string[]>> {
  const queries = await prisma.benchmarkQuery.findMany({
    where: { isActive: true },
    select: { domain: true, query: true, complexity: true },
    orderBy: { complexity: 'asc' },
  });

  const grouped: Record<string, string[]> = {};
  for (const q of queries) {
    if (!grouped[q.domain]) grouped[q.domain] = [];
    if (grouped[q.domain].length < 3) {
      grouped[q.domain].push(q.query);
    }
  }

  return grouped;
}

async function getAvailableTools(): Promise<
  { slug: string; name: string; costPerCall: string }[]
> {
  const products = await prisma.product.findMany({
    where: {
      slug: {
        in: [
          'tavily',
          'exa-search',
          'serper-api',
          'brave-search',
          'jina-reader',
          'firecrawl-api',
        ],
      },
      status: 'APPROVED',
    },
    select: { slug: true, name: true },
    orderBy: { weightedScore: 'desc' },
  });

  const costMap: Record<string, string> = {
    tavily: '$0.001/call',
    'exa-search': '$0.002/call',
    'serper-api': '$0.0005/call',
    'brave-search': 'Free tier',
    'jina-reader': 'Free tier',
    'firecrawl-api': '$0.003/call',
  };

  return products.map((p) => ({
    slug: p.slug,
    name: p.name,
    costPerCall: costMap[p.slug] ?? 'Unknown',
  }));
}

export default async function PlaygroundPage() {
  const [prefilledQueries, availableTools] = await Promise.all([
    getPrefilledQueries(),
    getAvailableTools(),
  ]);

  return (
    <Suspense>
      <PlaygroundClient
        scenarios={SCENARIOS}
        prefilledQueries={prefilledQueries}
        availableTools={availableTools}
      />
    </Suspense>
  );
}
