const LIFECYCLE_STEPS = [
  { key: 'capability', label: 'Capability', desc: 'Find agent-callable APIs ranked by real usage', live: true },
  { key: 'scenario', label: 'Scenario', desc: 'See which stack works best for YOUR use case', live: true },
  { key: 'trace', label: 'Trace', desc: 'Every ranking backed by verified API call traces', live: true },
  { key: 'policy', label: 'Policy', desc: 'Define rules: latency-first, cost-ceiling, fallback', live: false },
  { key: 'alert', label: 'Alert', desc: 'Get notified when your tools degrade', live: false },
];

const PAGE_HIGHLIGHTS: Record<string, string[]> = {
  arena: ['scenario'],
  xray: ['capability'],
  product: ['capability', 'trace'],
  replay: ['trace'],
  benchmarks: ['trace', 'scenario'],
  connect: ['policy', 'alert'],
};

export default function ToolLifecycle({
  activeContext,
  compact = false,
}: {
  activeContext?: string;
  compact?: boolean;
}) {
  const highlights = activeContext ? PAGE_HIGHLIGHTS[activeContext] || [] : [];

  return (
    <div className={`rounded-xl border border-border-default bg-white ${compact ? 'p-4' : 'p-5'}`}>
      <div className="mb-3 text-[13px] font-semibold text-text-primary">
        AgentPick covers your full tool lifecycle
      </div>
      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-5'}`}>
        {LIFECYCLE_STEPS.map((step) => {
          const isHighlighted = highlights.includes(step.key);
          return (
            <div
              key={step.key}
              className={`flex items-start gap-2 rounded-lg p-2.5 text-[12px] ${
                isHighlighted
                  ? 'bg-green-50'
                  : step.live
                    ? 'bg-bg-muted'
                    : 'bg-bg-muted opacity-50'
              }`}
            >
              <span className="mt-0.5 shrink-0 text-[12px]">
                {step.live ? '\u2705' : '\u25D0'}
              </span>
              <div>
                <div className={`font-semibold ${step.live ? 'text-text-primary' : 'text-text-dim'}`}>
                  {step.label}
                </div>
                <div className={`mt-0.5 text-[11px] leading-snug ${step.live ? 'text-text-muted' : 'text-text-dim'}`}>
                  {step.desc}
                </div>
                {!step.live && (
                  <div className="mt-1 font-mono text-[9px] text-text-dim">coming with SDK</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
