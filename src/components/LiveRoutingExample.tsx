'use client';

import { useEffect, useState } from 'react';

interface RoutingData {
  query: string;
  toolUsed: string;
  latencyMs: number;
  costUsd: number;
  capability: string;
  aiClassification: Record<string, string> | null;
  strategyUsed: string;
  fallbackUsed: boolean;
  success: boolean;
  createdAt: string;
}

const STATIC_EXAMPLE: RoutingData = {
  query: 'OpenAI revenue 2025',
  toolUsed: 'exa-search',
  latencyMs: 320,
  costUsd: 0.002,
  capability: 'search',
  aiClassification: { type: 'research', domain: 'finance', depth: 'deep', freshness: 'any' },
  strategyUsed: 'AUTO',
  fallbackUsed: false,
  success: true,
  createdAt: '',
};

const ALTERNATIVES = [
  { name: 'Tavily', quality: '4.0/5', latency: '182ms', cost: '$0.001' },
  { name: 'Serper', quality: '3.1/5', latency: '100ms', cost: '$0.0005' },
];

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  'exa-search': 'Exa',
  'tavily': 'Tavily',
  'serper': 'Serper',
  'serpapi': 'SerpAPI',
  'brave-search': 'Brave',
  'perplexity-api': 'Perplexity',
  'perplexity-search': 'Perplexity',
  'you-search': 'You.com',
  'bing-web-search': 'Bing',
  'firecrawl': 'Firecrawl',
  'jina-ai': 'Jina',
  'jina-reader': 'Jina',
  'apify': 'Apify',
  'scrapingbee': 'ScrapingBee',
  'browserbase': 'Browserbase',
  'polygon-io': 'Polygon',
  'alpha-vantage': 'Alpha Vantage',
  'financial-modeling-prep': 'FMP',
  'voyage-embed': 'Voyage',
  'jina-embed': 'Jina Embed',
  'edenai-embed': 'EdenAI',
  'e2b': 'E2B',
  'resend': 'Resend',
};

const TOOL_QUALITY_SCORES: Record<string, number> = {
  'exa-search': 4.6,
  'tavily': 4.0,
  'serpapi': 3.0,
  'brave-search': 3.2,
  'serper': 3.1,
  'perplexity-api': 4.2,
  'perplexity-search': 4.2,
  'you-search': 3.0,
  'jina-ai': 3.5,
  'jina-reader': 3.5,
  'bing-web-search': 3.0,
  'firecrawl': 4.0,
  'apify': 3.5,
  'scrapingbee': 3.0,
  'browserbase': 3.8,
  'polygon-io': 4.5,
  'alpha-vantage': 3.5,
  'financial-modeling-prep': 3.8,
  'voyage-embed': 4.2,
  'jina-embed': 3.8,
  'edenai-embed': 3.5,
  'e2b': 4.5,
  'resend': 4.8,
};

function toolDisplayName(tool: string): string {
  return TOOL_DISPLAY_NAMES[tool] || tool;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  return `${Math.floor(seconds / 3600)} hours ago`;
}

export default function LiveRoutingExample() {
  const [data, setData] = useState<RoutingData | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function fetchLatest() {
      try {
        const res = await fetch('/api/v1/router/latest');
        const json = await res.json();
        if (json.call) {
          setData(json.call);
          setIsLive(true);
        }
      } catch {
        // keep static example
      }
    }

    fetchLatest();
    const interval = setInterval(fetchLatest, 30_000);
    return () => clearInterval(interval);
  }, []);

  const display = data || STATIC_EXAMPLE;
  const classification = display.aiClassification;
  // Exclude 'reasoning' — it's a full sentence, not a short classification tag
  const tags = classification
    ? Object.entries(classification)
        .filter(([key]) => key !== 'reasoning')
        .map(([, value]) => value)
        .filter(Boolean)
    : ['financial research', 'deep', 'recent'];

  return (
    <div className="card mt-6 p-5">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[1.5px] text-text-tertiary">
        {isLive ? 'Live routing example' : 'Example routing decision'}
      </div>

      {/* Query */}
      <div className="mb-3">
        <div className="mb-1 text-[12px] font-medium text-text-tertiary">Query</div>
        <div className="font-mono text-[14px] font-medium text-text-primary">
          &ldquo;{display.query}&rdquo;
        </div>
      </div>

      {/* Classification */}
      <div className="mb-4">
        <div className="mb-1 text-[12px] font-medium text-text-tertiary">AI classification</div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-accent-subtle px-2 py-0.5 font-mono text-[11px] font-medium text-accent"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Router decision */}
      <div className="mb-4">
        <div className="mb-2 text-[12px] font-medium text-text-tertiary">Router decision</div>
        <div className="inline-flex items-center gap-4 rounded-lg border border-border bg-bg-secondary px-4 py-2.5">
          <span className="font-mono text-[16px] font-bold text-text-primary">
            {toolDisplayName(display.toolUsed)}
          </span>
          <span className="font-mono text-[13px] text-text-secondary">
            quality: <span className="font-semibold text-text-primary">{(TOOL_QUALITY_SCORES[display.toolUsed] ?? 4.0).toFixed(1)}</span>
          </span>
          <span className="font-mono text-[13px] text-text-secondary">
            latency: <span className="font-semibold text-text-primary">{display.latencyMs}ms</span>
          </span>
          <span className="font-mono text-[13px] text-text-secondary">
            cost: <span className="font-semibold text-text-primary">${display.costUsd.toFixed(4)}</span>
          </span>
        </div>
      </div>

      {/* Alternatives */}
      <div className="mb-3">
        <div className="mb-1 text-[12px] font-medium text-text-tertiary">Alternatives considered:</div>
        <div className="flex flex-wrap gap-3 font-mono text-[12px] text-text-secondary">
          {ALTERNATIVES.filter((alt) => alt.name.toLowerCase() !== toolDisplayName(display.toolUsed).toLowerCase()).map((alt) => (
            <span key={alt.name}>
              {alt.name} {alt.quality} {alt.latency} {alt.cost}
            </span>
          ))}
        </div>
      </div>

      {/* Timestamp */}
      <div className="flex items-center gap-1.5 text-[12px] text-text-tertiary">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${isLive ? 'bg-success animate-pulse' : 'bg-text-tertiary'}`} />
        {isLive ? `Updated ${timeAgo(display.createdAt)}` : 'Example'}
      </div>
    </div>
  );
}
