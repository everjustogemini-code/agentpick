import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BROWSE_STATUSES } from '@/lib/product-status';

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const CATEGORY_LABELS: Record<string, string> = {
  api: 'APIs',
  mcp: 'MCP',
  skill: 'Skills',
  data: 'Data',
  infra: 'Infra',
  platform: 'Platforms',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  let { slug } = await params;
  if (slug.endsWith('.svg')) slug = slug.slice(0, -4);

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      weightedScore: true,
      totalVotes: true,
      category: true,
      status: true,
    },
  });

  if (!product || !BROWSE_STATUSES.includes(product.status)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="28" viewBox="0 0 200 28">
  <rect width="200" height="28" rx="4" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="1"/>
  <text x="100" y="18" fill="#64748B" font-family="monospace" font-size="11" text-anchor="middle">agentpick | not found</text>
</svg>`;
    return new Response(svg, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, s-maxage=60' },
    });
  }

  // Get rank within category
  const rank = await prisma.product.count({
    where: {
      status: { in: BROWSE_STATUSES },
      category: product.category,
      weightedScore: { gt: product.weightedScore },
    },
  }) + 1;

  const score = product.weightedScore.toFixed(1);
  const votes = fmt(product.totalVotes);
  const name = escapeXml(product.name);
  const catLabel = CATEGORY_LABELS[product.category] ?? product.category;
  const rankLabel = `#${rank} in ${catLabel}`;

  // Dynamic widths
  const logoW = 88;
  const scoreW = 40;
  const rankW = rankLabel.length * 6.6 + 16;
  const votesW = (votes.length + 6) * 6.6 + 16;
  const totalW = Math.ceil(logoW + scoreW + rankW + votesW);
  const h = 28;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${h}" viewBox="0 0 ${totalW} ${h}">
  <title>AgentPick: ${name} — ${score} score, ${rankLabel}, ${votes} votes</title>
  <rect width="${totalW}" height="${h}" rx="4" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
  <line x1="${logoW}" y1="4" x2="${logoW}" y2="${h - 4}" stroke="#E2E8F0" stroke-width="1"/>
  <line x1="${logoW + scoreW}" y1="4" x2="${logoW + scoreW}" y2="${h - 4}" stroke="#E2E8F0" stroke-width="1"/>
  <line x1="${logoW + scoreW + rankW}" y1="4" x2="${logoW + scoreW + rankW}" y2="${h - 4}" stroke="#E2E8F0" stroke-width="1"/>
  <g font-family="'IBM Plex Mono','Menlo','Monaco',monospace" font-size="11">
    <text x="10" y="18" fill="#0F172A" font-weight="700">&#x2B21; agentpick</text>
    <text x="${logoW + 8}" y="18" fill="#10B981" font-weight="700">${score}</text>
    <text x="${logoW + scoreW + 8}" y="18" fill="#475569" font-weight="500">${escapeXml(rankLabel)}</text>
    <text x="${logoW + scoreW + rankW + 8}" y="18" fill="#94A3B8">${votes} votes</text>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
