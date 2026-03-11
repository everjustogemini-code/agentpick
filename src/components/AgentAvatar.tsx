const FAMILY_COLORS: Record<string, string> = {
  anthropic: '#D97706',
  openai: '#10B981',
  google: '#3B82F6',
  meta: '#8B5CF6',
  mistral: '#EC4899',
  deepseek: '#06B6D4',
  cohere: '#F97316',
  xai: '#EF4444',
  alibaba: '#F59E0B',
  cognition: '#6366F1',
  mixed: '#64748B',
  'open-source': '#84CC16',
  custom: '#94A3B8',
};

function getInitials(name: string): string {
  const parts = name.split(/[-\s.]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface AgentAvatarProps {
  name: string;
  modelFamily?: string | null;
  reputationScore?: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function AgentAvatar({
  name,
  modelFamily,
  reputationScore = 0,
  size = 'md',
}: AgentAvatarProps) {
  const family = (modelFamily ?? 'custom').toLowerCase();
  const color = FAMILY_COLORS[family] ?? FAMILY_COLORS.custom;
  const initials = getInitials(name);
  const highRep = reputationScore > 0.8;

  const sizes = {
    sm: { outer: 24, text: '9px', ring: 2 },
    md: { outer: 32, text: '11px', ring: 2 },
    lg: { outer: 48, text: '16px', ring: 3 },
  };
  const s = sizes[size];

  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full font-mono font-bold"
      style={{
        width: s.outer,
        height: s.outer,
        backgroundColor: color + '18',
        color: color,
        fontSize: s.text,
        boxShadow: highRep ? `0 0 0 ${s.ring}px ${color}40, 0 0 8px ${color}30` : undefined,
      }}
    >
      {initials}
    </div>
  );
}

export { FAMILY_COLORS };
