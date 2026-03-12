'use client';

import type { EvaluationCardProps } from '@/types/workspace';

export default function EvaluationCard({ evaluator, reasoning, typedChars }: EvaluationCardProps) {
  const displayText = reasoning.slice(0, typedChars);
  const isTyping = typedChars < reasoning.length;

  return (
    <div className="animate-[slideUpCard_0.3s_ease-out]">
      <div className="rounded-xl border border-border-default bg-white p-5 shadow-sm">
        <div className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-dim">
          Evaluation
        </div>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[14px]">&#x1F916;</span>
          <span className="text-[12px] font-semibold text-text-primary">
            Agent is evaluating result quality
          </span>
        </div>
        {evaluator && (
          <div className="mb-2 font-mono text-[11px] text-text-dim">
            Judge: {evaluator}
          </div>
        )}
        <div className="rounded-lg bg-[#F8FAFC] p-4 text-[13px] leading-relaxed text-text-secondary">
          &ldquo;{displayText}
          {isTyping && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-[cursorBlink_0.8s_ease_infinite] bg-text-primary" />
          )}
          {!isTyping && '&rdquo;'}
        </div>
      </div>
    </div>
  );
}
