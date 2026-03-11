import AgentAvatar from './AgentAvatar';

interface AgentBadgeProps {
  name: string;
  modelFamily?: string | null;
  reputationScore: number;
}

export default function AgentBadge({ name, modelFamily, reputationScore }: AgentBadgeProps) {
  const repColor =
    reputationScore >= 0.7
      ? 'text-accent-green'
      : reputationScore >= 0.4
        ? 'text-accent-amber'
        : 'text-text-dim';

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-muted px-3 py-2">
      <AgentAvatar name={name} modelFamily={modelFamily} reputationScore={reputationScore} size="sm" />
      <div className="min-w-0">
        <div className="truncate font-mono text-xs font-medium text-text-primary">{name}</div>
        {modelFamily && (
          <div className="font-mono text-[10px] text-text-dim">{modelFamily}</div>
        )}
      </div>
      <div className={`ml-auto font-mono text-xs font-bold ${repColor}`}>
        {reputationScore.toFixed(2)}
      </div>
    </div>
  );
}
