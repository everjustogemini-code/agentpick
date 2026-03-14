'use client';

import { useState } from 'react';

const LANGUAGES = ['Python', 'JavaScript', 'curl'] as const;
const CAPABILITIES = ['search', 'crawl', 'finance', 'embed'] as const;
const STRATEGIES = ['auto', 'balanced', 'best_performance', 'cheapest', 'most_stable'] as const;

type Language = typeof LANGUAGES[number];
type Capability = typeof CAPABILITIES[number];
type Strategy = typeof STRATEGIES[number];

const SAMPLE_QUERIES: Record<Capability, string> = {
  search: 'latest AI research papers',
  crawl: 'https://example.com',
  finance: 'NVDA earnings Q4 2025',
  embed: 'semantic search text',
};

function buildCode(lang: Language, cap: Capability, strat: Strategy): string {
  const q = SAMPLE_QUERIES[cap];
  if (lang === 'Python') {
    return `import agentpick\n\nclient = agentpick.Client(api_key="YOUR_KEY")\n\nresult = client.${cap}(\n    query="${q}",\n    strategy="${strat}"\n)\n\nprint(result)`;
  }
  if (lang === 'JavaScript') {
    return `import AgentPick from 'agentpick';\n\nconst client = new AgentPick({ apiKey: 'YOUR_KEY' });\n\nconst result = await client.${cap}({\n  query: '${q}',\n  strategy: '${strat}',\n});\n\nconsole.log(result);`;
  }
  // curl
  return `curl -X POST https://agentpick.dev/api/v1/route/${cap} \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "query": "${q}",\n    "strategy": "${strat}"\n  }'`;
}

function pill(active: boolean) {
  return `rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 border ${
    active
      ? 'bg-orange-500/15 text-orange-400 border-orange-500/50 ring-1 ring-orange-500/50'
      : 'border-white/[0.08] bg-white/[0.04] text-white/50 hover:bg-white/[0.07] hover:text-white/70'
  }`;
}

export default function CodeGeneratorWidget() {
  const [lang, setLang] = useState<Language>('Python');
  const [cap, setCap] = useState<Capability>('search');
  const [strat, setStrat] = useState<Strategy>('auto');
  const [copied, setCopied] = useState(false);

  const code = buildCode(lang, cap, strat);
  const filename = lang === 'Python' ? 'main.py' : lang === 'JavaScript' ? 'index.js' : 'request.sh';

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 shadow-glass backdrop-blur-sm">
      {/* Header */}
      <div className="mb-4 font-mono text-[10px] uppercase tracking-[1.5px] text-white/30">
        Build your request
      </div>

      {/* Configurator */}
      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 shrink-0 text-xs text-white/30">Language</span>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGES.map(l => (
              <button key={l} onClick={() => setLang(l)} className={pill(lang === l)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 shrink-0 text-xs text-white/30">Capability</span>
          <div className="flex flex-wrap gap-1.5">
            {CAPABILITIES.map(c => (
              <button key={c} onClick={() => setCap(c)} className={pill(cap === c)}>{c}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 shrink-0 text-xs text-white/30">Strategy</span>
          <div className="flex flex-wrap gap-1.5">
            {STRATEGIES.map(s => (
              <button key={s} onClick={() => setStrat(s)} className={pill(strat === s)}>
                {s}{s === 'auto' ? ' ★' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Code block with terminal chrome */}
      <div>
        <div className="flex items-center gap-2 rounded-t-lg border border-b-0 border-white/[0.06] bg-white/[0.03] px-4 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          <span className="ml-2 font-mono text-[11px] text-white/20">{filename}</span>
          <button
            onClick={handleCopy}
            className="ml-auto flex items-center gap-1.5 rounded border border-white/[0.08]
                       bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium
                       text-white/40 transition-all duration-150 hover:text-white/70"
          >
            {copied ? <span className="text-green-400">✓ Copied</span> : 'Copy'}
          </button>
        </div>
        <div className="overflow-x-auto rounded-b-lg border border-white/[0.06] bg-[#0d0d14] p-4 font-mono text-[13px] leading-relaxed">
          <SyntaxHighlight code={code} language={lang} />
        </div>
      </div>
    </div>
  );
}

function SyntaxHighlight({ code, language }: { code: string; language: Language }) {
  return (
    <div>
      {code.split('\n').map((line, i) => (
        <div key={i} className="min-h-[1.5rem]">
          <HighlightLine line={line} language={language} />
        </div>
      ))}
    </div>
  );
}

function HighlightLine({ line }: { line: string; language: Language }) {
  if (line.trim().startsWith('#') || line.trim().startsWith('//')) {
    return <span className="text-gray-500">{line}</span>;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  const push = (text: string, cls: string) => {
    if (text) parts.push(<span key={key++} className={cls}>{text}</span>);
  };

  const tokenRe = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:import|from|const|await|async|function|return|print|console\.log)\b|\b\w+(?=\())/g;
  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(line)) !== null) {
    push(line.slice(lastIndex, match.index), 'text-white/70');
    const token = match[0];
    if (token.startsWith('"') || token.startsWith("'")) {
      push(token, 'text-green-400');
    } else if (/^(import|from|const|await|async|function|return|print|console\.log)$/.test(token)) {
      push(token, 'text-blue-400');
    } else {
      push(token, 'text-orange-300');
    }
    lastIndex = match.index + token.length;
  }
  push(line.slice(lastIndex), 'text-white/70');
  return <>{parts}</>;
}
