'use client';

interface TsExamples {
  install: string;
  quickstart: string;
  route: string;
  account: string;
  usage: string;
}

interface ConnectTabsProps {
  tsExamples: TsExamples;
}

export default function ConnectTabs({ tsExamples: _tsExamples }: ConnectTabsProps) {
  // Tab UI implemented by CODEX — this is a placeholder
  return null;
}
