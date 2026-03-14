'use client';

import { FormEvent, useEffect, useState } from 'react';
import { UsagePanel } from '@/components/dashboard/UsagePanel';

const API_KEY_STORAGE_KEY = 'agentpick_api_key';

function authHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
  };
}

function normalizeApiKey(value: string) {
  return value.trim();
}

export default function DashboardPage() {
  const [apiKey, setApiKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showRegister, setShowRegister] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [newKey, setNewKey] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!saved) return;

    setApiKey(saved);
    setInputKey(saved);
  }, []);

  function persistApiKey(value: string) {
    setApiKey(value);
    setInputKey(value);
    localStorage.setItem(API_KEY_STORAGE_KEY, value);
  }

  function handleLogout() {
    setApiKey('');
    setInputKey('');
    setNewKey('');
    setError('');
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }

  async function handleConnect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const normalizedKey = normalizeApiKey(inputKey);
    if (!normalizedKey) {
      setError('Enter your AgentPick API key.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/v1/router/account', {
        headers: authHeaders(normalizedKey),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message ?? data?.message ?? 'Invalid API key.');
      }

      persistApiKey(normalizedKey);
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : 'Unable to connect.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setRegisterLoading(true);

    try {
      const response = await fetch('/api/v1/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName.trim() || 'my-agent',
          owner_email: registerEmail.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message ?? data?.message ?? 'Registration failed.');
      }

      const data = await response.json();
      setNewKey(data.api_key);
      persistApiKey(data.api_key);
      setShowRegister(false);
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : 'Registration failed.');
    } finally {
      setRegisterLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.12),_transparent_24%),linear-gradient(180deg,_#f7f3ec_0%,_#f8fafc_42%,_#ffffff_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-8 lg:px-10">
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
            Dashboard
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Account, usage, and routing on one screen.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Track your plan, monthly usage progress, current routing strategy, estimated cost, and
            budget cap from the main dashboard without bouncing into a separate router console.
          </p>
        </div>

        {apiKey ? (
          <div className="mt-10 space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white/70 px-6 py-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] backdrop-blur">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Live controls
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                This dashboard keeps plan visibility, monthly call progress, router strategy
                controls, and budget editing together on the main view.
              </p>
            </section>

            {newKey ? (
              <section className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-300/80">
                      New API Key
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">
                      Save this key before you close the page.
                    </h2>
                    <p className="mt-2 max-w-xl text-sm text-slate-300">
                      It is only shown once. The dashboard has already connected with it locally in
                      this browser.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(newKey)}
                    className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/8"
                  >
                    Copy key
                  </button>
                </div>

                <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-cyan-200">
                  {newKey}
                </div>
              </section>
            ) : null}

            <UsagePanel apiKey={apiKey} onLogout={handleLogout} />
          </div>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.95fr]">
            <section className="rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                What you can control
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    Plan
                  </p>
                  <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                    Monthly capacity
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    See call volume against your plan limit with a live progress bar.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    Strategy
                  </p>
                  <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                    Router mode
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Switch between auto, balanced, cheapest, and fastest routing instantly.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    Spend
                  </p>
                  <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                    Budget controls
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Adjust your monthly budget cap and keep an eye on projected cost.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              {!showRegister ? (
                <>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Connect
                  </p>
                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    Open your dashboard with an API key.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    The key is stored locally in this browser so the dashboard can call your router
                    account endpoints directly.
                  </p>

                  <form className="mt-6 space-y-4" onSubmit={handleConnect}>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="api-key">
                        API key
                      </label>
                      <input
                        id="api-key"
                        type="password"
                        value={inputKey}
                        onChange={(event) => setInputKey(event.target.value)}
                        placeholder="ah_live_sk_..."
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white"
                      />
                    </div>

                    {error ? <p className="text-sm text-rose-600">{error}</p> : null}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {loading ? 'Connecting...' : 'Open dashboard'}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setShowRegister(true);
                    }}
                    className="mt-5 text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-950"
                  >
                    Need a key? Create a free account.
                  </button>
                </>
              ) : (
                <>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Register
                  </p>
                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    Generate a new AgentPick API key.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    A free key is enough to start routing calls and using this dashboard.
                  </p>

                  <form className="mt-6 space-y-4" onSubmit={handleRegister}>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="agent-name">
                        Agent name
                      </label>
                      <input
                        id="agent-name"
                        type="text"
                        value={registerName}
                        onChange={(event) => setRegisterName(event.target.value)}
                        placeholder="my-agent"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="agent-email">
                        Email
                      </label>
                      <input
                        id="agent-email"
                        type="email"
                        value={registerEmail}
                        onChange={(event) => setRegisterEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white"
                      />
                    </div>

                    {error ? <p className="text-sm text-rose-600">{error}</p> : null}

                    <button
                      type="submit"
                      disabled={registerLoading}
                      className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {registerLoading ? 'Creating...' : 'Create account'}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setShowRegister(false);
                    }}
                    className="mt-5 text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-950"
                  >
                    Already have a key? Use it here.
                  </button>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
