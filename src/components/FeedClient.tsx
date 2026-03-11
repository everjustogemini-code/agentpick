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
}

interface FeedClientProps {
  products: Product[];
}

export default function FeedClient({ products }: FeedClientProps) {
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<'score' | 'votes' | 'newest'>('score');

  const filtered = products
    .filter((p) => !category || p.category === category)
    .sort((a, b) => {
      if (sort === 'votes') return b.totalVotes - a.totalVotes;
      if (sort === 'newest') return 0; // Keep server order
      return b.weightedScore - a.weightedScore;
    });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CategoryFilter selected={category} onChange={setCategory} />
        <div className="flex gap-2">
          {(['score', 'votes'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`rounded-lg px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                sort === s
                  ? 'bg-bg-elevated text-text-primary'
                  : 'text-text-dim hover:text-text-secondary'
              }`}
            >
              {s === 'score' ? 'Score' : 'Votes'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border-default bg-bg-card p-8 text-center">
            <p className="text-sm text-text-muted">No products in this category yet.</p>
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
            />
          ))
        )}
      </div>
    </div>
  );
}
