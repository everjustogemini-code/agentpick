'use client';

import Link from 'next/link';
import {
  FormEvent,
  startTransition,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ANALYTICS_RANGE_OPTIONS,
  type RouterAnalyticsRange,
  type RouterAnalyticsResponse,
} from '@/lib/router/analytics';

const API_KEY_STORAGE_KEY = 'agentpick_api_key';
const TOOL_COLORS = ['#0f766e', '#0f172a', '#0284c7', '#f97316', '#b45309'];
const STRATEGY_COLORS = ['#0f766e', '#0284c7', '#f97316', '#7c3aed', '#e11d48', '#475569'];

interface AccountResponse {
  account: {
    email: string | null;
    plan: string;
    planLabel?: string;
    strategy: string;
  };
}

interface RegisterResponse {
  apiKey: string;
}

interface RouterAnalyticsDashboardProps {
  apiKeyOverride?: string;
  embedded?: boolean;
  onDisconnect?: () => void;
}

function authHeaders(apiKey: string, includeJson = false) {
  return {
    Authorization: `Bearer ${apiKey}`,
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
  };
}

async function readApiError(response: Response) {
  const data = await response.json().catch(() => null);
  return (
    data?.error?.message ??
    data?.message ??
    `${response.status} ${response.statusText}`.trim()
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 100 ? 0 : 4,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatLatency(value: number | null) {
  if (value === null || Number.isNaN(value)) return 'n/a';
  return `${Math.round(value).toLocaleString()} ms`;
}

function formatTimestamp(value: string | null) {
  if (!value) return 'No traffic yet';

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCalls(value: number) {
  return value.toLocaleString();
}

function normalizeApiKey(value: string) {
  return value.trim();
}

function maskApiKey(apiKey: string) {
  if (apiKey.length <= 12) return apiKey;
  return `${apiKey.slice(0, 12)}...${apiKey.slice(-4)}`;
}

function StatCard({
  eyebrow,
  value,
  caption,
}: {
  caption: string;
  eyebrow: string;
  value: string;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white/85 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
        {eyebrow}
      </p>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{caption}</p>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white/88 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="max-w-2xl">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
          Analytics
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function EmptyChart({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex h-[320px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 px-6 text-center text-sm leading-6 text-slate-500">
      {message}
    </div>
  );
}

export function RouterAnalyticsDashboard({
  apiKeyOverride,
  embedded = false,
  onDisconnect,
}: RouterAnalyticsDashboardProps = {}) {
  const [apiKey, setApiKey] = useState(apiKeyOverride ?? '');
  const [inputKey, setInputKey] = useState(apiKeyOverride ?? '');
  const [range, setRange] = useState<RouterAnalyticsRange>('24h');

  const [account, setAccount] = useState<AccountResponse['account'] | null>(null);
  const [analytics, setAnalytics] = useState<RouterAnalyticsResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [showRegister, setShowRegister] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [newKey, setNewKey] = useState('');

  useEffect(() => {
    if (typeof apiKeyOverride === 'string') {
      setApiKey(apiKeyOverride);
      setInputKey(apiKeyOverride);
      return;
    }

    const saved = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!saved) return;

    setApiKey(saved);
    setInputKey(saved);
  }, [apiKeyOverride]);

  function persistApiKey(value: string) {
    setApiKey(value);
    setInputKey(value);
    localStorage.setItem(API_KEY_STORAGE_KEY, value);
  }

  const clearApiKey = useCallback((message?: string) => {
    setApiKey('');
    setInputKey('');
    setAccount(null);
    setAnalytics(null);
    setLastUpdated(null);
    setNewKey('');
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    onDisconnect?.();
    if (message) {
      setError(message);
    }
  }, [onDisconnect]);

  const loadDashboard = useCallback(
    async (key: string, nextRange: RouterAnalyticsRange, silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [accountResponse, analyticsResponse] = await Promise.all([
          fetch('/api/v1/router/account', {
            headers: authHeaders(key),
          }),
          fetch(`/api/v1/router/analytics?range=${nextRange}`, {
            headers: authHeaders(key),
          }),
        ]);

        if (accountResponse.status === 401 || analyticsResponse.status === 401) {
          clearApiKey('Your API key is no longer valid.');
          return false;
        }

        if (!accountResponse.ok || !analyticsResponse.ok) {
          const message = !accountResponse.ok
            ? await readApiError(accountResponse)
            : await readApiError(analyticsResponse);
          throw new Error(message);
        }

        const accountData = (await accountResponse.json()) as AccountResponse;
        const analyticsData = (await analyticsResponse.json()) as RouterAnalyticsResponse;

        setAccount(accountData.account);
        setAnalytics(analyticsData);
        setLastUpdated(new Date().toISOString());
        setError('');
        return true;
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : 'Unable to load router analytics.',
        );
        return false;
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [clearApiKey],
  );

  useEffect(() => {
    if (!apiKey) return;

    void loadDashboard(apiKey, range);

    const interval = window.setInterval(() => {
      void loadDashboard(apiKey, range, true);
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [apiKey, range, loadDashboard]);

  async function handleConnect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const normalizedKey = normalizeApiKey(inputKey);
    if (!normalizedKey) {
      setError('Enter your AgentPick API key.');
      return;
    }

    const connected = await loadDashboard(normalizedKey, range);
    if (connected) {
      persistApiKey(normalizedKey);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const email = registerEmail.trim().toLowerCase();
    const name = registerName.trim();

    if (!email) {
      setError('Enter an email to create a router account.');
      return;
    }

    setRegisterLoading(true);

    try {
      const response = await fetch('/api/v1/router/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const data = (await response.json()) as RegisterResponse;
      setNewKey(data.apiKey);
      persistApiKey(data.apiKey);
      setShowRegister(false);
      setRegisterEmail(email);
      await loadDashboard(data.apiKey, range);
    } catch (registerError) {
      setError(
        registerError instanceof Error ? registerError.message : 'Unable to create a router key.',
      );
    } finally {
      setRegisterLoading(false);
    }
  }

  const hasTraffic = (analytics?.summary.totalCalls ?? 0) > 0;
  const RootTag = embedded ? 'section' : 'main';

  return (
    <RootTag
      className={
        embedded
          ? 'space-y-8'
          : 'min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.14),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#fff7ed_38%,_#ffffff_100%)]'
      }
    >
      <div className={embedded ? 'space-y-8' : 'mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10 sm:px-8 lg:px-10'}>
        {embedded ? (
          <section className="rounded-[28px] border border-slate-200 bg-white/70 px-6 py-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Router analytics
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                  Live traffic, latency, fallback, and spend.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Real-time charts refresh every 30 seconds and summarize RouterCall activity in the
                  selected time window.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/dashboard/router"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Open standalone analytics
                </Link>
                <Link
                  href="/connect"
                  className="rounded-full border border-slate-200 bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  API docs
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-[36px] border border-white/70 bg-white/75 p-8 shadow-[0_28px_100px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
                  Agent Analytics
                </p>
                <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">
                  Watch router traffic, fallbacks, latency, and spend live.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  This dashboard polls every 30 seconds and turns raw RouterCall records into live
                  routing visibility for tool usage, strategy mix, latency percentiles, fallback rate,
                  and cost movement.
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-950 px-5 py-4 text-white shadow-[0_18px_50px_rgba(15,23,42,0.2)]">
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-300/80">
                  Live feed
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  Auto-refresh every 30s. Manual refresh is available after you connect.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/dashboard"
                    className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/8"
                  >
                    Billing and settings
                  </Link>
                  <Link
                    href="/connect"
                    className="rounded-full border border-cyan-300/20 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:border-cyan-200/40 hover:bg-cyan-300/10"
                  >
                    API docs
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {!apiKey ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-[32px] border border-slate-200 bg-white/88 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Connect
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Open analytics with an existing router key.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                The key stays in local storage so the dashboard can call your authenticated router
                analytics endpoint directly from this browser.
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
                  {loading ? 'Connecting...' : 'Open analytics'}
                </button>
              </form>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white/88 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              {!showRegister ? (
                <>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                    New account
                  </p>
                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    Create a router key in one step.
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                    Generate a free router account and land straight in the analytics dashboard.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setShowRegister(true);
                    }}
                    className="mt-6 rounded-full border border-slate-200 px-5 py-3 text-sm font-medium text-slate-950 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Create router key
                  </button>
                </>
              ) : (
                <>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Register
                  </p>
                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    Create your AgentPick router account.
                  </h2>

                  <form className="mt-6 space-y-4" onSubmit={handleRegister}>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="register-name">
                        Name
                      </label>
                      <input
                        id="register-name"
                        type="text"
                        value={registerName}
                        onChange={(event) => setRegisterName(event.target.value)}
                        placeholder="Acme agent"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="register-email">
                        Email
                      </label>
                      <input
                        id="register-email"
                        type="email"
                        value={registerEmail}
                        onChange={(event) => setRegisterEmail(event.target.value)}
                        placeholder="team@acme.dev"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white"
                      />
                    </div>

                    {error ? <p className="text-sm text-rose-600">{error}</p> : null}

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={registerLoading}
                        className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        {registerLoading ? 'Creating...' : 'Create and open dashboard'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRegister(false)}
                        className="rounded-full border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </>
              )}
            </section>
          </div>
        ) : (
          <>
            <section className="mt-8 rounded-[32px] border border-slate-200 bg-white/88 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
                      {account?.planLabel ?? account?.plan ?? 'Router'}
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
                      Live every 30s
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
                      Strategy {account?.strategy ?? 'AUTO'}
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                      {account?.email ?? 'Router account'}
                    </p>
                    <p className="mt-1 font-mono text-xs text-slate-500">{maskApiKey(apiKey)}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 xl:items-end">
                  <div className="flex flex-wrap gap-2">
                    {ANALYTICS_RANGE_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() =>
                          startTransition(() => {
                            setRange(option.key);
                          })
                        }
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          range === option.key
                            ? 'bg-slate-950 text-white'
                            : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span>{lastUpdated ? `Updated ${formatTimestamp(lastUpdated)}` : 'Loading'}</span>
                    <button
                      type="button"
                      onClick={() => void loadDashboard(apiKey, range, true)}
                      disabled={refreshing}
                      className="rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      {refreshing ? 'Refreshing...' : 'Refresh now'}
                    </button>
                    <button
                      type="button"
                      onClick={() => clearApiKey()}
                      className="rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>

              {newKey ? (
                <div className="mt-6 rounded-[28px] border border-cyan-200 bg-cyan-50/90 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-700">
                        New API Key
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        This key is only shown once. The dashboard is already connected with it.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(newKey)}
                      className="rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-medium text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100/60"
                    >
                      Copy key
                    </button>
                  </div>
                  <div className="mt-4 overflow-x-auto rounded-2xl border border-cyan-200 bg-white px-4 py-3 font-mono text-sm text-cyan-900">
                    {newKey}
                  </div>
                </div>
              ) : null}

              {error ? <p className="mt-5 text-sm text-rose-600">{error}</p> : null}
            </section>

            {loading && !analytics ? (
              <div className="mt-8 rounded-[32px] border border-slate-200 bg-white/88 p-10 text-center text-sm text-slate-600 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                Loading router analytics...
              </div>
            ) : null}

            {analytics ? (
              <>
                <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <StatCard
                    eyebrow={analytics.range.label}
                    value={formatCalls(analytics.summary.totalCalls)}
                    caption="Total router calls recorded in the selected range."
                  />
                  <StatCard
                    eyebrow="Fallback rate"
                    value={formatPercent(analytics.summary.fallbackRate)}
                    caption={`${analytics.summary.totalFallbacks.toLocaleString()} calls needed a fallback hop.`}
                  />
                  <StatCard
                    eyebrow="Latency p95"
                    value={formatLatency(analytics.summary.latencyMs.p95)}
                    caption={`p50 ${formatLatency(analytics.summary.latencyMs.p50)} · p99 ${formatLatency(analytics.summary.latencyMs.p99)}`}
                  />
                  <StatCard
                    eyebrow="Success rate"
                    value={formatPercent(analytics.summary.successRate)}
                    caption={`Latest traffic ${formatTimestamp(analytics.summary.latestCallAt)}`}
                  />
                  <StatCard
                    eyebrow="Cost trend"
                    value={formatCurrency(analytics.summary.totalCostUsd)}
                    caption={`${formatCurrency(analytics.summary.avgCostUsd)} average cost per call in this window.`}
                  />
                </section>

                <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
                  <ChartCard
                    title="Calls by tool"
                    description="Line view of tool volume across the selected window. The chart shows the busiest tools directly and collapses the long tail into Other."
                  >
                    {hasTraffic && analytics.toolSeries.length > 0 ? (
                      <>
                        <div className="h-[320px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.callsByTool}>
                              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                              <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 12 }} />
                              <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                              <Tooltip />
                              {analytics.toolSeries.map((tool, index) => (
                                <Line
                                  key={tool}
                                  type="monotone"
                                  dataKey={tool}
                                  stroke={TOOL_COLORS[index % TOOL_COLORS.length]}
                                  strokeWidth={2.5}
                                  dot={false}
                                  activeDot={{ r: 4 }}
                                />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          {analytics.toolSeries.map((tool, index) => (
                            <span
                              key={tool}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                            >
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{
                                  backgroundColor: TOOL_COLORS[index % TOOL_COLORS.length],
                                }}
                              />
                              {tool}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <EmptyChart message="Analytics will appear here after the first routed calls land in this account." />
                    )}
                  </ChartCard>

                  <ChartCard
                    title="Strategy distribution"
                    description="How routed traffic splits across your active router strategies in the same time window."
                  >
                    {hasTraffic && analytics.strategyDistribution.length > 0 ? (
                      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="h-[280px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analytics.strategyDistribution}
                                dataKey="value"
                                innerRadius={72}
                                outerRadius={104}
                                paddingAngle={3}
                              >
                                {analytics.strategyDistribution.map((slice, index) => (
                                  <Cell
                                    key={slice.key}
                                    fill={STRATEGY_COLORS[index % STRATEGY_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-3">
                          {analytics.strategyDistribution.map((slice, index) => (
                            <div
                              key={slice.key}
                              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className="h-3 w-3 rounded-full"
                                  style={{
                                    backgroundColor:
                                      STRATEGY_COLORS[index % STRATEGY_COLORS.length],
                                  }}
                                />
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{slice.label}</p>
                                  <p className="text-xs text-slate-500">
                                    {formatPercent(slice.share * 100)}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm font-semibold text-slate-900">
                                {slice.value.toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <EmptyChart message="Once requests are routed, strategy mix will break out here automatically." />
                    )}
                  </ChartCard>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                  <ChartCard
                    title="Latency percentiles"
                    description="p50, p95, and p99 latency lines by time bucket so you can spot tail regressions instead of just the average."
                  >
                    {hasTraffic ? (
                      <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analytics.latencyPercentiles}>
                            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="p50"
                              stroke="#0f766e"
                              strokeWidth={2.5}
                              dot={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="p95"
                              stroke="#f97316"
                              strokeWidth={2.5}
                              dot={false}
                            />
                            <Line
                              type="monotone"
                              dataKey="p99"
                              stroke="#0f172a"
                              strokeWidth={2.5}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <EmptyChart message="Latency percentiles need a few calls before the distribution becomes meaningful." />
                    )}
                  </ChartCard>

                  <ChartCard
                    title="Fallback rate"
                    description="Area trend for fallback percentage over time, useful for catching flaky providers before they become outages."
                  >
                    {hasTraffic ? (
                      <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analytics.fallbackRateTrend}>
                            <defs>
                              <linearGradient id="fallbackFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#fb923c" stopOpacity={0.35} />
                                <stop offset="95%" stopColor="#fb923c" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                            <Tooltip />
                            <Area
                              type="monotone"
                              dataKey="fallbackRate"
                              stroke="#ea580c"
                              fill="url(#fallbackFill)"
                              strokeWidth={2.5}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <EmptyChart message="Fallback rate stays at zero until the router has traffic to evaluate." />
                    )}
                  </ChartCard>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                  <ChartCard
                    title="Cost trend"
                    description="Per-bucket spend across the selected window so you can see routing cost move with load and strategy."
                  >
                    {hasTraffic ? (
                      <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analytics.costTrend}>
                            <defs>
                              <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#0891b2" stopOpacity={0.03} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                            <Tooltip />
                            <Area
                              type="monotone"
                              dataKey="costUsd"
                              stroke="#0891b2"
                              fill="url(#costFill)"
                              strokeWidth={2.5}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <EmptyChart message="Cost trend appears as soon as router calls are recorded for this account." />
                    )}
                  </ChartCard>

                  <ChartCard
                    title="Top tools"
                    description="Quick operational view of the tools carrying the most load in the current range."
                  >
                    {hasTraffic && analytics.topTools.length > 0 ? (
                      <div className="space-y-3">
                        {analytics.topTools.slice(0, 6).map((tool, index) => (
                          <div
                            key={tool.tool}
                            className="rounded-[24px] border border-slate-200 bg-slate-50/90 p-4"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <span
                                  className="h-3 w-3 rounded-full"
                                  style={{
                                    backgroundColor: TOOL_COLORS[index % TOOL_COLORS.length],
                                  }}
                                />
                                <div>
                                  <p className="text-sm font-semibold text-slate-950">{tool.tool}</p>
                                  <p className="text-xs text-slate-500">
                                    {formatPercent(tool.share * 100)} of calls
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm font-semibold text-slate-950">
                                {tool.calls.toLocaleString()} calls
                              </p>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                                Avg latency {formatLatency(tool.avgLatencyMs)}
                              </span>
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                                Fallbacks {tool.fallbackCount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyChart message="Top tools populate after your first router calls." />
                    )}
                  </ChartCard>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </RootTag>
  );
}
