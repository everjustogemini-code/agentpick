'use client';

import type { AgentWorkspaceProps } from '@/types/workspace';
import WorkspaceStepList from './WorkspaceStepList';
import WorkspaceProgressBar from './WorkspaceProgressBar';
import ReplayControls from './ReplayControls';

export default function AgentWorkspace({
  steps,
  workspaceContent,
  progress,
  elapsed,
  total,
  controls,
  speed = 1,
  playing = false,
  onSpeedChange,
  onSeek,
  onPlayPause,
  title,
  subtitle,
  statusMessage,
}: AgentWorkspaceProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xl">
      {/* Header */}
      {(title || subtitle) && (
        <div className="border-b border-border-default bg-bg-page px-5 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-button-primary-bg text-[10px] font-bold text-white">
                  &#x2B21;
                </div>
                {title && <span className="text-[13px] font-bold text-text-primary">{title}</span>}
              </div>
              {subtitle && (
                <div className="mt-0.5 font-mono text-[11px] text-text-dim">{subtitle}</div>
              )}
            </div>
            {controls === 'replay' && (
              <div className="flex items-center gap-2">
                {[1, 2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => onSpeedChange?.(s)}
                    className={`rounded px-2 py-0.5 font-mono text-[10px] font-medium transition-colors ${
                      speed === s
                        ? 'bg-button-primary-bg text-white'
                        : 'bg-bg-muted text-text-dim hover:bg-gray-200'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Split workspace */}
      <div className="grid min-h-[420px] grid-cols-1 md:grid-cols-[280px_1fr]">
        {/* Left panel — Task Progress */}
        <div className="border-b border-border-default bg-bg-page p-4 md:border-b-0 md:border-r">
          {/* Mobile: compact horizontal dots */}
          <div className="md:hidden">
            <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    step.status === 'active'
                      ? 'bg-amber-100 text-amber-700'
                      : step.status === 'complete'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-text-dim'
                  }`}
                >
                  {step.status === 'complete' ? '\u2713' : step.status === 'active' ? '\u25CF' : '\u25CB'}{' '}
                  {step.label.length > 20 ? step.label.slice(0, 18) + '...' : step.label}
                </div>
              ))}
            </div>
          </div>
          {/* Desktop: full step list */}
          <div className="hidden md:block">
            <WorkspaceStepList steps={steps} />
          </div>
        </div>

        {/* Right panel — Agent Workspace */}
        <div className="flex flex-col bg-[#F8FAFC] p-5">
          <div className="mb-2 font-mono text-[9px] font-semibold uppercase tracking-[1.5px] text-text-dim">
            Agent Workspace
          </div>
          <div className="flex-1">{workspaceContent}</div>
          {statusMessage && (
            <div className="mt-4 rounded-lg bg-white/60 px-3 py-2">
              <span className="font-mono text-[11px] text-text-secondary">{statusMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      {controls === 'replay' ? (
        <ReplayControls
          progress={progress}
          elapsed={elapsed ?? '0:00'}
          total={total ?? '0:00'}
          playing={playing}
          speed={speed}
          onSeek={onSeek}
          onPlayPause={onPlayPause}
          onSpeedChange={onSpeedChange}
        />
      ) : (
        <WorkspaceProgressBar progress={progress} elapsed={elapsed} />
      )}
    </div>
  );
}
