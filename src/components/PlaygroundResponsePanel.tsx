'use client';

import { useState } from 'react';
import styles from './playground.module.css';

interface Props {
  result: object | null;
  latency: number | null;
  toolUsed: string | null;
  error: string | null;
  endpoint: string;
  query: string;
  strategy: string;
  useOwnKey: boolean;
  ownKey: string;
}

type Tab = 'Response' | 'cURL' | 'Python' | 'Node';

const TABS: Tab[] = ['Response', 'cURL', 'Python', 'Node'];

const ENDPOINT_BODY: Record<string, (query: string, strategy: string) => Record<string, unknown>> = {
  search: (query, strategy) => ({ query, strategy }),
  crawl: () => ({ url: 'https://example.com' }),
  embed: (query) => ({ text: query }),
  finance: (query) => ({ query, ticker: 'AAPL' }),
};

function buildBody(endpoint: string, query: string, strategy: string): Record<string, unknown> {
  return (ENDPOINT_BODY[endpoint] ?? ENDPOINT_BODY.search)(query, strategy);
}

export default function PlaygroundResponsePanel({
  result,
  latency,
  toolUsed,
  error,
  endpoint,
  query,
  strategy,
  useOwnKey,
  ownKey,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Response');
  const [copied, setCopied] = useState(false);

  const key = useOwnKey && ownKey ? ownKey : 'DEMO_KEY';
  const body = buildBody(endpoint, query, strategy);
  const bodyJson = JSON.stringify(body, null, 2);
  const bodyInline = JSON.stringify(body);

  const snippets: Record<Tab, string> = {
    Response: '',
    cURL: `curl -X POST https://agentpick.dev/api/v1/route/${endpoint} \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '${bodyInline}'`,
    Python: `import httpx
res = httpx.post(
    "https://agentpick.dev/api/v1/route/${endpoint}",
    headers={"Authorization": "Bearer ${key}"},
    json=${bodyJson}
)
print(res.json())`,
    Node: `const res = await fetch('https://agentpick.dev/api/v1/route/${endpoint}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${key}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${bodyInline})
})
const data = await res.json()`,
  };

  async function handleCopy() {
    const text = activeTab === 'Response'
      ? JSON.stringify(result, null, 2)
      : snippets[activeTab];
    await navigator.clipboard.writeText(text ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white flex flex-col">
      {/* Tab bar */}
      <div className="flex gap-2 p-4 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4">
        {activeTab === 'Response' ? (
          <>
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
                {error}
                {error.includes('Sign up') && (
                  <div className="mt-2">
                    <a
                      href="/signup"
                      className="font-semibold underline"
                    >
                      Sign up for free →
                    </a>
                  </div>
                )}
              </div>
            ) : result === null ? (
              <div
                className="flex items-center justify-center text-[#A3A3A3] text-sm text-center"
                style={{
                  border: '2px dashed #E5E5E5',
                  borderRadius: 8,
                  padding: '48px 24px',
                }}
              >
                Run a query to see results
              </div>
            ) : (
              <div className={styles.fadeIn}>
                {/* Top bar */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {toolUsed && (
                      <span className="bg-blue-50 text-blue-700 text-xs font-mono px-2 py-0.5 rounded">
                        {toolUsed}
                      </span>
                    )}
                    {latency !== null && (
                      <span className="bg-neutral-100 text-neutral-600 text-xs font-mono px-2 py-0.5 rounded">
                        {latency}ms
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <pre className="bg-neutral-950 text-green-400 font-mono text-xs p-4 rounded-lg overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            {/* Demo CTA */}
            {!useOwnKey && (
              <a
                href="/signup"
                className="mt-4 flex flex-col gap-0.5 rounded-lg p-3 text-white"
                style={{
                  background: 'linear-gradient(135deg, #1E40AF 0%, #4338CA 100%)',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginTop: 16,
                }}
              >
                <span className="font-semibold text-sm">Get your free API key →</span>
                <span className="text-xs opacity-80">1000 free requests/month</span>
              </a>
            )}
          </>
        ) : (
          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 text-xs text-neutral-400 hover:text-white transition-colors z-10"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <pre className="bg-neutral-950 text-green-400 font-mono text-xs p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
              {snippets[activeTab]}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
