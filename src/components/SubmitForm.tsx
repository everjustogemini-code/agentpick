'use client';

import { useState, type FormEvent } from 'react';

const CATEGORIES = [
  { value: 'search_research', label: 'Search & Research' },
  { value: 'web_crawling', label: 'Web Crawling' },
  { value: 'code_compute', label: 'Code & Compute' },
  { value: 'storage_memory', label: 'Storage & Memory' },
  { value: 'communication', label: 'Communication' },
  { value: 'payments_commerce', label: 'Payments & Commerce' },
  { value: 'finance_data', label: 'Finance Data' },
  { value: 'auth_identity', label: 'Auth & Identity' },
  { value: 'scheduling', label: 'Scheduling' },
  { value: 'ai_models', label: 'AI Models' },
  { value: 'observability', label: 'Observability' },
];

const inputClass =
  'w-full rounded-lg border border-border-default bg-bg-card px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-border-hover placeholder:text-text-dim';

export default function SubmitForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setError('');

    const form = new FormData(e.currentTarget);
    if (form.get('website')) return;

    const tagsRaw = (form.get('tags') as string) ?? '';
    const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 5);

    const body = {
      name: form.get('name'),
      tagline: form.get('tagline'),
      description: form.get('description'),
      category: form.get('category'),
      website_url: form.get('website_url'),
      docs_url: form.get('docs_url') || undefined,
      api_base_url: form.get('api_base_url') || undefined,
      tags: tags.length > 0 ? tags : undefined,
      submitter_email: form.get('submitter_email'),
    };

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? 'Submission failed');
      }
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl border border-accent-green/20 bg-green-50 p-8 text-center">
        <div className="mb-2 text-xl font-bold text-accent-green">Submitted!</div>
        <p className="text-sm text-text-secondary">
          Your product has been submitted for review. We&apos;ll notify you by email once it&apos;s approved.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      <div>
        <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
          Product Name *
        </label>
        <input name="name" required minLength={2} maxLength={100} className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
          Tagline *
        </label>
        <input name="tagline" required maxLength={80} placeholder="Max 80 characters" className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
          Description *
        </label>
        <textarea name="description" required maxLength={2000} rows={4} className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
          Category *
        </label>
        <select name="category" required className={inputClass}>
          <option value="">Select category</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
          Website URL *
        </label>
        <input name="website_url" type="url" required placeholder="https://..." className={inputClass} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
            Docs URL
          </label>
          <input name="docs_url" type="url" placeholder="https://docs...." className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
            API Base URL
          </label>
          <input name="api_base_url" type="url" placeholder="https://api...." className={inputClass} />
        </div>
      </div>

      <div>
        <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
          Tags (comma-separated, max 5)
        </label>
        <input name="tags" placeholder="search, rag, embeddings" className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.8px] text-text-dim">
          Your Email *
        </label>
        <input name="submitter_email" type="email" required placeholder="you@example.com" className={inputClass} />
      </div>

      {error && (
        <div className="rounded-lg border border-accent-red/20 bg-red-50 px-4 py-2 text-sm text-accent-red">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded-lg bg-button-primary-bg px-6 py-3 text-sm font-semibold text-button-primary-text transition-colors hover:opacity-90 disabled:opacity-50"
      >
        {status === 'submitting' ? 'Submitting...' : 'Submit Product'}
      </button>
    </form>
  );
}
