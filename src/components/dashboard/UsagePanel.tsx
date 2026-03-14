'use client';

import { useEffect, useState } from 'react';

type SelectableStrategy = 'AUTO' | 'BALANCED' | 'CHEAPEST' | 'FASTEST';
type KnownStrategy = SelectableStrategy | 'MOST_ACCURATE' | 'MANUAL';

interface UsagePanelProps {
  apiKey: string;
  onLogout: () => void;
}

interface AccountUsageSummary {
  monthlyLimit: number | null;
  monthlyUsed: number;
  monthlyRemaining: number | null;
}

interface AccountResponse {
  account: {
    email: string | null;
    plan: string;
    planLabel?: string;
    strategy: KnownStrategy;
    monthlyBudgetUsd: number | null;
    spentThisMonth: number;
    usage?: AccountUsageSummary;
  };
}

interface UsageResponse {
  plan_label?: string;
  account: {
    plan: string;
    monthlyLimit: number | null;
    callsThisMonth: number;
    strategy: KnownStrategy;
  };
  stats: {
    totalCalls: number;
    totalCostUsd: number;
    successRate: number;
    avgLatencyMs: number;
  };
}

interface PanelState {
  email: string | null;
  plan: string;
  planLabel: string;
  strategy: KnownStrategy;
  monthlyBudgetUsd: number | null;
  spentThisMonth: number;
  callsThisMonth: number;
  monthlyLimit: number | null;
  monthlyRemaining: number | null;
  totalCallsLast30Days: number;
  totalCostLast30Days: number;
  successRate: number;
  avgLatencyMs: number;
}

const STRATEGY_OPTIONS: Array<{
  value: SelectableStrategy;
  label: string;
  description: string;
}> = [
  {
    value: 'AUTO',
    label: 'Auto',
    description: 'Let the router pick the best mode per request.',
  },
  {
    value: 'BALANCED',
    label: 'Balanced',
    description: 'Optimize for value across quality, cost, and speed.',
  },
  {
    value: 'CHEAPEST',
    label: 'Cheapest',
    description: 'Bias toward the lowest cost path.',
  },
  {
    value: 'FASTEST',
    label: 'Fastest',
    description: 'Favor the quickest available route.',
  },
];

const STRATEGY_LABELS: Record<KnownStrategy, string> = {
  AUTO: 'Auto',
  BALANCED: 'Balanced',
  CHEAPEST: 'Cheapest',
  FASTEST: 'Fastest',
  MOST_ACCURATE: 'Most accurate',
  MANUAL: 'Manual',
};

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
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function formatPlan(plan: string) {
  const lower = plan.toLowerCase();
  return lower.slice(0, 1).toUpperCase() + lower.slice(1);
}

function formatUsageLabel(callsThisMonth: number, monthlyLimit: number | null) {
  if (monthlyLimit === null) {
    return `${callsThisMonth.toLocaleString()} calls this month`;
  }

  return `${callsThisMonth.toLocaleString()} / ${monthlyLimit.toLocaleString()} calls`;
}

function formatUsageContext(callsThisMonth: number, monthlyLimit: number | null, monthlyRemaining: number | null) {
  if (monthlyLimit === null) {
    return 'No monthly cap on this account.';
  }

  if (monthlyRemaining !== null) {
    return `${monthlyRemaining.toLocaleString()} calls remaining this month.`;
  }

  return `${Math.max(monthlyLimit - callsThisMonth, 0).toLocaleString()} calls remaining this month.`;
}

function maskApiKey(apiKey: string) {
  if (apiKey.length <= 12) return apiKey;
  return `${apiKey.slice(0, 12)}...${apiKey.slice(-4)}`;
}

function projectedMonthlyCost(spentThisMonth: number) {
  const now = new Date();
  const elapsedDays = Math.max(now.getDate(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  return spentThisMonth === 0 ? 0 : (spentThisMonth / elapsedDays) * daysInMonth;
}

export function UsagePanel({ apiKey, onLogout }: UsagePanelProps) {
  const [panel, setPanel] = useState<PanelState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [budgetInput, setBudgetInput] = useState('');
  const [strategyPending, setStrategyPending] = useState<SelectableStrategy | null>(null);
  const [budgetPending, setBudgetPending] = useState(false);
  const [budgetMessage, setBudgetMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadPanel() {
      setLoading(true);
      setError('');

      try {
        const [accountResponse, usageResponse] = await Promise.all([
          fetch('/api/v1/router/account', {
            headers: authHeaders(apiKey),
          }),
          fetch('/api/v1/router/usage?days=30', {
            headers: authHeaders(apiKey),
          }),
        ]);

        if (accountResponse.status === 401 || usageResponse.status === 401) {
          onLogout();
          return;
        }

        if (!accountResponse.ok || !usageResponse.ok) {
          const data = await Promise.all([
            accountResponse.json().catch(() => null),
            usageResponse.json().catch(() => null),
          ]);
          throw new Error(
            data[0]?.error?.message ??
              data[1]?.error?.message ??
              data[0]?.message ??
              data[1]?.message ??
              'Unable to load dashboard usage.',
          );
        }

        const accountData = (await accountResponse.json()) as AccountResponse;
        const usageData = (await usageResponse.json()) as UsageResponse;
        const plan = usageData.account.plan ?? accountData.account.plan;
        const monthlyLimit = usageData.account.monthlyLimit ?? accountData.account.usage?.monthlyLimit ?? null;
        const callsThisMonth =
          usageData.account.callsThisMonth ?? accountData.account.usage?.monthlyUsed ?? 0;
        const monthlyRemaining =
          accountData.account.usage?.monthlyRemaining ??
          (monthlyLimit === null ? null : Math.max(monthlyLimit - callsThisMonth, 0));

        if (!active) return;

        setPanel({
          email: accountData.account.email,
          plan,
          planLabel: accountData.account.planLabel ?? usageData.plan_label ?? formatPlan(plan),
          strategy: usageData.account.strategy ?? accountData.account.strategy,
          monthlyBudgetUsd: accountData.account.monthlyBudgetUsd,
          spentThisMonth: accountData.account.spentThisMonth,
          callsThisMonth,
          monthlyLimit,
          monthlyRemaining,
          totalCallsLast30Days: usageData.stats.totalCalls,
          totalCostLast30Days: usageData.stats.totalCostUsd,
          successRate: usageData.stats.successRate,
          avgLatencyMs: usageData.stats.avgLatencyMs,
        });
        setBudgetInput(
          accountData.account.monthlyBudgetUsd === null
            ? ''
            : String(accountData.account.monthlyBudgetUsd),
        );
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard usage.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPanel();

    return () => {
      active = false;
    };
  }, [apiKey, onLogout]);

  async function handleStrategyChange(strategy: SelectableStrategy) {
    if (!panel || panel.strategy === strategy || strategyPending) return;

    setStrategyPending(strategy);
    setError('');

    try {
      const response = await fetch('/api/v1/router/strategy', {
        method: 'POST',
        headers: authHeaders(apiKey, true),
        body: JSON.stringify({ strategy }),
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message ?? data?.message ?? 'Unable to update strategy.');
      }

      setPanel((current) => (current ? { ...current, strategy } : current));
    } catch (strategyError) {
      setError(strategyError instanceof Error ? strategyError.message : 'Unable to update strategy.');
    } finally {
      setStrategyPending(null);
    }
  }

  async function handleBudgetBlur() {
    if (!panel) return;

    const trimmed = budgetInput.trim();
    const currentValue = panel.monthlyBudgetUsd === null ? '' : String(panel.monthlyBudgetUsd);

    if (trimmed === currentValue) return;
    if (trimmed === '') {
      setBudgetInput(currentValue);
      setBudgetMessage('Add a value to set a monthly budget cap.');
      return;
    }

    const nextBudget = Number(trimmed);
    if (!Number.isFinite(nextBudget) || nextBudget < 0) {
      setBudgetInput(currentValue);
      setBudgetMessage('Budget must be a non-negative USD amount.');
      return;
    }

    setBudgetPending(true);
    setBudgetMessage('');
    setError('');

    try {
      const response = await fetch('/api/v1/router/budget', {
        method: 'POST',
        headers: authHeaders(apiKey, true),
        body: JSON.stringify({ monthly_budget_usd: nextBudget }),
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message ?? data?.message ?? 'Unable to update budget.');
      }

      setPanel((current) =>
        current
          ? {
              ...current,
              monthlyBudgetUsd: nextBudget,
            }
          : current,
      );
      setBudgetInput(String(nextBudget));
      setBudgetMessage('Monthly budget updated.');
    } catch (budgetError) {
      setBudgetInput(currentValue);
      setBudgetMessage(budgetError instanceof Error ? budgetError.message : 'Unable to update budget.');
    } finally {
      setBudgetPending(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-[32px] border border-slate-200 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-32 rounded-full bg-slate-200" />
          <div className="h-10 w-64 rounded-full bg-slate-200" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-28 rounded-3xl bg-slate-100" />
            <div className="h-28 rounded-3xl bg-slate-100" />
            <div className="h-28 rounded-3xl bg-slate-100" />
          </div>
          <div className="h-56 rounded-[28px] bg-slate-100" />
        </div>
      </section>
    );
  }

  if (!panel) {
    return (
      <section className="rounded-[32px] border border-rose-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-500">
          Dashboard error
        </p>
        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
          The usage panel could not be loaded.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {error || 'Try reconnecting your API key and loading the dashboard again.'}
        </p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-6 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Reconnect API key
        </button>
      </section>
    );
  }

  const usagePercent =
    panel.monthlyLimit === null || panel.monthlyLimit === 0
      ? 100
      : Math.min((panel.callsThisMonth / panel.monthlyLimit) * 100, 100);
  const projectedCost = projectedMonthlyCost(panel.spentThisMonth);
  const usageToneClass =
    panel.monthlyLimit !== null && usagePercent >= 90
      ? 'bg-[linear-gradient(90deg,_#fb7185_0%,_#f97316_100%)]'
      : panel.monthlyLimit !== null && usagePercent >= 75
        ? 'bg-[linear-gradient(90deg,_#f59e0b_0%,_#fb7185_100%)]'
        : 'bg-[linear-gradient(90deg,_#22d3ee_0%,_#818cf8_45%,_#f472b6_100%)]';

  return (
    <section className="rounded-[32px] border border-white/70 bg-white/88 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Account & usage
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
            {panel.planLabel} plan
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {panel.email
              ? `Connected as ${panel.email}.`
              : 'Connected with your router API key.'}{' '}
            Strategy and budget updates are sent directly to the live router endpoints.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 font-mono text-xs text-slate-600">
            {maskApiKey(apiKey)}
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Forget key
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-[0.82fr_1.2fr_0.82fr_0.92fr]">
        <div className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">Plan</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
            {panel.planLabel}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {panel.monthlyLimit === null
              ? 'Custom monthly volume with no published cap.'
              : `${panel.monthlyLimit.toLocaleString()} routed calls included each month.`}
          </p>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400">
            {panel.plan}
          </p>
        </div>

        <div className="rounded-[28px] bg-slate-950 p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-cyan-300/80">
                Monthly usage
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
                {panel.callsThisMonth.toLocaleString()}
              </p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-200">
              {panel.monthlyLimit === null ? 'Custom limit' : panel.monthlyLimit.toLocaleString()}
            </span>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>{formatUsageLabel(panel.callsThisMonth, panel.monthlyLimit)}</span>
              <span>{panel.monthlyLimit === null ? 'No cap' : `${usagePercent.toFixed(0)}% used`}</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-[width] duration-300 ${usageToneClass}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-300">
              {formatUsageContext(panel.callsThisMonth, panel.monthlyLimit, panel.monthlyRemaining)}
            </p>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">
            Estimated cost
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
            {formatCurrency(projectedCost)}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Projected monthly spend from {formatCurrency(panel.spentThisMonth)} spent so far this
            month.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            {panel.monthlyBudgetUsd === null
              ? 'No budget cap is set.'
              : `${formatCurrency(panel.monthlyBudgetUsd)} budget cap configured.`}
          </p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">
            Budget cap
          </p>
          <label className="mt-3 block text-sm font-medium text-slate-700" htmlFor="monthly-budget">
            Monthly budget (USD)
          </label>
          <div className="mt-2 flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[inset_0_1px_0_rgba(15,23,42,0.03)]">
            <span className="px-4 text-sm font-medium text-slate-400">$</span>
            <input
              id="monthly-budget"
              type="number"
              min="0"
              step="0.01"
              value={budgetInput}
              onChange={(event) => setBudgetInput(event.target.value)}
              onBlur={handleBudgetBlur}
              placeholder={panel.monthlyBudgetUsd === null ? 'No cap set' : undefined}
              className="w-full bg-transparent px-0 py-3 pr-4 text-sm text-slate-950 outline-none"
            />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Updates on blur via <code>/api/v1/router/budget</code>.
          </p>
          <p className={`mt-2 text-sm ${budgetPending ? 'text-slate-500' : 'text-slate-600'}`}>
            {budgetPending ? 'Saving budget...' : budgetMessage || 'Leave your existing value to keep it unchanged.'}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(248,250,252,0.96)_0%,_rgba(255,255,255,0.96)_100%)] p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">
              Current strategy
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              {STRATEGY_LABELS[panel.strategy]}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Changing a mode sends a POST request to <code>/api/v1/router/strategy</code>.
            </p>
            {panel.strategy === 'MOST_ACCURATE' || panel.strategy === 'MANUAL' ? (
              <p className="mt-2 text-sm leading-6 text-amber-700">
                This account is currently on {STRATEGY_LABELS[panel.strategy].toLowerCase()}. The
                quick selector below exposes the four primary dashboard modes.
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {STRATEGY_OPTIONS.map((option) => {
              const active = panel.strategy === option.value;
              const pending = strategyPending === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleStrategyChange(option.value)}
                  disabled={Boolean(strategyPending)}
                  className={`rounded-[24px] border px-4 py-4 text-left transition ${
                    active
                      ? 'border-slate-950 bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]'
                      : 'border-slate-200 bg-white text-slate-950 hover:border-slate-300 hover:bg-slate-50'
                  } ${strategyPending ? 'cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold tracking-[-0.02em]">
                      {pending ? 'Updating...' : option.label}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${
                        active ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {option.value}
                    </span>
                  </div>
                  <p className={`mt-3 text-sm leading-6 ${active ? 'text-slate-300' : 'text-slate-600'}`}>
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
              Last 30d calls
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              {panel.totalCallsLast30Days.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
              Last 30d cost
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              {formatCurrency(panel.totalCostLast30Days)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
              Health
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              {(panel.successRate * 100).toFixed(1)}%
            </p>
            <p className="mt-2 text-sm text-slate-600">{panel.avgLatencyMs} ms average latency</p>
          </div>
        </div>

        {error ? <p className="mt-6 text-sm text-rose-600">{error}</p> : null}
      </div>
    </section>
  );
}
