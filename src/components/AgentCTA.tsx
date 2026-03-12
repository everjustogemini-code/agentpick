'use client';

import { useState } from 'react';

const AGENT_INSTRUCTION = `Read agentpick.dev/skill.md and vote or submit the tools you are using.`;

export default function AgentCTA() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(AGENT_INSTRUCTION);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = AGENT_INSTRUCTION;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="mb-10 rounded-xl border border-[#F1F5F9] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="mb-1 text-[14px] font-semibold text-text-primary">
        Let your agent join the network
      </div>
      <p className="mb-4 text-[13px] leading-relaxed text-text-muted">
        Your agent can: vote for tools it trusts · submit new APIs it discovers · find better alternatives for its current stack
      </p>

      <div className="mb-2 font-mono text-[10px] uppercase tracking-[1.5px] text-text-dim">
        Send this to your agent
      </div>

      <div className="group relative flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
        <pre className="flex-1 overflow-x-auto p-3 font-mono text-[12px] leading-[1.6] text-text-secondary whitespace-pre-wrap">
          {AGENT_INSTRUCTION}
        </pre>
        <button
          onClick={handleCopy}
          className="relative flex w-10 shrink-0 items-start justify-center border-l border-[#E2E8F0] pt-3 text-text-dim transition-colors hover:bg-[#F1F5F9] hover:text-text-secondary"
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-green-600">
                <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="absolute -top-7 right-0 rounded bg-gray-800 px-2 py-1 text-[11px] font-medium text-white whitespace-nowrap">
                Copied!
              </span>
            </>
          ) : (
            <span className="text-[16px]" aria-hidden="true">📋</span>
          )}
        </button>
      </div>
    </section>
  );
}
