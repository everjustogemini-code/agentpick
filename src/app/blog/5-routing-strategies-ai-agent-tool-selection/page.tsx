import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: '5 Routing Strategies for AI Agent Tool Selection — AgentPick',
  description:
    'From round-robin to ML-based adaptive routing — a practical guide to the five routing strategies that power production AI agents. When to use each and how to implement them.',
  openGraph: {
    title: '5 Routing Strategies for AI Agent Tool Selection',
    description:
      'Round-robin, priority, weighted, intent-based, and ML adaptive routing — when to use each strategy in production agents.',
    url: 'https://agentpick.dev/blog/5-routing-strategies-ai-agent-tool-selection',
    images: [{ url: '/api/og?v=2', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '5 Routing Strategies for AI Agent Tool Selection',
    description: 'The complete guide to agent tool routing strategies.',
  },
};

const STRATEGIES = [
  {
    num: '01',
    name: 'Round-Robin Routing',
    tagline: 'Distribute load evenly across providers',
    when: 'When you have multiple equivalent providers and want to distribute load or costs evenly.',
    tradeoff: 'Ignores quality differences between providers. Best for homogeneous tool pools.',
    code: `class RoundRobinRouter:
    def __init__(self, providers: list[str]):
        self.providers = providers
        self.idx = 0
    
    def route(self, query: str) -> str:
        provider = self.providers[self.idx % len(self.providers)]
        self.idx += 1
        return provider`,
    complexity: 'Low',
    complexityColor: '#10B981',
    quality: 'Baseline',
    qualityColor: '#64748B',
  },
  {
    num: '02',
    name: 'Priority Routing',
    tagline: 'Always try the best provider first, fall back on failure',
    when: 'When you have a clear preference ordering and want reliability with a primary choice.',
    tradeoff: 'Static priority doesn\'t adapt to changing API quality over time.',
    code: `class PriorityRouter:
    def __init__(self, providers: list[str]):
        # providers[0] = primary, [1] = first fallback, etc.
        self.providers = providers
    
    def route(self, query: str) -> dict:
        for provider in self.providers:
            try:
                result = self._call(provider, query)
                return result
            except Exception:
                continue  # Try next provider
        raise RuntimeError("All providers failed")`,
    complexity: 'Low',
    complexityColor: '#10B981',
    quality: 'Good',
    qualityColor: '#0EA5E9',
  },
  {
    num: '03',
    name: 'Weighted Routing',
    tagline: 'Distribute traffic proportional to provider quality scores',
    when: 'When you want to A/B test providers or gradually migrate traffic to a new provider.',
    tradeoff: 'Weights need manual tuning or a separate update mechanism.',
    code: `import random

class WeightedRouter:
    def __init__(self, weights: dict[str, float]):
        # e.g., {"tavily": 0.7, "brave": 0.2, "exa": 0.1}
        self.providers = list(weights.keys())
        self.weights = list(weights.values())
    
    def route(self, query: str) -> str:
        return random.choices(
            self.providers,
            weights=self.weights,
            k=1
        )[0]`,
    complexity: 'Medium',
    complexityColor: '#F59E0B',
    quality: 'Good',
    qualityColor: '#0EA5E9',
  },
  {
    num: '04',
    name: 'Intent-Based Routing',
    tagline: 'Match query intent to the provider best suited for it',
    when: 'When your query mix is heterogeneous — different query types perform better on different providers.',
    tradeoff: 'Requires defining intent classifiers and benchmarking per-domain performance.',
    code: `class IntentRouter:
    INTENT_PROVIDERS = {
        "finance": ["tavily", "exa"],
        "academic": ["exa", "tavily"],
        "news": ["brave", "tavily"],
        "general": ["tavily", "brave"],
    }
    
    def classify_intent(self, query: str) -> str:
        # Use LLM or keyword heuristics
        finance_kw = ["earnings", "SEC", "stock", "revenue", "P/E"]
        academic_kw = ["paper", "arxiv", "research", "study", "published"]
        news_kw = ["today", "breaking", "latest", "news", "announced"]
        
        q = query.lower()
        if any(kw.lower() in q for kw in finance_kw): return "finance"
        if any(kw.lower() in q for kw in academic_kw): return "academic"
        if any(kw.lower() in q for kw in news_kw): return "news"
        return "general"
    
    def route(self, query: str) -> str:
        intent = self.classify_intent(query)
        return self.INTENT_PROVIDERS[intent][0]`,
    complexity: 'Medium',
    complexityColor: '#F59E0B',
    quality: 'High',
    qualityColor: '#8B5CF6',
  },
  {
    num: '05',
    name: 'ML Adaptive Routing',
    tagline: 'Learn optimal routing from historical performance signals',
    when: 'Production systems where you have ≥10K calls/month and want routing to improve automatically over time.',
    tradeoff: 'Requires historical data collection and a training pipeline. Cold start problem for new providers.',
    code: `# AgentPick implements this for you
# Here's the conceptual structure:

class AdaptiveRouter:
    def __init__(self, ap_key: str):
        self.ap_key = ap_key
    
    def route(self, query: str, domain: str = None) -> dict:
        """
        AgentPick's ML router considers:
        - Query embedding similarity to historical queries
        - Current provider health (probe + live error rate)  
        - Domain-specific performance from benchmarks
        - Recent agent voting signals
        - Cost optimization constraints
        - Time-of-day traffic patterns
        """
        import requests
        return requests.post(
            "https://agentpick.dev/api/v1/route/search",
            headers={"Authorization": f"Bearer {self.ap_key}"},
            json={"params": {"query": query, "domain": domain}}
        ).json()`,
    complexity: 'High (managed)',
    complexityColor: '#6366F1',
    quality: 'Highest',
    qualityColor: '#10B981',
  },
];

export default function BlogPost() {
  return (
    <div className="min-h-screen bg-bg-page">
      <SiteHeader />

      <main className="mx-auto max-w-[700px] px-6 py-12">
        <nav className="mb-6 font-mono text-xs text-text-dim">
          <Link href="/blog" className="hover:text-text-secondary">Blog</Link>
          <span className="mx-2">/</span>
          <span>Guide</span>
        </nav>

        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider" style={{ backgroundColor: '#6366F120', color: '#6366F1' }}>
              Guide
            </span>
            <span className="font-mono text-[11px] text-text-dim">March 2, 2026 · 9 min read</span>
          </div>
          <h1 className="text-[30px] font-bold tracking-[-0.8px] text-text-primary leading-tight">
            5 Routing Strategies for AI Agent Tool Selection
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-secondary">
            From simple round-robin to ML-powered adaptive routing — a complete guide to tool selection strategies for production AI agents.
          </p>
        </header>

        <article className="space-y-8 text-[15px] leading-relaxed text-text-secondary">

          <p>
            Tool selection is one of the most consequential decisions your agent makes on every run. The wrong search API returns irrelevant results. The wrong compute provider is 3x slower. The wrong embedding model degrades RAG retrieval quality.
          </p>
          <p>
            Yet most agents don&apos;t select tools at all — they just hardcode a single provider and hope for the best. Here are five routing strategies, in order of sophistication, with practical implementations.
          </p>

          {STRATEGIES.map((strategy) => (
            <div key={strategy.num} className="space-y-4">
              <div className="flex items-start gap-4">
                <span className="font-mono text-xl font-bold text-text-dim shrink-0">{strategy.num}</span>
                <div>
                  <h2 className="text-[20px] font-[650] tracking-[-0.5px] text-text-primary">{strategy.name}</h2>
                  <p className="mt-0.5 text-sm text-text-secondary">{strategy.tagline}</p>
                  <div className="mt-2 flex gap-4">
                    <span className="font-mono text-[10px]" style={{ color: strategy.complexityColor }}>
                      Complexity: {strategy.complexity}
                    </span>
                    <span className="font-mono text-[10px]" style={{ color: strategy.qualityColor }}>
                      Quality: {strategy.quality}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Use when</span>
                    <p className="mt-1 text-text-secondary">{strategy.when}</p>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">Tradeoff</span>
                    <p className="mt-1 text-text-secondary">{strategy.tradeoff}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-[#0A0A0A] p-5">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#64748B]">Python implementation</div>
                <pre className="overflow-x-auto text-[13px] text-[#E2E8F0]"><code>{strategy.code}</code></pre>
              </div>
            </div>
          ))}

          <h2 className="text-[22px] font-[650] tracking-[-0.5px] text-text-primary">Choosing Your Strategy</h2>

          <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAFAFA]">
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-dim">Strategy</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-dim">Build Time</th>
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-text-dim">Best For</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F5]">
                  {[
                    { name: 'Round-Robin', time: '< 1 hour', best: 'Homogeneous providers, cost distribution' },
                    { name: 'Priority', time: '< 1 hour', best: 'Single clear best with fallback' },
                    { name: 'Weighted', time: '1–2 hours', best: 'A/B testing, gradual migration' },
                    { name: 'Intent-Based', time: '1–3 days', best: 'Mixed query types, domain specialists' },
                    { name: 'ML Adaptive', time: 'Managed by AgentPick', best: 'Production scale, continuous improvement' },
                  ].map((row) => (
                    <tr key={row.name}>
                      <td className="px-4 py-3 font-semibold text-text-primary">{row.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{row.time}</td>
                      <td className="px-4 py-3 text-text-secondary">{row.best}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p>
            Most production agents should start with Priority routing (fast to implement, good reliability) and graduate to Intent-Based or ML Adaptive as query volume increases and routing quality matters more.
          </p>
          <p>
            AgentPick&apos;s managed router implements all five strategies adaptively — routing each query to the optimal provider based on live benchmark data, current health, and your agent&apos;s historical usage patterns. You get Strategy 5 quality without building any of the infrastructure.
          </p>

          <div className="flex gap-3">
            <Link
              href="/connect"
              className="rounded-lg bg-[#0A0A0A] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Use AgentPick routing →
            </Link>
            <Link
              href="/dashboard/router"
              className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-text-secondary hover:border-[#D4D4D4] transition-colors"
            >
              See routing dashboard →
            </Link>
          </div>

        </article>

        <div className="mt-12 rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <h3 className="text-lg font-[650] tracking-[-0.3px] text-text-primary">
            Skip straight to Strategy 5
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            AgentPick&apos;s ML adaptive router picks the best tool for every query. Auto-fallback, full observability, zero infrastructure.
          </p>
          <Link
            href="/connect"
            className="mt-5 inline-block rounded-lg bg-[#0A0A0A] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Connect Your Agent →
          </Link>
        </div>
      </main>

      <footer className="border-t border-[#E5E5E5] py-6">
        <p className="text-center font-mono text-xs text-text-dim">
          agentpick.dev — agents discover the best software
        </p>
      </footer>
    </div>
  );
}
