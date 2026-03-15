'use client';

import { useEffect, useMemo, useState } from 'react';

interface ByokPanelProps {
  apiKey: string;
  onAuthError: () => void;
}

interface ByokCatalogItem {
  service: string;
  displayName: string;
  placeholder: string;
}

interface ByokKeyItem {
  service: string;
  displayName: string;
  keyPreview: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
}

interface ByokSummary {
  activeKeys: number;
  totalKeys: number;
  services: string[];
  estimatedSavingsUsd: number;
  byokCalls: number;
  lastByokAt: string | null;
  lastToolUsed: string | null;
}

interface ByokResponse {
  keys: ByokKeyItem[];
  catalog: ByokCatalogItem[];
  summary: ByokSummary;
}

function authHeaders(apiKey: string, includeJson = false) {
  return {
    Authorization: `Bearer ${apiKey}`,
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 100 ? 0 : 4,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return 'No BYOK traffic yet';
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ByokPanel({ apiKey, onAuthError }: ByokPanelProps) {
  const [catalog, setCatalog] = useState<ByokCatalogItem[]>([]);
  const [keys, setKeys] = useState<ByokKeyItem[]>([]);
  const [summary, setSummary] = useState<ByokSummary | null>(null);
  const [selectedService, setSelectedService] = useState('');
  const [draftKey, setDraftKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadKeys() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/router/keys', {
        headers: authHeaders(apiKey),
      });

      if (response.status === 401) {
        onAuthError();
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message ?? data?.message ?? 'Unable to load saved keys.');
      }

      const data = (await response.json()) as ByokResponse;
      setCatalog(data.catalog);
      setKeys(data.keys);
      setSummary(data.summary);
      if (!selectedService && data.catalog[0]) {
        setSelectedService(data.catalog[0].service);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load saved keys.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  const selectedDefinition = useMemo(
    () => catalog.find((item) => item.service === selectedService) ?? null,
    [catalog, selectedService],
  );

  const existingKey = useMemo(
    () => keys.find((item) => item.service === selectedService) ?? null,
    [keys, selectedService],
  );

  async function handleSaveKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!selectedService) {
      setError('Choose a provider first.');
      return;
    }

    if (draftKey.trim().length < 6) {
      setError('Enter the API key you want AgentPick to use.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/v1/router/keys', {
        method: 'POST',
        headers: authHeaders(apiKey, true),
        body: JSON.stringify({
          service: selectedService,
          api_key: draftKey.trim(),
        }),
      });

      if (response.status === 401) {
        onAuthError();
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message ?? data?.message ?? 'Unable to save key.');
      }

      setDraftKey('');
      setMessage(existingKey ? 'Saved key rotated.' : 'Saved key added.');
      await loadKeys();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save key.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(service: string, nextStatus: 'active' | 'inactive') {
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/v1/router/keys', {
        method: 'PATCH',
        headers: authHeaders(apiKey, true),
        body: JSON.stringify({
          service,
          status: nextStatus,
        }),
      });

      if (response.status === 401) {
        onAuthError();
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message ?? data?.message ?? 'Unable to update key.');
      }

      setMessage(nextStatus === 'active' ? 'Key activated.' : 'Key paused.');
      await loadKeys();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Unable to update key.');
    }
  }

  async function handleDelete(service: string) {
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/v1/router/keys', {
        method: 'DELETE',
        headers: authHeaders(apiKey, true),
        body: JSON.stringify({ service }),
      });

      if (response.status === 401) {
        onAuthError();
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message ?? data?.message ?? 'Unable to delete key.');
      }

      setMessage('Saved key removed.');
      await loadKeys();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete key.');
    }
  }

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white/88 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            BYOK
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
            Bring your own tool keys.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Save provider keys once and AgentPick will use them before platform keys for matching
            tools. Keys stay encrypted at rest and are only injected into requests in memory.
          </p>
        </div>

        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          {summary?.activeKeys ?? 0} active key{summary?.activeKeys === 1 ? '' : 's'}
        </div>
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-[0.92fr_0.92fr_0.92fr_1.24fr]">
        <div className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">
            Saved providers
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
            {summary?.totalKeys ?? 0}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Keep multiple providers ready for fallback without shipping keys in every request.
          </p>
        </div>

        <div className="rounded-[28px] bg-slate-950 p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-cyan-300/80">
            30d savings
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
            {formatCurrency(summary?.estimatedSavingsUsd ?? 0)}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Estimated tool spend shifted onto your own vendor accounts across{' '}
            {summary?.byokCalls ?? 0} routed call{summary?.byokCalls === 1 ? '' : 's'}.
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">
            Last BYOK route
          </p>
          <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-slate-950">
            {formatDateTime(summary?.lastByokAt ?? null)}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {summary?.lastToolUsed
              ? `Most recent routed tool: ${summary.lastToolUsed}.`
              : 'Once a saved key is used successfully, the latest tool shows up here.'}
          </p>
        </div>

        <form
          className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(248,250,252,0.96)_0%,_rgba(255,255,255,0.96)_100%)] p-6"
          onSubmit={handleSaveKey}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">
            Save or rotate a key
          </p>

          <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="byok-service">
            Provider
          </label>
          <select
            id="byok-service"
            value={selectedService}
            onChange={(event) => setSelectedService(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
          >
            {catalog.map((item) => (
              <option key={item.service} value={item.service}>
                {item.displayName}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="byok-key">
            API key
          </label>
          <input
            id="byok-key"
            type="password"
            value={draftKey}
            onChange={(event) => setDraftKey(event.target.value)}
            placeholder={selectedDefinition?.placeholder ?? 'Paste provider API key'}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-950 outline-none transition focus:border-slate-400"
          />

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {existingKey
              ? `Stored preview: ${existingKey.keyPreview}. Saving again replaces the encrypted value.`
              : 'New keys are saved encrypted and never returned in full.'}
          </p>

          <button
            type="submit"
            disabled={saving || loading}
            className="mt-5 w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {saving ? 'Saving...' : existingKey ? 'Rotate key' : 'Save key'}
          </button>
        </form>
      </div>

      <div className="mt-8 rounded-[28px] border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">
              Saved keys
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Disable a provider temporarily or remove it completely. The router automatically
              falls back to platform keys when no active saved key matches the selected tool.
            </p>
          </div>
          {summary?.services?.length ? (
            <div className="text-sm text-slate-500">
              Services: {summary.services.join(', ')}
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="h-28 rounded-3xl bg-slate-100" />
            <div className="h-28 rounded-3xl bg-slate-100" />
          </div>
        ) : keys.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm leading-6 text-slate-600">
            No saved keys yet. Add Exa, Tavily, Serper, or another supported provider and AgentPick
            will start preferring your key on matching routes.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {keys.map((key) => (
              <article key={key.service} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                      {key.displayName}
                    </p>
                    <p className="mt-2 font-mono text-sm text-slate-600">{key.keyPreview}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                      key.status === 'active'
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    {key.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>Last used: {formatDateTime(key.lastUsedAt)}</p>
                  <p>Updated: {formatDateTime(key.updatedAt)}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggle(key.service, key.status === 'active' ? 'inactive' : 'active')}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
                  >
                    {key.status === 'active' ? 'Pause key' : 'Activate key'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(key.service)}
                    className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {message ? <p className="mt-5 text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="mt-5 text-sm text-rose-600">{error}</p> : null}
      </div>
    </section>
  );
}
