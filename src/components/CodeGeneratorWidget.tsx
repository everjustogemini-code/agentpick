'use client'

import React, { useState } from 'react'

type Language   = 'python' | 'javascript' | 'curl'
type Capability = 'search' | 'crawl' | 'finance' | 'embed'
type Strategy   = 'auto' | 'balanced' | 'cheapest' | 'best_performance' | 'fastest'

const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'python',     label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'curl',       label: 'curl' },
]
const CAPABILITIES: { id: Capability; label: string }[] = [
  { id: 'search',  label: 'search' },
  { id: 'crawl',   label: 'crawl' },
  { id: 'finance', label: 'finance' },
  { id: 'embed',   label: 'embed' },
]
const STRATEGIES: { id: Strategy; label: string }[] = [
  { id: 'auto',             label: 'auto' },
  { id: 'balanced',         label: 'balanced' },
  { id: 'cheapest',         label: 'cheapest' },
  { id: 'best_performance', label: 'best_performance' },
  { id: 'fastest',          label: 'fastest' },
]

const CAP_PARAMS: Record<Capability, { key: string; value: string }> = {
  search:  { key: 'query',  value: '"your query here"' },
  crawl:   { key: 'url',    value: '"https://example.com"' },
  finance: { key: 'symbol', value: '"AAPL"' },
  embed:   { key: 'text',   value: '"your text here"' },
}

const CAP_PATH: Record<Capability, string> = {
  search:  'route/search',
  crawl:   'route/crawl',
  finance: 'route/finance',
  embed:   'route/embed',
}

function generateCode(lang: Language, cap: Capability, strategy: Strategy): string {
  const { key, value } = CAP_PARAMS[cap]

  if (lang === 'python') return `import agentpick

client = agentpick.Client(api_key="YOUR_KEY")
result = client.${cap}(
    ${key}=${value},
    strategy="${strategy}"
)
print(result)`

  if (lang === 'javascript') return `import AgentPick from 'agentpick'

const client = new AgentPick({ apiKey: 'YOUR_KEY' })
const result = await client.${cap}({
  ${key}: ${value},
  strategy: '${strategy}',
})
console.log(result)`

  // curl
  return `curl -X POST https://agentpick.com/api/v1/${CAP_PATH[cap]} \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "${key}": ${value},
    "strategy": "${strategy}"
  }'`
}

// Minimal syntax colorizer
function CodeLine({ text, lang }: { text: string; lang: Language }) {
  const t = text.trimStart()
  let color = 'text-white/70'

  if (lang === 'curl') {
    if (t.startsWith('-H') || t.startsWith('-X') || t.startsWith('-d')) color = 'text-sky-400'
    else if (t.startsWith('"') || t.startsWith("'")) color = 'text-green-400/80'
    else if (t.startsWith('curl')) color = 'text-orange-400'
  } else {
    if (t.startsWith('import') || t.startsWith('from') || t.startsWith('const') || t.startsWith('print') || t.startsWith('console')) {
      color = 'text-orange-400'
    } else if (t.startsWith('client') || t.startsWith('result')) {
      color = 'text-sky-300'
    } else if (t.includes('"') || t.includes("'")) {
      color = 'text-green-400/80'
    }
  }

  return <span className={color}>{text}</span>
}

export function CodeGeneratorWidget() {
  const [lang, setLang]         = useState<Language>('python')
  const [cap, setCap]           = useState<Capability>('search')
  const [strategy, setStrategy] = useState<Strategy>('auto')
  const [copied, setCopied]     = useState(false)

  const code = generateCode(lang, cap, strategy)
  const filename = lang === 'python' ? 'example.py' : lang === 'javascript' ? 'example.mjs' : 'request.sh'

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const pillBase   = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border cursor-pointer'
  const pillOn     = 'bg-orange-500/15 border-orange-500/50 text-orange-300 ring-1 ring-orange-500/50'
  const pillOff    = 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:bg-white/[0.07] hover:border-white/[0.15] hover:text-white/70'

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm glass-card p-5 space-y-4 w-full">
      <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30">
        Build your request
      </div>

      <div className="space-y-3">
        {/* Language row */}
        <div className="flex items-start gap-2 flex-wrap sm:flex-nowrap">
          <span className="text-xs text-white/30 w-20 shrink-0 pt-1">Language</span>
          <div className="flex gap-1.5 flex-wrap">
            {LANGUAGES.map(l => (
              <button key={l.id} onClick={() => setLang(l.id)}
                className={`${pillBase} ${lang === l.id ? pillOn : pillOff}`}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Capability row */}
        <div className="flex items-start gap-2 flex-wrap sm:flex-nowrap">
          <span className="text-xs text-white/30 w-20 shrink-0 pt-1">Capability</span>
          <div className="flex gap-1.5 flex-wrap">
            {CAPABILITIES.map(c => (
              <button key={c.id} onClick={() => setCap(c.id)}
                className={`${pillBase} ${cap === c.id ? pillOn : pillOff}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Strategy row */}
        <div className="flex items-start gap-2 flex-wrap sm:flex-nowrap">
          <span className="text-xs text-white/30 w-20 shrink-0 pt-1">Strategy</span>
          <div className="flex gap-1.5 flex-wrap">
            {STRATEGIES.map(s => (
              <button key={s.id} onClick={() => setStrategy(s.id)}
                className={`${pillBase} ${strategy === s.id ? pillOn : pillOff}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-px bg-white/[0.06]" />

      {/* Code block */}
      <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-black/40">
        {/* Terminal chrome bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <span className="ml-2 text-[10px] text-white/20 font-mono">{filename}</span>
          </div>
          <button
            onClick={handleCopy}
            className="text-[11px] font-medium transition-all duration-200 active:scale-95
                       text-white/30 hover:text-white/70 select-none"
          >
            {copied
              ? <span className="text-green-400">✓ Copied</span>
              : 'Copy'}
          </button>
        </div>

        {/* Code lines */}
        <pre
          className="p-4 text-[12px] leading-relaxed overflow-x-auto"
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace" }}
        >
          {code.split('\n').map((line, i) => (
            <div key={i} className="min-h-[1.25rem]">
              <CodeLine text={line} lang={lang} />
            </div>
          ))}
        </pre>
      </div>

      <p className="text-[10px] text-white/20">
        Replace{' '}
        <span className="font-mono text-orange-400/70">YOUR_KEY</span>
        {' '}with your API key from{' '}
        <a href="/dashboard/router" className="text-white/40 hover:text-white/60 underline underline-offset-2">
          Settings
        </a>.
      </p>
    </div>
  )
}

// Default export for backward compatibility
export default CodeGeneratorWidget
