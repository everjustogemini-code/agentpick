'use client';

const STRATEGIES = [
  {
    id: 'auto',
    name: 'auto',
    badge: '★ AI',
    description: 'Adapts per query',
    metrics: null,
    highlight: true,
  },
  {
    id: 'balanced',
    name: 'balanced',
    badge: null,
    description: 'Best quality/cost ratio',
    metrics: { cost: '$0.001', quality: '4.4/5', latency: '240ms' },
    highlight: false,
  },
  {
    id: 'best_quality',
    name: 'best quality',
    badge: null,
    description: 'Highest accuracy',
    metrics: { cost: '$0.002', quality: '4.6/5', latency: '315ms' },
    highlight: false,
  },
  {
    id: 'cheapest',
    name: 'cheapest',
    badge: null,
    description: 'Lowest cost',
    metrics: { cost: '$0.0005', quality: '3.0/5', latency: '89ms' },
    highlight: false,
  },
  {
    id: 'most_stable',
    name: 'most stable',
    badge: null,
    description: 'Maximum uptime',
    metrics: { cost: '$0.001', quality: '4.2/5', latency: '182ms', extra: '99.8% up' },
    highlight: false,
  },
];

export default function StrategyCards() {
  return (
    <section className="py-12">
      <h2 className="mb-2 text-[28px] font-bold tracking-[-0.5px] text-text-primary">
        Pick your routing strategy
      </h2>
      <p className="mb-8 text-[15px] text-text-secondary">
        &ldquo;auto&rdquo; is recommended. AI classifies each query and picks the optimal tool.
      </p>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {STRATEGIES.map((s) => (
          <div
            key={s.id}
            className={`card flex min-w-[180px] shrink-0 flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
              s.highlight ? 'border-accent ring-1 ring-accent/20' : ''
            }`}
          >
            <div className="mb-1 font-mono text-[15px] font-bold text-text-primary">
              {s.name}
            </div>
            {s.badge && (
              <span className="mb-2 inline-block w-fit rounded bg-accent-subtle px-1.5 py-0.5 font-mono text-[10px] font-semibold text-accent">
                {s.badge}
              </span>
            )}
            <p className="mb-4 text-[13px] text-text-secondary">{s.description}</p>
            {s.metrics && (
              <div className="mt-auto space-y-1.5 border-t border-border pt-3">
                <div className="font-mono text-[13px] text-text-secondary">
                  <span className="data-value !text-[14px]">{s.metrics.cost}</span>
                  <span className="ml-1 text-text-tertiary">/call</span>
                </div>
                <div className="font-mono text-[12px] text-text-secondary">
                  {s.metrics.quality} · {s.metrics.latency}
                </div>
                {s.metrics.extra && (
                  <div className="font-mono text-[11px] text-success">
                    {s.metrics.extra}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
