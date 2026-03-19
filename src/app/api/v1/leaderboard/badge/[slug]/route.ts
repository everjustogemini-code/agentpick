import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Reuse the same in-memory cache from the leaderboard route by re-computing here
// (avoids a cross-module singleton dependency; data is small and cached by the leaderboard route)

async function getToolRankAndScore(slug: string): Promise<{ rank: number; score: number } | null> {
  // Fetch all approved products with benchmark data, sorted by score desc
  const products = await prisma.product.findMany({
    where: {
      status: 'APPROVED',
      benchmarkCount: { gt: 0 },
    },
    select: {
      slug: true,
      weightedScore: true,
    },
    orderBy: { weightedScore: 'desc' },
  });

  const index = products.findIndex((p) => p.slug === slug);
  if (index === -1) return null;

  return {
    rank: index + 1,
    score: Math.round(products[index].weightedScore * 10) / 10,
  };
}

function buildSvgBadge(rank: number, score: number): string {
  const scoreStr = score.toFixed(1);
  const rightColor = rank <= 3 ? '#e05d17' : rank <= 10 ? '#4c9a2a' : '#777';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="130" height="20">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <rect rx="3" width="130" height="20" fill="#555"/>
  <rect rx="3" x="75" width="55" height="20" fill="${rightColor}"/>
  <rect x="75" width="4" height="20" fill="${rightColor}"/>
  <rect rx="3" width="130" height="20" fill="url(#s)"/>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="11">
    <text x="38" y="15" fill="#010101" fill-opacity=".3">AgentPick</text>
    <text x="38" y="14">AgentPick</text>
    <text x="102" y="15" fill="#010101" fill-opacity=".3">#${rank} · ${scoreStr}</text>
    <text x="102" y="14">#${rank} · ${scoreStr}</text>
  </g>
</svg>`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const result = await getToolRankAndScore(slug);

    if (!result) {
      const notRankedSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="130" height="20">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <rect rx="3" width="130" height="20" fill="#555"/>
  <rect rx="3" x="75" width="55" height="20" fill="#777"/>
  <rect x="75" width="4" height="20" fill="#777"/>
  <rect rx="3" width="130" height="20" fill="url(#s)"/>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="11">
    <text x="38" y="15" fill="#010101" fill-opacity=".3">AgentPick</text>
    <text x="38" y="14">AgentPick</text>
    <text x="102" y="15" fill="#010101" fill-opacity=".3">not ranked</text>
    <text x="102" y="14">not ranked</text>
  </g>
</svg>`;
      return new NextResponse(notRankedSvg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const { rank, score } = result;
    const svg = buildSvgBadge(rank, score);

    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
        'ETag': `"${slug}-${rank}-${score}"`,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error(`[badge/${slug}] error:`, err);
    return NextResponse.json(
      { error: 'internal server error' },
      {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}
