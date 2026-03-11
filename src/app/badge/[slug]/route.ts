import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Strip .svg extension if present
  let { slug } = await params;
  if (slug.endsWith('.svg')) {
    slug = slug.slice(0, -4);
  }

  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      weightedScore: true,
      totalVotes: true,
      status: true,
    },
  });

  if (!product || product.status !== 'APPROVED') {
    // Return a "not found" badge
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="20" viewBox="0 0 200 20">
  <rect width="200" height="20" rx="3" fill="#E2E8F0"/>
  <text x="100" y="13" fill="#64748B" font-family="monospace" font-size="11" text-anchor="middle">agentpick | not found</text>
</svg>`;
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, s-maxage=60',
      },
    });
  }

  const score = product.weightedScore.toFixed(1);
  const votes = fmt(product.totalVotes);
  const name = escapeXml(product.name);

  // Calculate widths for each section
  const logoSectionW = 90; // "⬡ agentpick"
  const scoreSectionW = 70; // "score 9.4"
  const votesSectionW = 80; // "12.8K votes"
  const totalW = logoSectionW + scoreSectionW + votesSectionW;
  const h = 20;
  const r = 3;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalW}" height="${h}" viewBox="0 0 ${totalW} ${h}">
  <title>AgentPick score for ${name}</title>
  <!-- Background -->
  <rect width="${totalW}" height="${h}" rx="${r}" fill="#0F172A"/>
  <!-- Logo section -->
  <rect width="${logoSectionW}" height="${h}" rx="${r}" fill="#0F172A"/>
  <!-- Score section -->
  <rect x="${logoSectionW}" width="${scoreSectionW}" height="${h}" fill="#1E293B"/>
  <!-- Votes section -->
  <rect x="${logoSectionW + scoreSectionW}" width="${votesSectionW}" height="${h}" rx="${r}" fill="#334155"/>
  <!-- Fix corner overlap -->
  <rect x="${logoSectionW + scoreSectionW}" width="${r}" height="${h}" fill="#334155"/>
  <rect x="${logoSectionW}" width="${r}" height="${h}" fill="#1E293B"/>
  <!-- Text -->
  <g font-family="'IBM Plex Mono','Menlo','Monaco',monospace" font-size="11">
    <text x="8" y="14" fill="#94A3B8">&#x2B21;</text>
    <text x="22" y="14" fill="#E2E8F0" font-weight="600">agentpick</text>
    <text x="${logoSectionW + 6}" y="14" fill="#94A3B8">score</text>
    <text x="${logoSectionW + 40}" y="14" fill="#10B981" font-weight="700">${score}</text>
    <text x="${logoSectionW + scoreSectionW + 6}" y="14" fill="#CBD5E1" font-weight="600">${votes}</text>
    <text x="${logoSectionW + scoreSectionW + 6 + votes.length * 6.6 + 4}" y="14" fill="#94A3B8">votes</text>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  });
}
