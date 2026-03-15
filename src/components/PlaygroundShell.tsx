'use client'

import { useState } from 'react'

type Endpoint = 'search' | 'crawl' | 'embed' | 'finance'
type Strategy = 'auto' | 'fastest' | 'cheapest' | 'best_performance'

export default function PlaygroundShell() {
  const [endpoint, setEndpoint] = useState<Endpoint>('search')
  const [query, setQuery] = useState('')
  const [strategy, setStrategy] = useState<Strategy>('auto')
  const [apiKey, setApiKey] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<object | null>(null)
  const [latency, setLatency] = useState<number | null>(null)
  const [toolUsed, setToolUsed] = useState<string | null>(null)
  const [error429, setError429] = useState(false)
  const [activeTab, setActiveTab] = useState<'response' | 'curl' | 'python' | 'node'>('response')
  const [copied, setCopied] = useState(false)

  async function handleRun() {
    if (!query.trim() || loading) return
    setLoading(true)
    setError429(false)
    const t0 = Date.now()
    try {
      const res = await fetch('/api/v1/playground/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          query,
          strategy,
          apiKey: apiKey || undefined,
        }),
      })
      const data = await res.json()
      if (res.status === 429) {
        setError429(true)
        setResult(null)
        setLatency(null)
        setToolUsed(null)
      } else {
        setResult(data)
        setLatency(data.latency_ms ?? data.latency ?? Date.now() - t0)
        setToolUsed(data.tool_used ?? data.tool ?? null)
        setActiveTab('response')
      }
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const effectiveKey = apiKey || 'demo_key'

  const ENDPOINT_PARAM: Record<Endpoint, string> = {
    search: 'query',
    crawl: 'url',
    embed: 'text',
    finance: 'symbol',
  }
  const ENDPOINT_PLACEHOLDER: Record<Endpoint, string> = {
    search: 'your query here',
    crawl: 'https://example.com',
    embed: 'your text here',
    finance: 'AAPL',
  }
  const ENDPOINT_LABEL: Record<Endpoint, string> = {
    search: 'Query',
    crawl: 'URL',
    embed: 'Text',
    finance: 'Symbol',
  }
  const paramKey = ENDPOINT_PARAM[endpoint]
  const paramValue = query || ENDPOINT_PLACEHOLDER[endpoint]

  const curlSnippet = `curl -X POST https://agentpick.dev/api/v1/route/${endpoint} \\
  -H "Authorization: Bearer ${effectiveKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"${paramKey}": "${paramValue}", "strategy": "${strategy}"}'`

  const pythonSnippet = `import requests

res = requests.post(
    "https://agentpick.dev/api/v1/route/${endpoint}",
    headers={"Authorization": "Bearer ${effectiveKey}"},
    json={"${paramKey}": "${paramValue}", "strategy": "${strategy}"}
)
print(res.json()["meta"]["tool_used"], res.json()["meta"]["latency_ms"])`

  const nodeSnippet = `const res = await fetch('https://agentpick.dev/api/v1/route/${endpoint}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${effectiveKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ ${paramKey}: "${paramValue}", strategy: "${strategy}" })
})
const data = await res.json()
console.log(data.meta.tool_used, data.meta.latency_ms + 'ms')`

  const endpointOptions: { value: Endpoint; label: string }[] = [
    { value: 'search', label: 'Search' },
    { value: 'crawl', label: 'Crawl' },
    { value: 'embed', label: 'Embed' },
    { value: 'finance', label: 'Finance' },
  ]

  const strategyOptions: { value: Strategy; label: string }[] = [
    { value: 'auto', label: 'Auto' },
    { value: 'fastest', label: 'Fastest' },
    { value: 'cheapest', label: 'Cheapest' },
    { value: 'best_performance', label: 'Best Quality' },
  ]

  const panelClass = 'bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-6'
  const pillBase = 'px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors'
  const pillActive = 'bg-cyan-500 text-white'
  const pillInactive = 'bg-white/10 text-gray-400 hover:bg-white/20'

  return (
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
      {/* LEFT: Request Builder */}
      <div className={panelClass}>
        {/* Endpoint tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {endpointOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setEndpoint(opt.value)
                setQuery('')
                setResult(null)
                setLatency(null)
                setToolUsed(null)
                setError429(false)
                setCopied(false)
                setActiveTab('response')
              }}
              className={`${pillBase} ${endpoint === opt.value ? pillActive : pillInactive}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Query textarea */}
        <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1">{ENDPOINT_LABEL[endpoint]}</label>
        <textarea
          rows={3}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Find the latest research on LLM benchmarks"
          className="w-full font-mono text-sm bg-black/30 border border-white/10 rounded-lg px-3 py-2
                     text-gray-100 placeholder:text-gray-600 resize-none focus:outline-none
                     focus:border-cyan-500/50 transition-colors"
        />

        {/* Strategy pills */}
        <p className="text-xs text-gray-500 uppercase tracking-widest mt-4 mb-2">Strategy</p>
        <div className="flex gap-2 flex-wrap">
          {strategyOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStrategy(opt.value)}
              className={`${pillBase} ${strategy === opt.value ? pillActive : pillInactive}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* API key row */}
        {!showKeyInput ? (
          <div className="flex items-center gap-3 mt-4">
            <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
              Using demo key (10 req/day)
            </span>
            <button onClick={() => setShowKeyInput(true)}
              className="text-xs text-cyan-400 hover:text-cyan-300">
              Use my own key →
            </button>
          </div>
        ) : (
          <input
            type="text"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="mt-4 w-full font-mono text-sm bg-black/30 border border-white/10 rounded-lg
                       px-3 py-2 text-gray-100 placeholder:text-gray-600 focus:outline-none
                       focus:border-cyan-500/50 transition-colors"
          />
        )}

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={!query.trim() || loading}
          className="mt-5 w-full py-3 rounded-lg font-semibold text-white
                     bg-gradient-to-r from-cyan-600 to-blue-600
                     hover:from-cyan-500 hover:to-blue-500
                     transition-all disabled:opacity-40 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : '▶ Run Query'}
        </button>
      </div>

      {/* RIGHT: Response Panel */}
      <div className={panelClass}>
        {/* Tab row */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['response', 'curl', 'python', 'node'] as const).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setCopied(false); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-cyan-500 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}>
              {tab === 'curl' ? 'cURL' : tab === 'node' ? 'Node' : tab === 'python' ? 'Python' : 'Response'}
            </button>
          ))}
        </div>

        {/* 429 error banner */}
        {error429 && (
          <div className="mb-3 p-3 rounded-lg bg-red-900/30 border border-red-500/30 text-red-400 text-sm">
            Demo limit reached.{' '}
            <a href="/connect" className="underline underline-offset-2">Sign up free to continue</a>
          </div>
        )}

        {/* Response tab */}
        {activeTab === 'response' && (
          result === null ? (
            <div className="border border-dashed border-white/20 rounded-lg h-48 flex items-center
                            justify-center text-gray-500 text-sm">
              Run a query to see live routing
            </div>
          ) : (
            <div className="relative">
              <div className="flex gap-2 mb-2">
                {latency !== null && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-mono">
                    {latency}ms
                  </span>
                )}
                {toolUsed && (
                  <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full font-mono">
                    {toolUsed}
                  </span>
                )}
              </div>
              <pre className="text-xs font-mono bg-black/40 rounded p-4 text-gray-100 overflow-auto max-h-80
                              transition-opacity duration-300">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )
        )}

        {/* Code tabs */}
        {activeTab === 'curl' && (
          <div className="relative">
            <button
              onClick={() => copyToClipboard(curlSnippet)}
              className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-xs text-gray-400 px-2 py-1 rounded transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
            <pre className="text-xs font-mono bg-black/40 rounded p-4 text-gray-300 overflow-auto max-h-80 pt-8">
              {curlSnippet}
            </pre>
          </div>
        )}

        {activeTab === 'python' && (
          <div className="relative">
            <button
              onClick={() => copyToClipboard(pythonSnippet)}
              className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-xs text-gray-400 px-2 py-1 rounded transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
            <pre className="text-xs font-mono bg-black/40 rounded p-4 text-gray-300 overflow-auto max-h-80 pt-8">
              {pythonSnippet}
            </pre>
          </div>
        )}

        {activeTab === 'node' && (
          <div className="relative">
            <button
              onClick={() => copyToClipboard(nodeSnippet)}
              className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-xs text-gray-400 px-2 py-1 rounded transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
            <pre className="text-xs font-mono bg-black/40 rounded p-4 text-gray-300 overflow-auto max-h-80 pt-8">
              {nodeSnippet}
            </pre>
          </div>
        )}

        {/* CTA banner (demo key only) */}
        {!apiKey && (
          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-cyan-900/40 to-blue-900/40
                          border border-cyan-500/20 text-sm text-center">
            <span className="text-gray-300">Get your free API key →</span>{' '}
            <a href="/connect"
               className="text-cyan-400 font-semibold hover:text-cyan-300 underline underline-offset-2">
              Sign up free
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
