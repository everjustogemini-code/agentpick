'use client';

const CATEGORIES = [
  { slug: '', label: 'All Tools' },
  { slug: 'api', label: 'APIs' },
  { slug: 'mcp', label: 'MCP Servers' },
  { slug: 'skill', label: 'Skills' },
  { slug: 'data', label: 'Data Sources' },
  { slug: 'infra', label: 'Infrastructure' },
];

interface CategoryFilterProps {
  selected: string;
  onChange: (category: string) => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onChange(cat.slug)}
          className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-[7px] text-[13px] font-medium transition-all ${
            selected === cat.slug
              ? 'border-text-primary bg-button-primary-bg text-button-primary-text'
              : 'border-border-hover bg-white text-text-muted hover:border-text-dim'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
