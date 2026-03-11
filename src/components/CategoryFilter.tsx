'use client';

const CATEGORIES = [
  { slug: '', label: 'All Tools' },
  { slug: 'search_research', label: 'Search & Research' },
  { slug: 'web_crawling', label: 'Web Crawling' },
  { slug: 'code_compute', label: 'Code & Compute' },
  { slug: 'storage_memory', label: 'Storage & Memory' },
  { slug: 'communication', label: 'Communication' },
  { slug: 'payments_commerce', label: 'Payments' },
  { slug: 'finance_data', label: 'Finance Data' },
  { slug: 'auth_identity', label: 'Auth & Identity' },
  { slug: 'scheduling', label: 'Scheduling' },
  { slug: 'ai_models', label: 'AI Models' },
  { slug: 'observability', label: 'Observability' },
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
