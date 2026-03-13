'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

/* ─── Types ─── */
interface AccountInfo {
  id: string;
  plan: string;
  strategy: string;
  priorityTools: string[];
  excludedTools: string[];
  fallbackEnabled: boolean;
  maxFallbacks: number;
  latencyBudgetMs: number | null;
  monthlyBudgetUsd: number | null;
  spentThisMonth: number;
  totalCalls: number;
  totalFallbacks: number;
}

interface UsageStats {
  plan: string;
  daily_limit: number;
  daily_used: number;
  daily_remaining: number;
  stats: {
    period: { days: number; since: string };
    totalCalls: number;
    successRate: number;
    fallbackRate: number;
    avgLatencyMs: number;
    totalCostUsd: number;
    byCapability: Record<string, { calls: number; avgLatency: number; successRate: number }>;
    byTool: Record<string, { calls: number; avgLatency: number }>;
  };
}

interface RouterCall {
  id: string;
  capability: string;
  query: string;
  toolRequested: string | null;
  toolUsed: string;
  strategyUsed: string;
  latencyMs: number;
  costUsd: number;
  success: boolean;
  fallbackUsed: boolean;
  fallbackFrom: string | null;
  fallbackChain: string[];
  statusCode: number;
  traceId: string | null;
  createdAt: string;
}

interface FallbackEvent {
  fallbackFrom: string | null;
  toolUsed: string;
  capability: string;
  latencyMs: number;
  createdAt: string;
}

interface StrategyComparison {
  capability: string;
  strategies: Record<string, {
    top_pick: string;
    top_3: Array<{ slug: string; name: string; score?: number; latency?: number; cost?: number }>;
  }>;
}

const STRATEGIES = ['BALANCED', 'FASTEST', 'CHEAPEST', 'MOST_ACCURATE', 'AUTO'] as const;

/* ─── Helper ─── */
function fetcher(path: string, apiKey: string, options?: RequestInit) {
  return fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/* ─── Component ─── */
export default function RouterDashboardPage() {
  const [apiKey, setApiKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [calls, setCalls] = useState<RouterCall[]>([]);
  const [fallbacks, setFallbacks] = useState<FallbackEvent[]>([]);
  const [comparison, setComparison] = useState<StrategyComparison | null>(null);

  // Check localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('agentpick_api_key');
    if (saved) {
      setApiKey(saved);
    }
  }, []);

  const fetchDashboard = useCallback(async (key: string) => {
    try {
      const [acctRes, usageRes, callsRes, fbRes, compRes] = await Promise.all([
        fetcher('/api/v1/router/account', key),
        fetcher('/api/v1/router/usage?days=30', key),
        fetcher('/api/v1/router/calls?limit=20', key),
        fetcher('/api/v1/router/fallbacks?days=30', key),
        fetcher('/api/v1/router/compare-strategies', key),
      ]);

      if (!acctRes.ok) throw new Error('Invalid API key');

      const [acctData, usageData, callsData, fbData, compData] = await Promise.all([
        acctRes.json(),
        usageRes.json(),
        callsRes.json(),
        fbRes.json(),
        compRes.json(),
      ]);

      setAccount(acctData.account);
      setUsage(usageData);
      setCalls(callsData.calls ?? []);
      setFallbacks(fbData.totalFallbacks !== undefined ? [] : []);
      // Store raw fallback data
      if (fbData.triggersByTool) {
        // Convert aggregated data to list for display
        const fbEvents: FallbackEvent[] = [];
        for (const [tool, count] of Object.entries(fbData.triggersByTool)) {
          fbEvents.push({
            fallbackFrom: tool,
            toolUsed: fbData.recoveriesByTool?.[Object.keys(fbData.recoveriesByTool)[0]] ? Object.keys(fbData.recoveriesByTool)[0] : 'unknown',
            capability: 'search',
            latencyMs: 0,
            createdAt: new Date().toISOString(),
          });
        }
        setFallbacks(fbEvents);
      }
      setComparison(compData);
    } catch (err) {
      throw err;
    }
  }, []);

  // Auto-fetch when apiKey is set
  useEffect(() => {
    if (!apiKey) return;
    fetchDashboard(apiKey).catch(() => {
      setApiKey('');
      localStorage.removeItem('agentpick_api_key');
    });

    // Refresh calls every 10s
    const interval = setInterval(async () => {
      try {
        const res = await fetcher('/api/v1/router/calls?limit=20', apiKey);
        if (res.ok) {
          const data = await res.json();
          setCalls(data.calls ?? []);
        }
      } catch {}
    }, 10_000);

    return () => clearInterval(interval);
  }, [apiKey, fetchDashboard]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await fetchDashboard(inputKey);
      setApiKey(inputKey);
      localStorage.setItem('agentpick_api_key', inputKey);
    } catch {
      setError('Invalid API key. Check your key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const [strategyLoading, setStrategyLoading] = useState<string | null>(null);
  const [strategyError, setStrategyError] = useState('');

  const handleStrategyChange = async (strategy: string) => {
    if (!account || strategyLoading) return;
    setStrategyLoading(strategy);
    setStrategyError('');
    try {
      const res = await fetcher('/api/v1/router/account', apiKey, {
        method: 'PATCH',
        body: JSON.stringify({ strategy }),
      });
      if (res.ok) {
        const data = await res.json();
        setAccount((prev) => prev ? { ...prev, strategy: data.account.strategy } : prev);
        // Refresh dashboard data after strategy change
        await fetchDashboard(apiKey);
      } else {
        const errData = await res.json().catch(() => ({ message: 'Failed to update strategy' }));
        setStrategyError(errData.message || `Error ${res.status}`);
      }
    } catch {
      setStrategyError('Network error. Try again.');
    } finally {
      setStrategyLoading(null);
    }
  };

  const handleLogout = () => {
    setApiKey('');
    setInputKey('');
    setAccount(null);
    setUsage(null);
    setCalls([]);
    localStorage.removeItem('agentpick_api_key');
  };

  /* ─── Login Screen ─── */
  if (!apiKey || !account) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Router Dashboard</h1>
        <p className="mb-8 text-sm text-gray-500">Enter your AgentPick API key to view your dashboard.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">API Key</label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="ah_live_sk_..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading || !inputKey}
            className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'View Dashboard'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Don&apos;t have a key?{' '}
          <Link href="/connect" className="text-orange-500 hover:underline">Get started</Link>
        </p>
      </div>
    );
  }

  /* ─── Dashboard ─── */
  const stats = usage?.stats;
  const maskedKey = apiKey.slice(0, 12) + '...' + apiKey.slice(-4);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">AgentPick Router Dashboard</h1>
          <p className="mt-1 text-xs text-gray-400 font-mono">{maskedKey}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
            {account.plan}
          </span>
          <span className="text-xs text-gray-500">
            {usage?.daily_used ?? 0} / {usage?.daily_limit ?? 0} today
          </span>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600">Logout</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Calls (30d)" value={stats?.totalCalls ?? 0} />
        <StatCard label="Spent" value={`$${(stats?.totalCostUsd ?? 0).toFixed(2)}`} />
        <StatCard label="Fallbacks" value={account.totalFallbacks} />
        <StatCard label="Success Rate" value={`${((stats?.successRate ?? 0) * 100).toFixed(1)}%`} />
      </div>

      {/* Tool Usage */}
      {stats && Object.keys(stats.byTool).length > 0 && (
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">TOOL USAGE</h2>
          <div className="space-y-3">
            {Object.entries(stats.byTool)
              .sort(([, a], [, b]) => b.calls - a.calls)
              .map(([tool, data]) => {
                const pct = stats.totalCalls > 0 ? (data.calls / stats.totalCalls) * 100 : 0;
                return (
                  <div key={tool} className="flex items-center gap-3">
                    <span className="w-28 truncate text-xs font-mono text-gray-600">{tool}</span>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className="h-2 rounded-full bg-orange-400" style={{ width: `${Math.max(pct, 2)}%` }} />
                      </div>
                    </div>
                    <span className="w-10 text-right text-xs text-gray-500">{pct.toFixed(0)}%</span>
                    <span className="w-14 text-right text-xs text-gray-400">{data.avgLatency}ms</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Strategy Selector */}
      <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">STRATEGY</h2>
        <div className="flex flex-wrap gap-2">
          {STRATEGIES.map((s) => (
            <button
              key={s}
              onClick={() => handleStrategyChange(s)}
              disabled={!!strategyLoading}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                account.strategy === s
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {strategyLoading === s ? '...' : s.toLowerCase()}{s === 'AUTO' ? ' ★' : ''}
            </button>
          ))}
        </div>
        {strategyError && <p className="mt-2 text-xs text-red-500">{strategyError}</p>}
        <p className="mt-3 text-xs text-gray-400">
          {account.strategy === 'AUTO' && 'AI analyzes each query and picks the optimal tool.'}
          {account.strategy === 'BALANCED' && 'Best quality/cost ratio. Good for general use.'}
          {account.strategy === 'FASTEST' && 'Lowest latency tools. Best for real-time apps.'}
          {account.strategy === 'CHEAPEST' && 'Lowest cost above quality floor.'}
          {account.strategy === 'MOST_ACCURATE' && 'Highest quality results, may cost more.'}
          {account.strategy === 'MANUAL' && 'Uses your custom priority tool list.'}
        </p>
      </div>

      {/* Strategy Comparison */}
      {comparison?.strategies && (
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">STRATEGY COMPARISON</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-left font-medium text-gray-500">Strategy</th>
                  <th className="pb-2 text-left font-medium text-gray-500">Top Pick</th>
                  <th className="pb-2 text-right font-medium text-gray-500">Score</th>
                  <th className="pb-2 text-right font-medium text-gray-500">Latency</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(comparison.strategies).map(([name, data]) => (
                  <tr key={name} className="border-b border-gray-50">
                    <td className="py-2 font-mono text-gray-700">
                      {name.toLowerCase()}
                      {name === account.strategy ? ' ★' : ''}
                    </td>
                    <td className="py-2 text-gray-600">{data.top_pick}</td>
                    <td className="py-2 text-right text-gray-500">{data.top_3[0]?.score?.toFixed(1) ?? '—'}</td>
                    <td className="py-2 text-right text-gray-500">{data.top_3[0]?.latency ? `${data.top_3[0].latency}ms` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Calls */}
      <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">RECENT CALLS</h2>
          <span className="text-[10px] text-gray-400">auto-refresh 10s</span>
        </div>
        {calls.length === 0 ? (
          <p className="text-xs text-gray-400">No calls recorded yet. Make an API request to see data here.</p>
        ) : (
          <div className="space-y-2">
            {calls.map((call) => (
              <div key={call.id} className="flex items-start gap-3 rounded-lg bg-gray-50 px-3 py-2">
                <span className="mt-0.5 text-[10px] text-gray-400 whitespace-nowrap">{formatTime(call.createdAt)}</span>
                <span className="text-xs font-medium text-gray-500">{call.capability}</span>
                <span className="flex-1 truncate text-xs text-gray-600">&quot;{call.query || '—'}&quot;</span>
                <span className="text-xs text-gray-500">→ {call.toolUsed}</span>
                <span className={`text-xs font-medium ${call.success ? 'text-green-600' : 'text-red-500'}`}>
                  {call.success ? '✓' : '✗'}
                </span>
                <span className="text-[10px] text-gray-400">{call.latencyMs}ms</span>
                {call.fallbackUsed && (
                  <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] text-yellow-700">
                    fallback from {call.fallbackFrom}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fallback Log */}
      {calls.some(c => c.fallbackUsed) && (
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">FALLBACK LOG</h2>
          <div className="space-y-2">
            {calls.filter(c => c.fallbackUsed).map((call) => (
              <div key={call.id} className="flex items-center gap-3 text-xs">
                <span className="text-gray-400">{formatDate(call.createdAt)} {formatTime(call.createdAt)}</span>
                <span className="text-red-500">{call.fallbackFrom}</span>
                <span className="text-gray-400">→</span>
                <span className="text-green-600">{call.toolUsed}</span>
                <span className="text-gray-400">({call.latencyMs}ms, {call.success ? 'success' : 'failed'})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">SETTINGS</h2>
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Strategy</span>
            <span className="font-mono text-gray-700">{account.strategy.toLowerCase()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Fallback enabled</span>
            <span className="text-gray-700">{account.fallbackEnabled ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Max fallbacks</span>
            <span className="text-gray-700">{account.maxFallbacks}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Monthly budget</span>
            <span className="text-gray-700">
              {account.monthlyBudgetUsd !== null ? `$${account.monthlyBudgetUsd}` : 'Unlimited'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Spent this month</span>
            <span className="text-gray-700">${account.spentThisMonth.toFixed(2)}</span>
          </div>
          {account.priorityTools.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Priority tools</span>
              <span className="font-mono text-gray-700">{account.priorityTools.join(', ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade CTA */}
      {account.plan === 'FREE' && (
        <div className="rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 p-5 text-center">
          <p className="text-sm font-medium text-gray-800">Upgrade to Pro — 10K calls/month</p>
          <p className="mt-1 text-xs text-gray-500">Unlock BYOK, higher limits, and priority support.</p>
          <Link
            href="/connect"
            className="mt-3 inline-block rounded-lg bg-orange-500 px-4 py-2 text-xs font-medium text-white hover:bg-orange-600"
          >
            View Plans →
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-[11px] text-gray-400">{label}</p>
    </div>
  );
}
