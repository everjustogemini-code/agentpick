import type { ReactNode } from 'react';

export type StepStatus = 'pending' | 'active' | 'complete';

export interface WorkspaceStep {
  label: string;
  status: StepStatus;
  detail?: string;
  subItems?: { text: string }[];
}

export interface AgentWorkspaceProps {
  steps: WorkspaceStep[];
  currentStepIndex: number;
  workspaceContent: ReactNode;
  progress: number; // 0-100
  elapsed?: string; // "0:12"
  total?: string; // "0:30" (replay only)
  controls?: 'arena' | 'replay';
  speed?: number;
  playing?: boolean;
  onSpeedChange?: (speed: number) => void;
  onSeek?: (fraction: number) => void;
  onPlayPause?: () => void;
  title?: string;
  subtitle?: string;
  statusMessage?: string;
}

export type WorkspaceView = 'empty' | 'api_call' | 'response' | 'evaluation' | 'scores' | 'custom';

export interface ApiCallCardProps {
  method?: string;
  url: string;
  body?: Record<string, unknown>;
  waiting?: boolean;
}

export interface ResponseCardProps {
  latencyMs: number;
  statusCode: number;
  success: boolean;
  resultCount: number;
  results?: { title: string; url: string }[];
}

export interface EvaluationCardProps {
  evaluator?: string | null;
  reasoning: string;
  typedChars: number;
}

export interface ScoreCardProps {
  scores: { label: string; value: number | null; max: number }[];
  animate?: boolean;
  latencyMs?: number;
  costUsd?: number | null;
  voteSignal?: 'up' | 'down' | null;
}
