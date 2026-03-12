'use client';

import type { WorkspaceStep, StepStatus } from '@/types/workspace';

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'complete') {
    return (
      <span className="inline-flex animate-[greenFlash_0.4s_ease-out] rounded-full text-[14px]">
        &#x2705;
      </span>
    );
  }
  if (status === 'active') {
    return <span className="inline-block h-3.5 w-3.5 animate-pulse rounded-full bg-amber-400" />;
  }
  return <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-gray-300" />;
}

export default function WorkspaceStepList({ steps }: { steps: WorkspaceStep[] }) {
  return (
    <div>
      <div className="mb-4 font-mono text-[9px] font-semibold uppercase tracking-[1.5px] text-text-dim">
        Task Progress
      </div>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="mt-0.5 shrink-0">
              <StepIcon status={step.status} />
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={`text-[13px] ${
                  step.status === 'active'
                    ? 'font-medium text-text-primary'
                    : step.status === 'complete'
                      ? 'text-text-secondary'
                      : 'text-text-dim'
                }`}
              >
                {step.label}
              </div>
              {step.detail && step.status !== 'pending' && (
                <div className="mt-0.5 truncate font-mono text-[11px] text-text-dim">{step.detail}</div>
              )}
              {step.subItems && step.subItems.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {step.subItems.map((item, si) => (
                    <div key={si} className="font-mono text-[10px] text-text-dim">
                      {item.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Step counter */}
      <div className="mt-5">
        <div className="font-mono text-[10px] text-text-dim">
          {steps.filter((s) => s.status === 'complete').length} / {steps.length} steps
        </div>
      </div>
    </div>
  );
}
