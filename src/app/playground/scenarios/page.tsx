import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Playground Scenarios — AgentPick',
  description: 'Pre-built test scenarios for the AgentPick API Playground.',
};

const SCENARIOS = [
  {
    id: 'finance',
    label: 'Finance Research',
    description: 'Stock data, earnings, and market analysis queries.',
    queries: ['AAPL earnings Q4 2024', 'TSLA price target 2025', 'NVDA revenue growth'],
    capability: 'search',
  },
  {
    id: 'legal',
    label: 'Legal & Compliance',
    description: 'Case law, regulations, and contract research.',
    queries: ['GDPR data retention requirements', 'SEC insider trading rules', 'copyright fair use doctrine'],
    capability: 'search',
  },
  {
    id: 'devtools',
    label: 'Developer Tools',
    description: 'API documentation, library comparisons, and code search.',
    queries: ['React hooks best practices', 'Next.js 15 server components', 'PostgreSQL full-text search'],
    capability: 'search',
  },
  {
    id: 'news',
    label: 'News & Events',
    description: 'Breaking news, product launches, and company announcements.',
    queries: ['AI startup funding 2024', 'OpenAI GPT-5 release', 'EU AI Act timeline'],
    capability: 'search',
  },
  {
    id: 'ecommerce',
    label: 'E-Commerce',
    description: 'Product research, pricing, and competitor analysis.',
    queries: ['best wireless earbuds under $100', 'Shopify vs WooCommerce comparison', 'dropshipping supplier list'],
    capability: 'search',
  },
  {
    id: 'science',
    label: 'Science & Research',
    description: 'Academic papers, experiments, and findings.',
    queries: ['CRISPR gene editing 2024', 'quantum computing error correction', 'mRNA vaccine efficacy studies'],
    capability: 'search',
  },
];

export default function PlaygroundScenariosPage() {
  return (
    <main className="bg-gray-950 min-h-screen pt-6 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <p className="uppercase tracking-widest text-xs text-cyan-400 mb-2">Demo Scenarios</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Playground Scenarios</h1>
          <p className="mt-2 text-gray-400 text-sm max-w-lg">
            Pre-built test scenarios for the AgentPick router. Pick one to try in the playground.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCENARIOS.map((scenario) => (
            <div
              key={scenario.id}
              className="bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-md"
            >
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-white font-semibold text-sm">{scenario.label}</h2>
                <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full font-mono">
                  {scenario.capability}
                </span>
              </div>
              <p className="text-gray-400 text-xs mb-3">{scenario.description}</p>
              <ul className="space-y-1 mb-4">
                {scenario.queries.map((q) => (
                  <li key={q} className="text-gray-300 text-xs font-mono bg-black/30 px-2 py-1 rounded">
                    &ldquo;{q}&rdquo;
                  </li>
                ))}
              </ul>
              <Link
                href={`/playground?scenario=${scenario.id}`}
                className="inline-block text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-3 py-1.5 rounded-lg transition-all"
              >
                Try in Playground →
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/playground" className="text-cyan-400 text-sm hover:text-cyan-300 underline underline-offset-2">
            ← Back to Playground
          </Link>
        </div>
      </div>
    </main>
  );
}
