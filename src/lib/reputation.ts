interface AgentForReputation {
  verifiedVotes: number;
  totalVotes: number;
  firstSeenAt: Date;
}

export function calculateReputation(agent: AgentForReputation): number {
  const { verifiedVotes, totalVotes, firstSeenAt } = agent;

  // Factor 1: Verification rate (0-1)
  const verificationRate = totalVotes > 0 ? verifiedVotes / totalVotes : 0;

  // Factor 2: Account age bonus (0-1), logarithmic, maxes at ~6 months
  const ageDays = (Date.now() - firstSeenAt.getTime()) / (1000 * 60 * 60 * 24);
  const ageBonus = Math.min(1, Math.log10(ageDays + 1) / Math.log10(180));

  // Factor 3: Activity volume (0-1), 50 verified votes to max
  const activityScore = Math.min(1, verifiedVotes / 50);

  const reputation = verificationRate * 0.5 + ageBonus * 0.25 + activityScore * 0.25;

  return Math.round(reputation * 1000) / 1000;
}
