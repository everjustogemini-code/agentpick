'use client';

import { useState } from 'react';

type Endpoint = 'search' | 'crawl' | 'embed' | 'finance';
type Strategy = 'auto' | 'fastest' | 'cheapest' | 'best_performance';

interface Props {
  onResultChange: (
    result: object | null,
    latency: number | null,
    toolUsed: string | null,
    error: string | null,
  ) => void;
  onStateChange?: (state: {
    endpoint: Endpoint;
    query: string;
    strategy: Strategy;
    useOwnKey: boolean;
    ownKey: string;
  }) => void;
}

const ENDPOINTS: { value: Endpoint; label: string }[] = [
  { value: 'search', label: 'Search' },
  { value: 'crawl', label: 'Crawl' },
  { value: 'embed', label: 'Embed' },
  { value: 'finance', label: 'Finance' },
];

const STRATEGIES: { value: Strategy; label: string }[] = [
  { value: 'auto', label: 'auto' },
  { value: 'fastest', label: 'fastest' },
  { value: 'cheapest', label: 'cheapest' },
  { value: 'best_performance', label: 'best_performance' },
];

export default function PlaygroundRequestBuilder({ onResultChange, onStateChange }: Props) {
  const [endpoint, setEndpoint] = useState<Endpoint>('search');
  const [query, setQuery] = useState('');
  const [strategy, setStrategy] = useState<Strategy>('auto');
  const [useOwnKey, setUseOwnKey] = useState(false);
  const [ownKey, setOwnKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function notify(
    ep: Endpoint = endpoint,
    q: string = query,
    st: Strategy = strategy,
    uok: boolean = useOwnKey,
    ok: string = ownKey,
  ) {
    onStateChange?.({ endpoint: ep, query: q, strategy: st, useOwnKey: uok, ownKey: ok });
  }

  function handleEndpoint(ep: Endpoint) {
    setEndpoint(ep);
    notify(ep);
  }

  function handleQuery(q: string) {
    setQuery(q);
    notify(endpoint, q);
  }

  function handleStrategy(st: Strategy) {
    setStrategy(st);
    notify(endpoint, query, st);
  }

  function handleUseOwnKey(val: boolean) {
    setUseOwnKey(val);
    notify(endpoint, query, strategy, val);
  }

  function handleOwnKey(ok: string) {
    setOwnKey(ok);
    notify(endpoint, query, strategy, useOwnKey, ok);
  }

  async function handleRun() {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    onResultChange(null, null, null, null);

    try {
      const demoKey = process.env.NEXT_PUBLIC_PLAYGROUND_DEMO_KEY ?? 'DEMO_KEY';
      const authKey = useOwnKey && ownKey ? ownKey : demoKey;

      const res = await fetch('/api/v1/playground/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authKey}`,
        },
        body: JSON.stringify({ query, strategy, endpoint }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          onResultChange(null, null, null, data.message ?? data.error ?? 'Rate limit reached');
        } else {
          onResultChange(null, null, null, data.error ?? 'Request failed');
        }
        return;
      }

      onResultChange(data.result, data.latency_ms, data.tool_used, null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      onResultChange(null, null, null, message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white p-6">
      {/* Endpoint tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {ENDPOINTS.map((ep) => (
          <button
            key={ep.value}
            onClick={() => handleEndpoint(ep.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              endpoint === ep.value
                ? 'bg-[#171717] text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {ep.label}
          </button>
        ))}
      </div>

      {/* Query textarea */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-neutral-500 mb-1.5">Query</label>
        <textarea
          value={query}
          onChange={(e) => handleQuery(e.target.value)}
          rows={4}
          placeholder="Find the latest research on AI agent benchmarks"
          className="w-full rounded-lg border border-[#E5E5E5] p-3 font-mono text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        />
      </div>

      {/* Strategy pills */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-neutral-500 mb-1.5">Strategy</label>
        <div className="flex flex-wrap gap-2">
          {STRATEGIES.map((st) => (
            <button
              key={st.value}
              onClick={() => handleStrategy(st.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                strategy === st.value
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={!query.trim() || isLoading}
        className="w-full rounded-lg bg-[#171717] text-white font-semibold text-[15px] transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ height: 44 }}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin"
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            Running&hellip;
          </>
        ) : (
          'Run'
        )}
      </button>

      {/* API key section */}
      <div className="mt-4">
        {!useOwnKey ? (
          <p className="text-xs text-neutral-500">
            Using demo key · 10 req/day &nbsp;·&nbsp;{' '}
            <button
              onClick={() => handleUseOwnKey(true)}
              className="text-blue-600 underline"
            >
              Use my key
            </button>
          </p>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-neutral-500">Your API key</p>
              <button
                onClick={() => handleUseOwnKey(false)}
                className="text-xs text-neutral-400 underline"
              >
                Use demo
              </button>
            </div>
            <input
              type="password"
              placeholder="sk-..."
              value={ownKey}
              onChange={(e) => handleOwnKey(e.target.value)}
              className="w-full rounded-lg border border-[#E5E5E5] p-3 font-mono text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            />
            <p className="text-xs text-neutral-400 mt-1">Your key is never stored.</p>
          </div>
        )}
      </div>
    </div>
  );
}
