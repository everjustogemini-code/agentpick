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

const STRATEGIES = ['AUTO', 'BALANCED', 'MOST_ACCURATE', 'CHEAPEST', 'FASTEST'] as const;

/** Display names: Prisma enum → canonical API names */
const STRATEGY_DISPLAY: Record<string, string> = {
  AUTO: 'auto',
  BALANCED: 'balanced',
  MOST_ACCURATE: 'best_performance',
  CHEAPEST: 'cheapest',
  FASTEST: 'most_stable',
};

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

/* ─── Animated counter hook ─── */
function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!target) return setValue(0)
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) { setValue(target); return }
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(eased * target))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return value
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

  const [showRegister, setShowRegister] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [newKey, setNewKey] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRegisterLoading(true);
    try {
      const res = await fetch('/api/v1/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName || 'my-agent',
          owner_email: registerEmail || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: { message: 'Registration failed' } }));
        throw new Error(data.error?.message || `Error ${res.status}`);
      }
      const data = await res.json();
      setNewKey(data.api_key);
      // Auto-login with the new key
      setInputKey(data.api_key);
      await fetchDashboard(data.api_key);
      setApiKey(data.api_key);
      localStorage.setItem('agentpick_api_key', data.api_key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLogout = () => {
    setApiKey('');
    setInputKey('');
    setAccount(null);
    setUsage(null);
    setCalls([]);
    setNewKey('');
    setShowRegister(false);
    localStorage.removeItem('agentpick_api_key');
  };

  /* ─── Login Screen ─── */
  if (!apiKey || !account) {
    // Show the new API key if just registered
    if (newKey) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="w-full max-w-md px-4 py-12">
            <h1 className="mb-2 text-2xl font-bold text-white">Your API Key</h1>
            <p className="mb-4 text-sm text-white/40">Save this key — you won&apos;t see it again.</p>
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-4">
              <code className="block break-all font-mono text-sm text-green-400">{newKey}</code>
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(newKey); }}
              className="mt-3 w-full rounded-lg bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/60 hover:bg-white/[0.09]"
            >
              Copy to clipboard
            </button>
            <p className="mt-4 text-xs text-white/30">Loading dashboard...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-full max-w-md px-4 py-12">
          <h1 className="mb-2 text-2xl font-bold text-white">Router Dashboard</h1>

          {!showRegister ? (
            <>
              <p className="mb-8 text-sm text-white/40">Enter your AgentPick API key to view your dashboard.</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/50">API Key</label>
                  <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="ah_live_sk_..."
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm font-mono text-white placeholder-white/20 focus:border-orange-500/60 focus:outline-none focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)]"
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !inputKey}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {loading ? 'Checking...' : 'View Dashboard'}
                </button>
              </form>
              <div className="mt-6 text-center">
                <button
                  onClick={() => { setShowRegister(true); setError(''); }}
                  className="text-sm font-medium text-orange-500 hover:underline"
                >
                  Create new account (free)
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-8 text-sm text-white/40">Create a free account to get your API key instantly.</p>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/50">Agent name</label>
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="my-agent"
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm font-mono text-white placeholder-white/20 focus:border-orange-500/60 focus:outline-none focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/50">Email (optional)</label>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm font-mono text-white placeholder-white/20 focus:border-orange-500/60 focus:outline-none focus:shadow-[0_0_0_3px_rgba(249,115,22,0.1)]"
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {registerLoading ? 'Creating...' : 'Create account & get API key'}
                </button>
              </form>
              <div className="mt-6 text-center">
                <button
                  onClick={() => { setShowRegister(false); setError(''); }}
                  className="text-sm text-white/30 hover:underline"
                >
                  Already have a key? Sign in
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ─── Dashboard ─── */
  const stats = usage?.stats;
  const maskedKey = apiKey.slice(0, 12) + '...' + apiKey.slice(-4);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">AgentPick Router Dashboard</h1>
          <p className="mt-1 text-xs text-white/30 font-mono">{maskedKey}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-medium text-orange-400 border border-orange-500/20">
            {account.plan}
          </span>
          <span className="text-xs text-white/40">
            {usage?.daily_used ?? 0} / {usage?.daily_limit ?? 0} today
          </span>
          <button onClick={handleLogout} className="text-xs text-white/30 hover:text-white/60">Logout</button>
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
        <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 shadow-glass backdrop-blur-sm">
          <h2 className="mb-4 text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30">
            Tool Usage
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.byTool)
              .sort(([, a], [, b]) => b.calls - a.calls)
              .map(([tool, data], index) => {
                const pct = stats.totalCalls > 0 ? (data.calls / stats.totalCalls) * 100 : 0;
                return (
                  <div key={tool} className="flex items-center gap-3">
                    <span className="w-28 truncate text-xs font-mono text-white/50">{tool}</span>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-white/[0.06]">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 shadow-glow-orange transition-all duration-500"
                          style={{
                            width: `${Math.max(pct, 2)}%`,
                            transitionDelay: `${index * 60}ms`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="w-10 text-right text-xs text-white/40">{pct.toFixed(0)}%</span>
                    <span className="w-14 text-right text-xs text-white/30">{data.avgLatency}ms</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Strategy Selector */}
      <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 shadow-glass backdrop-blur-sm">
        <h2 className="mb-4 text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30">STRATEGY</h2>
        <div className="flex flex-wrap gap-2">
          {STRATEGIES.map((s) => (
            <button
              key={s}
              onClick={() => handleStrategyChange(s)}
              disabled={!!strategyLoading}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 disabled:opacity-50 border ${
                account.strategy === s
                  ? 'bg-orange-500/15 text-orange-400 border-orange-500/50 ring-1 ring-orange-500/50 shadow-glow-orange'
                  : 'border-white/[0.08] bg-white/[0.04] text-white/50 hover:bg-white/[0.07] hover:text-white/70'
              }`}
            >
              {strategyLoading === s ? '...' : (STRATEGY_DISPLAY[s] ?? s.toLowerCase())}{s === 'AUTO' ? ' ★' : ''}
            </button>
          ))}
        </div>
        {strategyError && <p className="mt-2 text-xs text-red-500">{strategyError}</p>}
        <p className="mt-3 text-xs text-white/40">
          {account.strategy === 'AUTO' && 'AI routing — analyzes each query and picks the optimal tool.'}
          {account.strategy === 'BALANCED' && 'Best value — quality/cost ratio. Good for general use.'}
          {account.strategy === 'FASTEST' && 'Highest uptime — most reliable tools first.'}
          {account.strategy === 'CHEAPEST' && 'Lowest cost above quality floor.'}
          {account.strategy === 'MOST_ACCURATE' && 'Highest quality results, may cost more.'}
          {account.strategy === 'MANUAL' && 'Uses your custom priority tool list.'}
        </p>
      </div>

      {/* Strategy Comparison */}
      {comparison?.strategies && (
        <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 shadow-glass backdrop-blur-sm">
          <h2 className="mb-4 text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30">STRATEGY COMPARISON</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="pb-2 text-left font-medium text-white/30">Strategy</th>
                  <th className="pb-2 text-left font-medium text-white/30">Top Pick</th>
                  <th className="pb-2 text-right font-medium text-white/30">Score</th>
                  <th className="pb-2 text-right font-medium text-white/30">Latency</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(comparison.strategies).map(([name, data]) => (
                  <tr key={name} className="border-b border-white/[0.04]">
                    <td className="py-2 font-mono text-white/70">
                      {name.toLowerCase()}
                      {name === account.strategy ? ' ★' : ''}
                    </td>
                    <td className="py-2 text-white/60">{data.top_pick}</td>
                    <td className="py-2 text-right text-white/40">{data.top_3[0]?.score?.toFixed(1) ?? '—'}</td>
                    <td className="py-2 text-right text-white/40">{data.top_3[0]?.latency ? `${data.top_3[0].latency}ms` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Calls */}
      <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 shadow-glass backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30">RECENT CALLS</h2>
          <span className="text-[10px] text-white/20">auto-refresh 10s</span>
        </div>
        {calls.length === 0 ? (
          <p className="text-xs text-white/30">No calls recorded yet. Make an API request to see data here.</p>
        ) : (
          <div className="space-y-2">
            {calls.map((call) => (
              <div key={call.id} className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.04] transition-colors duration-150">
                <span className="mt-0.5 text-[10px] text-white/30 whitespace-nowrap">{formatTime(call.createdAt)}</span>
                <span className="text-xs font-medium text-white/40">{call.capability}</span>
                <span className="flex-1 truncate text-xs text-white/50">&quot;{call.query || '—'}&quot;</span>
                <span className="text-xs text-white/50">→ {call.toolUsed}</span>
                <span className={`text-xs font-medium ${call.success ? 'text-green-400' : 'text-red-500'}`}>
                  {call.success ? '✓' : '✗'}
                </span>
                <span className="text-[10px] text-white/25">{call.latencyMs}ms</span>
                {call.fallbackUsed && (
                  <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] text-yellow-400">
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
        <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 shadow-glass backdrop-blur-sm">
          <h2 className="mb-4 text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30">FALLBACK LOG</h2>
          <div className="space-y-2">
            {calls.filter(c => c.fallbackUsed).map((call) => (
              <div key={call.id} className="flex items-center gap-3 text-xs">
                <span className="text-white/30">{formatDate(call.createdAt)} {formatTime(call.createdAt)}</span>
                <span className="text-red-500">{call.fallbackFrom}</span>
                <span className="text-white/30">→</span>
                <span className="text-green-400">{call.toolUsed}</span>
                <span className="text-white/30">({call.latencyMs}ms, {call.success ? 'success' : 'failed'})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 shadow-glass backdrop-blur-sm">
        <h2 className="mb-4 text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30">SETTINGS</h2>
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-white/40">Strategy</span>
            <span className="font-mono text-orange-400">{STRATEGY_DISPLAY[account.strategy] ?? account.strategy.toLowerCase()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/40">Fallback enabled</span>
            <span className="font-mono text-orange-400">{account.fallbackEnabled ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/40">Max fallbacks</span>
            <span className="font-mono text-orange-400">{account.maxFallbacks}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/40">Monthly budget</span>
            <span className="font-mono text-orange-400">
              {account.monthlyBudgetUsd !== null ? `$${account.monthlyBudgetUsd}` : 'Unlimited'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/40">Spent this month</span>
            <span className="font-mono text-orange-400">${account.spentThisMonth.toFixed(2)}</span>
          </div>
          {account.priorityTools.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-white/40">Priority tools</span>
              <span className="font-mono text-orange-400">{account.priorityTools.join(', ')}</span>
            </div>
          )}
          {account.excludedTools.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-white/40">Excluded tools</span>
              <span className="font-mono text-orange-400">{account.excludedTools.join(', ')}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-white/40">Latency budget</span>
            <span className="font-mono text-orange-400">
              {account.latencyBudgetMs !== null ? `${account.latencyBudgetMs}ms` : 'No limit'}
            </span>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      {account.plan === 'FREE' && (
        <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-5 text-center backdrop-blur-sm">
          <p className="text-sm font-medium text-white">Upgrade to Pro — 10K calls/month</p>
          <p className="mt-1 text-xs text-white/40">
            Unlock BYOK, higher limits, and priority support.
          </p>
          <Link
            href="/connect"
            className="mt-3 inline-block rounded-lg bg-orange-500 px-4 py-2 text-xs font-medium text-white hover:bg-orange-600 transition-colors shadow-glow-orange"
          >
            View Plans →
          </Link>
        </div>
      )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  const [displayed, setDisplayed] = useState<string | number>(value);

  useEffect(() => {
    if (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayed(value);
      return;
    }

    const isPercent = typeof value === 'string' && value.endsWith('%');
    const isDollar = typeof value === 'string' && value.startsWith('$');
    const isNum = typeof value === 'number';
    const target = isNum ? value
      : isPercent ? parseFloat(value as string)
      : isDollar ? parseFloat((value as string).slice(1))
      : null;

    if (target === null) { setDisplayed(value); return; }

    const start = performance.now();
    const duration = 600;
    const raf = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = target * eased;
      if (isNum) setDisplayed(Math.round(cur));
      else if (isPercent) setDisplayed(`${cur.toFixed(1)}%`);
      else if (isDollar) setDisplayed(`$${cur.toFixed(2)}`);
      if (t < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [value]);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 shadow-glass
                    backdrop-blur-sm transition-all duration-200
                    hover:border-white/[0.13] hover:bg-white/[0.06]">
      <p className="text-3xl font-bold tabular-nums bg-gradient-to-b from-white to-white/60
                    bg-clip-text text-transparent">
        {displayed}
      </p>
      <p className="mt-1 text-[10px] font-semibold tracking-[0.12em] uppercase text-white/30">
        {label}
      </p>
    </div>
  );
}
