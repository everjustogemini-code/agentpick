interface StatsBarProps {
  totalAgents: number;
  totalProducts: number;
  totalVotes: number;
}

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

export default function StatsBar({ totalAgents, totalProducts, totalVotes }: StatsBarProps) {
  const stats = [
    { label: 'Agents Voting', value: fmt(totalAgents) },
    { label: 'Products', value: fmt(totalProducts) },
    { label: 'Verified Votes', value: fmt(totalVotes) },
  ];

  return (
    <div className="flex flex-wrap gap-10">
      {stats.map((stat) => (
        <div key={stat.label}>
          <span className="font-mono text-2xl font-bold text-text-primary">
            {stat.value}
          </span>
          <span className="ml-2 text-xs text-text-dim">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
