'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const REGISTER_CTA_THRESHOLD = 3;
const LOCAL_STORAGE_KEY = 'agentpick-playground-uses';
const MAX_QUERY_LENGTH = 2000;
const MAX_URL_LENGTH = 2048;

const CAPABILITIES = [
  {
    id: 'search',
    label: 'Search',
    helper: 'Route a live research query across the search stack.',
    placeholder: 'Recent funding rounds for AI agent startups',
  },
  {
    id: 'crawl',
    label: 'Crawl',
    helper: 'Submit a URL and let AgentPick choose the best extraction tool.',
    placeholder: 'https://agentpick.dev',
  },
  {
    id: 'embed',
    label: 'Embed',
    helper: 'Preview how text routes into the embedding layer.',
    placeholder: 'AgentPick routes search, crawl, and embeddings through one API.',
  },
] as const;

type Capability = (typeof CAPABILITIES)[number]['id'];

type PlaygroundResult = {
  title: string;
  url?: string;
  snippet?: string;
  meta?: string[];
};

type PlaygroundResponse = {
  capability?: Capability;
  tool?: string | null;
  latencyMs?: number;
  traceId?: string;
  reasoning?: string | null;
  results?: PlaygroundResult[];
  totalResults?: number;
  capped?: boolean;
  retryAfterSeconds?: number;
  error?: string;
};

function getCapabilityConfig(capability: Capability) {
  return CAPABILITIES.find((item) => item.id === capability) ?? CAPABILITIES[0];
}

function buildPlaygroundRequestBody(capability: Capability, query: string) {
  return {
    capability,
    query: query.trim(),
  };
}

function normalizeCrawlInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const candidate =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function escapeSingleQuotedShell(value: string) {
  return value.replace(/'/g, `'\"'\"'`);
}

function buildCurlSnippet(capability: Capability, query: string) {
  const exampleQuery = query.trim() || getCapabilityConfig(capability).placeholder;
  const body = JSON.stringify(buildPlaygroundRequestBody(capability, exampleQuery));
  const escapedBody = escapeSingleQuotedShell(body);

  return `curl -X POST https://agentpick.dev/api/v1/playground/route \\
  -H "Content-Type: application/json" \\
  -d '${escapedBody}'`;
}

function formatHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function Playground() {
  const [capability, setCapability] = useState<Capability>('search');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<PlaygroundResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [useCount, setUseCount] = useState(0);
  const [resultVersion, setResultVersion] = useState(0);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      setUseCount(stored ? Number.parseInt(stored, 10) || 0 : 0);
    } catch {
      setUseCount(0);
    }
  }, []);

  const capabilityConfig = getCapabilityConfig(capability);
  const curlSnippet = buildCurlSnippet(capability, query);

  const showRegisterCta = useCount >= REGISTER_CTA_THRESHOLD;
  const results = response?.results ?? [];
  const queryLimit = capability === 'crawl' ? MAX_URL_LENGTH : MAX_QUERY_LENGTH;
  const statCards = response
    ? [
        {
          label: 'Tool selected',
          value: response.tool ?? 'Unavailable',
        },
        {
          label: 'Latency',
          value: typeof response.latencyMs === 'number' ? `${response.latencyMs}ms` : 'Pending',
        },
        {
          label: 'Trace ID',
          value: response.traceId ?? 'Unavailable',
        },
      ]
    : [];

  function recordUse() {
    setUseCount((current) => {
      const next = current + 1;
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }

  async function handleCopyCurl() {
    try {
      await navigator.clipboard.writeText(curlSnippet);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }

    window.setTimeout(() => {
      setCopyState('idle');
    }, 1800);
  }

  async function handleRoute() {
    if (!query.trim() || loading) return;

    const trimmedQuery = query.trim();
    if (capability === 'crawl' && !normalizeCrawlInput(trimmedQuery)) {
      setResponse({
        capability,
        error: 'Enter a valid http(s) URL for crawl requests.',
        results: [],
      });
      setResultVersion((current) => current + 1);
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/v1/playground/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(buildPlaygroundRequestBody(capability, trimmedQuery)),
      });

      let data: PlaygroundResponse;
      try {
        data = (await res.json()) as PlaygroundResponse;
      } catch {
        data = {};
      }

      const retryAfterHeader = res.headers.get('retry-after');
      const retryAfterSeconds =
        data.retryAfterSeconds ??
        (retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) || undefined : undefined);

      if (!res.ok) {
        data = {
          ...data,
          capability,
          retryAfterSeconds,
          error:
            data.error ??
            (res.status === 429
              ? `Rate limit exceeded. Try again in ${retryAfterSeconds ?? 60}s.`
              : `Request failed with status ${res.status}.`),
        };
      } else if (retryAfterSeconds !== undefined) {
        data = {
          ...data,
          retryAfterSeconds,
        };
      }

      setResponse(data);
      setResultVersion((current) => current + 1);
      recordUse();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reach the playground.';
      setResponse({ capability, error: message, results: [] });
      setResultVersion((current) => current + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-sm sm:p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{ backgroundImage: 'var(--gradient-mesh)' }}
      />
      <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-orange-300/80">
              Live Playground
            </p>
            <h2 className="text-[24px] font-bold tracking-[-0.04em] text-white">
              Route a real request
            </h2>
            <p className="mt-2 max-w-[540px] text-sm text-white/55">
              Public demo. Search, crawl, or embed a request and inspect the tool selection,
              latency, trace, and preview output.
            </p>
          </div>

          <div className="rounded-full border border-white/[0.08] bg-black/20 px-3 py-1 font-mono text-[11px] text-white/45">
            5 req/min
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {CAPABILITIES.map((item) => {
            const active = item.id === capability;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCapability(item.id)}
                className={`rounded-full border px-4 py-2 text-sm transition-all ${
                  active
                    ? 'border-orange-400/60 bg-orange-500/15 text-orange-200 shadow-[0_0_0_1px_rgba(249,115,22,0.15)]'
                    : 'border-white/[0.08] bg-white/[0.03] text-white/55 hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white/75'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-[24px] border border-white/[0.08] bg-black/20 p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">
                {capability === 'crawl' ? 'URL' : 'Query'}
              </p>
              <p className="mt-1 text-xs text-white/45">
                {capabilityConfig.helper}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyCurl}
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/65 transition-colors hover:border-white/[0.14] hover:text-white"
            >
              {copyState === 'copied'
                ? 'Copied cURL'
                : copyState === 'error'
                  ? 'Copy failed'
                  : 'Copy cURL'}
            </button>
          </div>

          <textarea
            rows={capability === 'embed' ? 4 : 3}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={queryLimit}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault();
                void handleRoute();
              }
            }}
            placeholder={capabilityConfig.placeholder}
            className="min-h-[112px] w-full resize-none rounded-[20px] border border-white/[0.08] bg-white/[0.03] px-4 py-3 font-mono text-sm leading-relaxed text-white placeholder:text-white/25 focus:border-orange-400/40 focus:outline-none"
            style={{ fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace" }}
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/35">
              Cmd/Ctrl + Enter routes the current request.
              {capability === 'crawl' ? ' Enter a valid URL.' : ''}
              {' '}
              {query.length}/{queryLimit}
            </p>

            <button
              type="button"
              onClick={() => void handleRoute()}
              disabled={!query.trim() || loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-orange-500/40"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
              )}
              {loading ? 'Routing…' : 'Route it'}
            </button>
          </div>
        </div>

        <div
          aria-live="polite"
          className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5"
        >
          {!response && !loading && (
            <div className="rounded-[20px] border border-dashed border-white/[0.1] bg-black/20 px-4 py-10 text-center text-sm text-white/35">
              Route a request to inspect the selected tool, latency, trace ID, and capped output preview.
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="h-7 w-28 animate-pulse rounded-full bg-white/10" />
                <div className="h-7 w-24 animate-pulse rounded-full bg-white/10" />
                <div className="h-7 w-40 animate-pulse rounded-full bg-white/10" />
              </div>
              <div className="rounded-[20px] border border-white/[0.08] bg-black/20 p-4">
                <div className="h-4 w-1/3 animate-pulse rounded bg-white/10" />
                <div className="mt-3 h-3 w-full animate-pulse rounded bg-white/8" />
                <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-white/8" />
                <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-white/8" />
              </div>
            </div>
          )}

          {response && !loading && (
            <div key={resultVersion} className="space-y-4" style={{ animation: 'fadeIn 220ms ease-out both' }}>
              <div className="grid gap-3 sm:grid-cols-3">
                {statCards.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[18px] border border-white/[0.08] bg-black/20 px-4 py-3"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
                      {item.label}
                    </p>
                    <p className="mt-2 break-all font-mono text-[12px] text-white/75">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {response.reasoning && (
                <p className="text-xs text-white/45">
                  {response.reasoning}
                </p>
              )}

              {response.error && (
                <div className="rounded-[20px] border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-200">
                  {response.error}
                  {response.retryAfterSeconds ? ` Retry after ${response.retryAfterSeconds}s.` : ''}
                </div>
              )}

              {results.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/40">
                    <span>
                      {response.capped && typeof response.totalResults === 'number'
                        ? `Showing ${results.length} of ${response.totalResults} preview results.`
                        : `${results.length} preview result${results.length === 1 ? '' : 's'}.`}
                    </span>
                    <span>Interactive preview only.</span>
                  </div>

                  {results.map((item, index) => (
                    <article
                      key={`${response.traceId ?? 'playground'}-${index}`}
                      className="rounded-[20px] border border-white/[0.08] bg-black/20 p-4"
                      style={{
                        animation: 'slideUpCard 320ms ease-out both',
                        animationDelay: `${index * 70}ms`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-semibold text-white">
                            {item.title}
                          </h3>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex text-xs text-orange-300/85 underline underline-offset-2 hover:text-orange-200"
                            >
                              {formatHost(item.url)}
                            </a>
                          )}
                        </div>
                      </div>

                      {item.snippet && (
                        <p className="mt-3 text-sm leading-6 text-white/65">
                          {item.snippet}
                        </p>
                      )}

                      {item.meta && item.meta.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.meta.map((entry, metaIndex) => (
                            <span
                              key={`${entry}-${metaIndex}`}
                              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/45"
                            >
                              {entry}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                !response.error && (
                  <div className="rounded-[20px] border border-dashed border-white/[0.1] bg-black/20 px-4 py-8 text-center text-sm text-white/35">
                    The selected tool returned no previewable results for this request.
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {showRegisterCta && (
          <div className="rounded-[24px] border border-orange-400/20 bg-orange-500/[0.08] p-4 sm:p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-300/75">
              Register
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Move from demo traffic to your own key
                </h3>
                <p className="mt-1 text-sm text-white/55">
                  Register for free to unlock persistent usage, higher limits, and direct access to
                  the production router.
                </p>
              </div>

              <Link
                href="/dashboard/router"
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-400"
              >
                Register free
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
