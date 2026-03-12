'use client';

import { useState } from 'react';
import CategoryFilter from './CategoryFilter';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  logoUrl: string | null;
  tags: string[];
  totalVotes: number;
  weightedScore: number;
  uniqueAgents: number;
  featuredAt: string | Date | null;
  approvedAt?: string | Date | null;
  telemetryCount?: number;
  successRate?: number | null;
  avgLatencyMs?: number | null;
  avgCostUsd?: number | null;
  status?: string;
  benchmarkCount?: number;
  _count?: { votes: number };
}

type RankingView = 'most_used' | 'trending' | 'best_performance';

interface FeedClientProps {
  products: Product[];
}

function performanceScore(p: Product): number {
  const sr = p.successRate ?? 0.5;
  const latInv = p.avgLatencyMs ? 1 / p.avgLatencyMs : 0;
  const costInv = p.avgCostUsd ? 1 / p.avgCostUsd : 0;
  return sr * latInv * costInv;
}

export default function FeedClient({ products }: FeedClientProps) {
  const [category, setCategory] = useState('');
  const [view, setView] = useState<RankingView>('most_used');

  // Compute category counts
  const counts: Record<string, number> = {};
  for (const p of products) {
    counts[p.category] = (counts[p.category] || 0) + 1;
  }

  const filtered = products
    .filter((p) => !category || p.category === category)
    .filter((p) => {
      if (view === 'best_performance') return (p.telemetryCount ?? 0) >= 50;
      return true;
    })
    .sort((a, b) => {
      if (view === 'most_used') {
        const aCount = a.telemetryCount ?? 0;
        const bCount = b.telemetryCount ?? 0;
        if (aCount !== bCount) return bCount - aCount;
        return b.totalVotes - a.totalVotes;
      }
      if (view === 'trending') {
        return b.weightedScore - a.weightedScore;
      }
      if (view === 'best_performance') {
        return performanceScore(b) - performanceScore(a);
      }
      return b.weightedScore - a.weightedScore;
    });

  const VIEWS: { key: RankingView; label: string }[] = [
    { key: 'most_used', label: 'Most Used' },
    { key: 'trending', label: 'Trending' },
    { key: 'best_performance', label: 'Best Performance' },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CategoryFilter selected={category} onChange={setCategory} counts={counts} />
        <div className="flex gap-2">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                view === v.key
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-dim hover:text-text-secondary'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border-default bg-bg-card p-8 text-center">
            <p className="text-sm text-text-muted">
              {view === 'best_performance'
                ? 'Not enough telemetry data yet. Products need 50+ events to appear here.'
                : 'No products in this category yet.'}
            </p>
          </div>
        ) : (
          filtered.map((product, i) => (
            <ProductCard
              key={product.id}
              rank={i + 1}
              slug={product.slug}
              name={product.name}
              tagline={product.tagline}
              category={product.category}
              tags={product.tags}
              totalVotes={product.totalVotes}
              weightedScore={product.weightedScore}
              uniqueAgents={product.uniqueAgents}
              logoUrl={product.logoUrl}
              featured={!!product.featuredAt}
              upvotes={product._count?.votes ?? product.totalVotes}
              approvedAt={product.approvedAt ? new Date(product.approvedAt).toISOString() : null}
              telemetryCount={product.telemetryCount}
              successRate={product.successRate}
              avgLatencyMs={product.avgLatencyMs}
              status={product.status}
              benchmarkCount={product.benchmarkCount}
            />
          ))
        )}
      </div>
    </div>
  );
}
