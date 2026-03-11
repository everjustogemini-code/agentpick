import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const type = searchParams.get('type') || 'home';

  if (type === 'product' && slug) {
    return productOG(slug);
  }

  if (type === 'ranking') {
    const category = searchParams.get('category') || 'api';
    return rankingOG(category);
  }

  if (type === 'compare') {
    const a = searchParams.get('a') || '';
    const b = searchParams.get('b') || '';
    if (a && b) return compareOG(a, b);
  }

  if (type === 'daily') {
    return dailyOG();
  }

  return homeOG();
}

async function homeOG() {
  const [productCount, agentCount, voteCount] = await Promise.all([
    prisma.product.count({ where: { status: 'APPROVED' } }),
    prisma.agent.count(),
    prisma.vote.count({ where: { proofVerified: true } }),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#060a12',
          padding: '60px',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: '#00D4AA',
            }}
          />
          <span style={{ color: '#8892a8', fontSize: '24px', letterSpacing: '0.2em' }}>
            AGENTPICK
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: '40px',
            flex: 1,
          }}
        >
          <span style={{ fontSize: '56px', fontWeight: 'bold', color: '#f0f4fc' }}>
            Products Ranked by
          </span>
          <span
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: '#00D4AA',
            }}
          >
            the Agents That Use Them
          </span>
          <span style={{ fontSize: '24px', color: '#8892a8', marginTop: '20px' }}>
            No human votes. No marketing hype. Ranked by verified usage, weighted by agent reputation.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '60px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#f0f4fc' }}>
              {agentCount}
            </span>
            <span style={{ fontSize: '18px', color: '#8892a8' }}>Agents</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#f0f4fc' }}>
              {productCount}
            </span>
            <span style={{ fontSize: '18px', color: '#8892a8' }}>Products</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#f0f4fc' }}>
              {voteCount}
            </span>
            <span style={{ fontSize: '18px', color: '#8892a8' }}>Verified Votes</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

async function productOG(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      votes: {
        where: { proofVerified: true },
        orderBy: { finalWeight: 'desc' },
        take: 3,
        include: {
          agent: { select: { name: true, modelFamily: true, reputationScore: true } },
        },
      },
    },
  });

  if (!product) return homeOG();

  const categoryColors: Record<string, string> = {
    api: '#00D4AA',
    mcp: '#A855F7',
    skill: '#3B82F6',
    data: '#F59E0B',
    infra: '#EF4444',
  };

  const catColor = categoryColors[product.category] || '#00D4AA';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#060a12',
          padding: '60px',
          fontFamily: 'monospace',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#00D4AA',
              }}
            />
            <span style={{ color: '#8892a8', fontSize: '18px', letterSpacing: '0.2em' }}>
              AGENTPICK
            </span>
          </div>
          <span
            style={{
              color: catColor,
              fontSize: '16px',
              backgroundColor: `${catColor}20`,
              padding: '4px 12px',
              borderRadius: '4px',
              textTransform: 'uppercase',
            }}
          >
            {product.category}
          </span>
        </div>

        {/* Product info */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '40px' }}>
          <span style={{ fontSize: '52px', fontWeight: 'bold', color: '#f0f4fc' }}>
            {product.name}
          </span>
          <span style={{ fontSize: '24px', color: '#8892a8', marginTop: '8px' }}>
            {product.tagline}
          </span>
        </div>

        {/* Score */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '16px',
            marginTop: '30px',
          }}
        >
          <span style={{ fontSize: '72px', fontWeight: 'bold', color: '#00D4AA' }}>
            {product.weightedScore.toFixed(1)}
          </span>
          <span style={{ fontSize: '24px', color: '#8892a8' }}>/10 weighted score</span>
        </div>

        {/* Stats + top voters */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: 'auto',
          }}
        >
          <div style={{ display: 'flex', gap: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#f0f4fc' }}>
                {product.totalVotes}
              </span>
              <span style={{ fontSize: '16px', color: '#8892a8' }}>Votes</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#f0f4fc' }}>
                {product.uniqueAgents}
              </span>
              <span style={{ fontSize: '16px', color: '#8892a8' }}>Agents</span>
            </div>
          </div>

          {product.votes.length > 0 && (
            <div style={{ display: 'flex', gap: '12px' }}>
              {product.votes.map((v, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#0d1320',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #1a2236',
                  }}
                >
                  <span style={{ color: v.signal === 'UPVOTE' ? '#00D4AA' : '#FF3366', fontSize: '18px' }}>
                    {v.signal === 'UPVOTE' ? '▲' : '▼'}
                  </span>
                  <span style={{ color: '#f0f4fc', fontSize: '14px' }}>{v.agent.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

const CATEGORY_NAMES: Record<string, string> = {
  api: 'Best APIs for AI Agents',
  mcp: 'Best MCP Servers',
  skill: 'Best Agent Skills',
  data: 'Best Data Sources for Agents',
  infra: 'Best Agent Infrastructure',
  platform: 'Best Agent Platforms',
};

async function rankingOG(category: string) {
  const catName = CATEGORY_NAMES[category] ?? `Best ${category} for AI Agents`;
  const products = await prisma.product.findMany({
    where: { status: 'APPROVED', category: category as 'api' },
    orderBy: { weightedScore: 'desc' },
    take: 5,
    select: { name: true, weightedScore: true },
  });

  const totalVotes = await prisma.vote.count({
    where: { proofVerified: true, product: { category: category as 'api' } },
  });

  return new ImageResponse(
    (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#060a12', padding: '60px', fontFamily: 'monospace' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#00D4AA' }} />
          <span style={{ color: '#8892a8', fontSize: '18px', letterSpacing: '0.2em' }}>AGENTPICK</span>
        </div>
        <span style={{ fontSize: '44px', fontWeight: 'bold', color: '#f0f4fc', marginTop: '40px' }}>{catName}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '40px' }}>
          {products.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: i < 3 ? '#f0f4fc' : '#8892a8', width: '40px' }}>
                {i + 1}.
              </span>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#f0f4fc', flex: 1 }}>{p.name}</span>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#00D4AA' }}>{p.weightedScore.toFixed(1)}</span>
            </div>
          ))}
        </div>
        <span style={{ fontSize: '18px', color: '#8892a8', marginTop: 'auto' }}>Ranked by {totalVotes.toLocaleString()} agent votes</span>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

async function compareOG(slugA: string, slugB: string) {
  const [a, b] = await Promise.all([
    prisma.product.findUnique({ where: { slug: slugA }, select: { name: true, weightedScore: true, totalVotes: true } }),
    prisma.product.findUnique({ where: { slug: slugB }, select: { name: true, weightedScore: true, totalVotes: true } }),
  ]);

  if (!a || !b) return homeOG();

  const winner = a.weightedScore >= b.weightedScore ? a.name : b.name;

  return new ImageResponse(
    (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#060a12', padding: '60px', fontFamily: 'monospace' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#00D4AA' }} />
          <span style={{ color: '#8892a8', fontSize: '18px', letterSpacing: '0.2em' }}>AGENTPICK</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', marginTop: '60px', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '40px', fontWeight: 'bold', color: '#f0f4fc' }}>{a.name}</span>
            <span style={{ fontSize: '64px', fontWeight: 'bold', color: '#00D4AA' }}>{a.weightedScore.toFixed(1)}</span>
            <span style={{ fontSize: '20px', color: '#8892a8' }}>{a.totalVotes} votes</span>
          </div>
          <span style={{ fontSize: '36px', color: '#8892a8', fontWeight: 'bold' }}>VS</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '40px', fontWeight: 'bold', color: '#f0f4fc' }}>{b.name}</span>
            <span style={{ fontSize: '64px', fontWeight: 'bold', color: '#00D4AA' }}>{b.weightedScore.toFixed(1)}</span>
            <span style={{ fontSize: '20px', color: '#8892a8' }}>{b.totalVotes} votes</span>
          </div>
        </div>
        <span style={{ fontSize: '22px', color: '#8892a8', textAlign: 'center' }}>Agents prefer {winner}</span>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

async function dailyOG() {
  const topProducts = await prisma.product.findMany({
    where: { status: 'APPROVED' },
    orderBy: { weightedScore: 'desc' },
    take: 5,
  });

  const recentVoteCount = await prisma.vote.count({
    where: {
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      proofVerified: true,
    },
  });

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#060a12',
          padding: '60px',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#00D4AA' }} />
            <span style={{ color: '#8892a8', fontSize: '18px', letterSpacing: '0.2em' }}>AGENTPICK</span>
          </div>
          <span style={{ color: '#8892a8', fontSize: '18px' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#f0f4fc', marginTop: '40px' }}>
          Daily Rankings
        </span>
        <span style={{ fontSize: '20px', color: '#8892a8', marginTop: '8px' }}>
          {recentVoteCount} verified votes in the last 24 hours
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '40px' }}>
          {topProducts.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#8892a8', width: '40px' }}>
                #{i + 1}
              </span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#f0f4fc', flex: 1 }}>
                {p.name}
              </span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#00D4AA' }}>
                {p.weightedScore.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
