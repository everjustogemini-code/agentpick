"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { COMPLEXITY_OPTIONS, DOMAIN_DEFINITIONS, FREQUENCY_OPTIONS, HEARTBEAT_OPTIONS, MODEL_DEFINITIONS, OPS_COLOR_TOKENS, TOOL_DEFINITIONS } from "./constants";
import type { AgentListItem, ApiKeyVaultSnapshot, BenchmarkRunSnapshot, OpsSettingsSnapshot, QueryItem, QuerySetSnapshot } from "./types";
import { cn, findDomain, findModel, formatPercent, formatRelativeTime, pickDefaultSubdomain, toTitleCase } from "./utils";
import { EmptyState, Meter, Panel, RunStatusLabel, StatusBadge, StatusDot, Table } from "./ui";

type JsonInit = { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown };

async function requestJson<T>(url: string, init?: JsonInit): Promise<T> {
  const response = await fetch(url, {
    method: init?.method ?? (init?.body ? "POST" : "GET"),
    headers: { "content-type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Request failed." }));
    throw new Error(payload.error ?? "Request failed.");
  }

  return response.json();
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "ghost" | "danger" }) {
  const tone = props.tone ?? "primary";
  const palette = {
    primary: { bg: OPS_COLOR_TOKENS.text, fg: OPS_COLOR_TOKENS.surface, border: OPS_COLOR_TOKENS.text },
    ghost: { bg: OPS_COLOR_TOKENS.surface, fg: OPS_COLOR_TOKENS.text, border: OPS_COLOR_TOKENS.line },
    danger: { bg: "#fbe6e2", fg: OPS_COLOR_TOKENS.danger, border: "#efc7bf" },
  }[tone];

  return (
    <button
      {...props}
      type={props.type ?? "button"}
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60",
        props.className,
      )}
      style={{ backgroundColor: palette.bg, color: palette.fg, borderColor: palette.border }}
    />
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn("w-full rounded-2xl border px-4 py-3 text-sm outline-none", props.className)}
      style={{ borderColor: OPS_COLOR_TOKENS.line, backgroundColor: "#fffcf6", color: OPS_COLOR_TOKENS.text }}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn("w-full rounded-2xl border px-4 py-3 text-sm outline-none", props.className)}
      style={{ borderColor: OPS_COLOR_TOKENS.line, backgroundColor: "#fffcf6", color: OPS_COLOR_TOKENS.text }}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn("w-full rounded-2xl border px-4 py-3 text-sm outline-none", props.className)}
      style={{ borderColor: OPS_COLOR_TOKENS.line, backgroundColor: "#fffcf6", color: OPS_COLOR_TOKENS.text }}
    />
  );
}

function Label(props: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="block text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: OPS_COLOR_TOKENS.muted }}>
        {props.title}
      </span>
      {props.children}
      {props.hint ? (
        <span className="block text-xs" style={{ color: OPS_COLOR_TOKENS.muted }}>
          {props.hint}
        </span>
      ) : null}
    </label>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await requestJson("/api/admin/ops/auth/login", { body: { password } });
      router.push("/admin/ops");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Label title="Admin Password">
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter ADMIN_PASSWORD" />
      </Label>
      {error ? <p className="text-sm" style={{ color: OPS_COLOR_TOKENS.danger }}>{error}</p> : null}
      <Button type="submit" disabled={loading || !password.trim()}>{loading ? "Signing in..." : "Unlock Ops Console"}</Button>
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    await requestJson("/api/admin/ops/auth/logout", { body: {} });
    router.push("/admin/ops/login");
    router.refresh();
  }

  return (
    <Button tone="ghost" onClick={onClick} disabled={loading}>
      {loading ? "Leaving..." : "Log Out"}
    </Button>
  );
}

export function SeedFleetButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function seed() {
    setLoading(true);
    try {
      const response = await requestJson<{ result: { createdCount: number; planned: number } }>("/api/admin/ops/agents/seed", { body: {} });
      setMessage(`Seeded ${response.result.createdCount} of ${response.result.planned} planned agents.`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button tone="ghost" onClick={seed} disabled={loading}>
        {loading ? "Seeding..." : "Seed 50 Defaults"}
      </Button>
      {message ? <span className="text-sm" style={{ color: OPS_COLOR_TOKENS.muted }}>{message}</span> : null}
    </div>
  );
}

export function BulkAgentActions() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function bulkAction(action: string, label: string) {
    setLoading(action);
    setMessage("");
    try {
      const res = await requestJson<{ ok: boolean; updated?: number; cron?: unknown }>(
        "/api/admin/ops/agents/bulk",
        { body: { action } },
      );
      if (action === "run_all") {
        setMessage("Benchmark cron triggered.");
      } else {
        setMessage(`${label}: ${res.updated ?? 0} agents updated.`);
      }
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button tone="ghost" onClick={() => bulkAction("activate_all", "Activated")} disabled={loading !== null}>
        {loading === "activate_all" ? "Activating..." : "Activate All"}
      </Button>
      <Button tone="ghost" onClick={() => bulkAction("pause_all", "Paused")} disabled={loading !== null}>
        {loading === "pause_all" ? "Pausing..." : "Pause All"}
      </Button>
      <Button tone="primary" onClick={() => bulkAction("run_all", "Run")} disabled={loading !== null}>
        {loading === "run_all" ? "Triggering..." : "Run All Now"}
      </Button>
      {message ? <span className="text-sm" style={{ color: OPS_COLOR_TOKENS.muted }}>{message}</span> : null}
    </div>
  );
}

export function AgentsTableClient(props: { agents: AgentListItem[] }) {
  const [domain, setDomain] = useState("all");
  const [provider, setProvider] = useState("all");
  const [active, setActive] = useState("all");

  const agents = useMemo(() => {
    return props.agents.filter((agent) => {
      if (domain !== "all" && agent.domain !== domain) return false;
      if (provider !== "all" && agent.modelProvider !== provider) return false;
      if (active === "active" && !agent.isActive) return false;
      if (active === "paused" && agent.isActive) return false;
      return true;
    });
  }, [active, domain, provider, props.agents]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Label title="Domain">
          <Select value={domain} onChange={(event) => setDomain(event.target.value)}>
            <option value="all">All domains</option>
            {DOMAIN_DEFINITIONS.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.label}
              </option>
            ))}
          </Select>
        </Label>
        <Label title="Model">
          <Select value={provider} onChange={(event) => setProvider(event.target.value)}>
            <option value="all">All models</option>
            {MODEL_DEFINITIONS.map((item) => (
              <option key={item.provider} value={item.provider}>
                {item.label}
              </option>
            ))}
          </Select>
        </Label>
        <Label title="State">
          <Select value={active} onChange={(event) => setActive(event.target.value)}>
            <option value="all">All states</option>
            <option value="active">Active only</option>
            <option value="paused">Paused only</option>
          </Select>
        </Label>
      </div>

      {agents.length === 0 ? (
        <EmptyState
          title="No agents match the current filters."
          body="Try widening the filters or create a new benchmark agent."
          action={
            <Link href="/admin/ops/agents/create" className="inline-flex items-center justify-center rounded-full border border-black px-4 py-2 text-sm font-medium">
              Create Agent
            </Link>
          }
        />
      ) : (
        <Table columns={["State", "Agent", "Domain", "Model", "Last Run", "Success"]}>
          {agents.map((agent) => (
            <tr key={agent.id} className="align-top">
              <td className="px-4 py-4"><StatusDot active={agent.isActive} /></td>
              <td className="px-4 py-4">
                <Link href={`/admin/ops/agents/${agent.id}`} className="font-medium hover:underline" style={{ color: OPS_COLOR_TOKENS.text }}>
                  {agent.displayName}
                </Link>
                <p className="mt-1 text-xs" style={{ color: OPS_COLOR_TOKENS.muted }}>
                  {agent.description ?? "No description"}
                </p>
              </td>
              <td className="px-4 py-4 text-sm" style={{ color: OPS_COLOR_TOKENS.text }}>
                {findDomain(agent.domain).label}
                <p className="mt-1 text-xs" style={{ color: OPS_COLOR_TOKENS.muted }}>
                  {agent.subdomain ?? "—"}
                </p>
              </td>
              <td className="px-4 py-4 text-sm" style={{ color: OPS_COLOR_TOKENS.text }}>
                {findModel(agent.modelProvider).label}
                <p className="mt-1 text-xs" style={{ color: OPS_COLOR_TOKENS.muted }}>
                  {agent.modelName}
                </p>
              </td>
              <td className="px-4 py-4 text-sm" style={{ color: OPS_COLOR_TOKENS.text }}>
                {formatRelativeTime(agent.lastRunAt)}
              </td>
              <td className="px-4 py-4 text-sm" style={{ color: OPS_COLOR_TOKENS.text }}>
                {formatPercent(agent.avgSuccessRate)}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

type AgentFormShape = {
  displayName: string;
  domain: string;
  subdomain: string;
  description: string;
  modelProvider: string;
  modelName: string;
  evaluatorModel: string;
  testFrequency: string;
  queriesPerRun: number;
  toolsPerQuery: number;
  complexity: string[];
  toolSlugs: string[];
  querySetId: string;
  customQueries: string[];
  isActive: boolean;
  openclawEnabled: boolean;
};

function AgentForm(props: {
  initial: AgentFormShape;
  querySets: QuerySetSnapshot[];
  onSubmit: (payload: AgentFormShape) => Promise<void>;
  submitLabel: string;
  destructive?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}) {
  const [form, setForm] = useState<AgentFormShape>(props.initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const domainTools = findDomain(form.domain).suggestedTools;

  function setValue<K extends keyof AgentFormShape>(key: K, value: AgentFormShape[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await props.onSubmit(form);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save agent.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Identity">
          <div className="grid gap-4">
            <Label title="Display Name">
              <Input value={form.displayName} onChange={(event) => setValue("displayName", event.target.value)} />
            </Label>
            <div className="grid gap-4 md:grid-cols-2">
              <Label title="Domain">
                <Select
                  value={form.domain}
                  onChange={(event) => {
                    const nextDomain = event.target.value;
                    setForm((current) => ({
                      ...current,
                      domain: nextDomain,
                      subdomain: pickDefaultSubdomain(nextDomain),
                      toolSlugs: findDomain(nextDomain).suggestedTools,
                      querySetId: props.querySets.find((querySet) => querySet.domain === nextDomain)?.id ?? "",
                    }));
                  }}
                >
                  {DOMAIN_DEFINITIONS.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </Label>
              <Label title="Subdomain">
                <Input value={form.subdomain} onChange={(event) => setValue("subdomain", event.target.value)} />
              </Label>
            </div>
            <Label title="Description">
              <TextArea rows={4} value={form.description} onChange={(event) => setValue("description", event.target.value)} />
            </Label>
          </div>
        </Panel>

        <Panel title="Model">
          <div className="grid gap-4">
            <Label title="Provider">
              <Select
                value={form.modelProvider}
                onChange={(event) => {
                  const match = findModel(event.target.value);
                  setForm((current) => ({ ...current, modelProvider: match.provider, modelName: match.modelName }));
                }}
              >
                {MODEL_DEFINITIONS.map((item) => (
                  <option key={item.provider} value={item.provider}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Label>
            <Label title="Model">
              <Input value={form.modelName} onChange={(event) => setValue("modelName", event.target.value)} />
            </Label>
            <Label title="Evaluator">
              <Input value={form.evaluatorModel} onChange={(event) => setValue("evaluatorModel", event.target.value)} />
            </Label>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Testing">
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Label title="Frequency">
                <Select value={form.testFrequency} onChange={(event) => setValue("testFrequency", event.target.value)}>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Label>
              <Label title="Queries / Run">
                <Input type="number" min={1} max={10} value={form.queriesPerRun} onChange={(event) => setValue("queriesPerRun", Number(event.target.value))} />
              </Label>
              <Label title="Tools / Query">
                <Input type="number" min={1} max={8} value={form.toolsPerQuery} onChange={(event) => setValue("toolsPerQuery", Number(event.target.value))} />
              </Label>
            </div>
            <div className="space-y-3">
              <span className="block text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: OPS_COLOR_TOKENS.muted }}>
                Complexity
              </span>
              <div className="flex flex-wrap gap-3">
                {COMPLEXITY_OPTIONS.map((option) => {
                  const checked = form.complexity.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className="rounded-full border px-4 py-2 text-sm"
                      style={{
                        borderColor: checked ? OPS_COLOR_TOKENS.text : OPS_COLOR_TOKENS.line,
                        backgroundColor: checked ? OPS_COLOR_TOKENS.accentSoft : OPS_COLOR_TOKENS.surface,
                        color: OPS_COLOR_TOKENS.text,
                      }}
                      onClick={() =>
                        setValue(
                          "complexity",
                          checked ? form.complexity.filter((value) => value !== option.value) : [...form.complexity, option.value],
                        )
                      }
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Tools To Test" action={<span className="text-xs" style={{ color: OPS_COLOR_TOKENS.muted }}>Vault-backed</span>}>
          <div className="grid gap-3 md:grid-cols-2">
            {TOOL_DEFINITIONS.filter((tool) => ["tavily", "exa", "serper", "brave", "firecrawl", "jina", "perplexity"].includes(tool.slug)).map((tool) => {
              const checked = form.toolSlugs.includes(tool.slug);
              const suggested = domainTools.includes(tool.slug);
              return (
                <button
                  key={tool.slug}
                  type="button"
                  onClick={() =>
                    setValue("toolSlugs", checked ? form.toolSlugs.filter((value) => value !== tool.slug) : [...form.toolSlugs, tool.slug])
                  }
                  className="rounded-[22px] border px-4 py-4 text-left"
                  style={{
                    borderColor: checked ? OPS_COLOR_TOKENS.text : OPS_COLOR_TOKENS.line,
                    backgroundColor: checked ? "#f0ead8" : OPS_COLOR_TOKENS.surface,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium" style={{ color: OPS_COLOR_TOKENS.text }}>
                      {tool.label}
                    </span>
                    {suggested ? <StatusBadge label="Suggested" tone="success" /> : null}
                  </div>
                  <p className="mt-2 text-xs" style={{ color: OPS_COLOR_TOKENS.muted }}>
                    {tool.description}
                  </p>
                </button>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Queries">
          <div className="grid gap-4">
            <Label title="Query Set">
              <Select value={form.querySetId} onChange={(event) => setValue("querySetId", event.target.value)}>
                <option value="">Auto-generated only</option>
                {props.querySets.map((querySet) => (
                  <option key={querySet.id} value={querySet.id}>
                    {querySet.name} ({querySet.queries.length})
                  </option>
                ))}
              </Select>
            </Label>
            <Label title="Custom Queries" hint="One query per line. These always get included first.">
              <TextArea
                rows={6}
                value={form.customQueries.join("\n")}
                onChange={(event) =>
                  setValue(
                    "customQueries",
                    event.target.value
                      .split("\n")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  )
                }
              />
            </Label>
          </div>
        </Panel>

        <Panel title="Status">
          <div className="grid gap-4">
            <label className="flex items-center gap-3 text-sm" style={{ color: OPS_COLOR_TOKENS.text }}>
              <input type="checkbox" checked={form.isActive} onChange={(event) => setValue("isActive", event.target.checked)} />
              Active
            </label>
            <label className="flex items-center gap-3 text-sm" style={{ color: OPS_COLOR_TOKENS.text }}>
              <input type="checkbox" checked={form.openclawEnabled} onChange={(event) => setValue("openclawEnabled", event.target.checked)} />
              Export to OpenClaw
            </label>
            <p className="text-sm" style={{ color: OPS_COLOR_TOKENS.muted }}>
              Tool and model keys are resolved automatically from the API key vault using the selected services.
            </p>
          </div>
        </Panel>
      </div>

      {error ? <p className="text-sm" style={{ color: OPS_COLOR_TOKENS.danger }}>{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : props.submitLabel}</Button>
        {props.secondaryAction}
        {props.destructive}
      </div>
    </form>
  );
}

export function CreateAgentWizard(props: { querySets: QuerySetSnapshot[] }) {
  const router = useRouter();

  return (
    <AgentForm
      initial={{
        displayName: "",
        domain: "finance",
        subdomain: "stocks",
        description: "",
        modelProvider: "anthropic",
        modelName: "claude-sonnet-4",
        evaluatorModel: "claude-sonnet-4",
        testFrequency: "every_2h",
        queriesPerRun: 3,
        toolsPerQuery: 4,
        complexity: ["simple", "medium", "complex"],
        toolSlugs: findDomain("finance").suggestedTools,
        querySetId: props.querySets.find((item) => item.domain === "finance")?.id ?? "",
        customQueries: [],
        isActive: false,
        openclawEnabled: false,
      }}
      querySets={props.querySets}
      submitLabel="Create Agent"
      onSubmit={async (payload) => {
        const response = await requestJson<{ agent: AgentListItem }>("/api/admin/ops/agents", { body: payload });
        router.push(`/admin/ops/agents/${response.agent.id}`);
        router.refresh();
      }}
    />
  );
}

export function AgentDetailClient(props: { agent: AgentListItem; querySets: QuerySetSnapshot[] }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  return (
    <div className="space-y-8">
      <AgentForm
        initial={{
          displayName: props.agent.displayName,
          domain: props.agent.domain,
          subdomain: props.agent.subdomain ?? "",
          description: props.agent.description ?? "",
          modelProvider: props.agent.modelProvider,
          modelName: props.agent.modelName,
          evaluatorModel: props.agent.evaluatorModel,
          testFrequency: props.agent.testFrequency,
          queriesPerRun: props.agent.queriesPerRun,
          toolsPerQuery: props.agent.toolsPerQuery,
          complexity: props.agent.complexity,
          toolSlugs: props.agent.toolSlugs,
          querySetId: props.agent.querySetId ?? "",
          customQueries: props.agent.customQueries,
          isActive: props.agent.isActive,
          openclawEnabled: props.agent.openclawEnabled,
        }}
        querySets={props.querySets}
        submitLabel="Save Changes"
        secondaryAction={
          <Button
            tone="ghost"
            disabled={running}
            onClick={async () => {
              setRunning(true);
              try {
                await requestJson(`/api/admin/ops/agents/${props.agent.id}/run`, { body: {} });
                router.refresh();
              } finally {
                setRunning(false);
              }
            }}
          >
            {running ? "Running..." : "Run Now"}
          </Button>
        }
        destructive={
          <Button
            tone="danger"
            onClick={async () => {
              if (!window.confirm("Delete this benchmark agent config?")) return;
              await requestJson(`/api/admin/ops/agents/${props.agent.id}`, { method: "DELETE" });
              router.push("/admin/ops/agents");
              router.refresh();
            }}
          >
            Delete
          </Button>
        }
        onSubmit={async (payload) => {
          await requestJson(`/api/admin/ops/agents/${props.agent.id}`, {
            method: "PATCH",
            body: payload,
          });
          router.refresh();
        }}
      />

      <Panel title="Recent Runs">
        {props.agent.recentRuns.length === 0 ? (
          <EmptyState title="No runs yet" body="Run this agent once to populate execution history." />
        ) : (
          <Table columns={["Started", "Q × T", "Relevance", "Latency", "Status"]}>
            {props.agent.recentRuns.map((run) => (
              <tr key={run.id}>
                <td className="px-4 py-4 text-sm" style={{ color: OPS_COLOR_TOKENS.text }}>{formatRelativeTime(run.startedAt)}</td>
                <td className="px-4 py-4 text-sm" style={{ color: OPS_COLOR_TOKENS.text }}>{run.queriesRun} × {run.toolsTested}</td>
                <td className="px-4 py-4 text-sm" style={{ color: OPS_COLOR_TOKENS.text }}>{run.avgRelevance?.toFixed(2) ?? "—"}</td>
                <td className="px-4 py-4 text-sm" style={{ color: OPS_COLOR_TOKENS.text }}>{run.avgLatencyMs ? `${run.avgLatencyMs}ms` : "—"}</td>
                <td className="px-4 py-4"><RunStatusLabel status={run.status} /></td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </div>
  );
}

export function ApiKeysClient(props: { initialKeys: ApiKeyVaultSnapshot[] }) {
  const router = useRouter();
  const [keys, setKeys] = useState(props.initialKeys);
  const [editing, setEditing] = useState<ApiKeyVaultSnapshot | null>(null);
  const [form, setForm] = useState({ service: "tavily", displayName: "Tavily Search API", apiKey: "", tier: "free", monthlyLimit: "", notes: "" });
  const [testing, setTesting] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  function resetForm() {
    setEditing(null);
    setForm({ service: "tavily", displayName: "Tavily Search API", apiKey: "", tier: "free", monthlyLimit: "", notes: "" });
  }

  async function save() {
    const saved = await requestJson<{ key: ApiKeyVaultSnapshot }>("/api/admin/ops/keys", {
      body: {
        id: editing?.id,
        service: form.service,
        displayName: form.displayName,
        apiKey: form.apiKey,
        tier: form.tier,
        monthlyLimit: form.monthlyLimit ? Number(form.monthlyLimit) : null,
        notes: form.notes || null,
      },
    });

    setKeys((current) => {
      const next = current.filter((item) => item.id !== saved.key.id);
      return [...next, saved.key].sort((left, right) => left.service.localeCompare(right.service));
    });
    setMessage(`Saved ${saved.key.displayName}.`);
    resetForm();
    router.refresh();
  }

  async function runTest(id: string) {
    setTesting(id);
    const result = await requestJson<{ result: { status: string; latencyMs: number } }>(`/api/admin/ops/keys/test`, { body: { id } });
    setMessage(`Key test finished: ${result.result.status} in ${result.result.latencyMs}ms.`);
    setTesting(null);
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <Panel title="Vault Keys" action={<Button tone="ghost" onClick={() => requestJson("/api/admin/ops/keys/test", { body: { all: true } }).then(() => router.refresh())}>Test All Keys</Button>}>
        {keys.length === 0 ? (
          <EmptyState title="No keys yet" body="Add at least one provider and one tool key to start configuring agents." />
        ) : (
          <Table columns={["Service", "Tier", "Usage", "Status", "Actions"]}>
            {keys.map((key) => (
              <tr key={key.id}>
                <td className="px-4 py-4">
                  <p className="text-sm font-medium" style={{ color: OPS_COLOR_TOKENS.text }}>{key.displayName}</p>
                  <p className="mt-1 text-xs" style={{ color: OPS_COLOR_TOKENS.muted }}>{key.keyPreview}</p>
                </td>
                <td className="px-4 py-4 text-sm" style={{ color: OPS_COLOR_TOKENS.text }}>{toTitleCase(key.tier)}</td>
                <td className="px-4 py-4">
                  <Meter value={key.monthlyLimit ? Math.round((key.usedThisMonth / key.monthlyLimit) * 100) : null} numerator={key.usedThisMonth} denominator={key.monthlyLimit} />
                </td>
                <td className="px-4 py-4"><StatusBadge label={toTitleCase(key.status)} tone={key.status === "active" ? "success" : key.status === "expired" ? "danger" : "warning"} /></td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      tone="ghost"
                      onClick={() => {
                        setEditing(key);
                        setForm({
                          service: key.service,
                          displayName: key.displayName,
                          apiKey: "",
                          tier: key.tier,
                          monthlyLimit: key.monthlyLimit ? String(key.monthlyLimit) : "",
                          notes: key.notes ?? "",
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button tone="ghost" disabled={testing === key.id} onClick={() => runTest(key.id)}>
                      {testing === key.id ? "Testing..." : "Test"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      <Panel title={editing ? "Edit Key" : "Add Key"}>
        <div className="space-y-4">
          <Label title="Service">
            <Select value={form.service} onChange={(event) => setForm((current) => ({ ...current, service: event.target.value }))}>
              {TOOL_DEFINITIONS.map((tool) => (
                <option key={tool.slug} value={tool.slug}>
                  {tool.label}
                </option>
              ))}
            </Select>
          </Label>
          <Label title="Display Name">
            <Input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} />
          </Label>
          <Label title="API Key" hint={editing ? "Leave blank only if you are replacing it immediately." : undefined}>
            <Input value={form.apiKey} onChange={(event) => setForm((current) => ({ ...current, apiKey: event.target.value }))} placeholder="sk-..." />
          </Label>
          <div className="grid gap-4 md:grid-cols-2">
            <Label title="Tier">
              <Input value={form.tier} onChange={(event) => setForm((current) => ({ ...current, tier: event.target.value }))} />
            </Label>
            <Label title="Monthly Limit">
              <Input value={form.monthlyLimit} onChange={(event) => setForm((current) => ({ ...current, monthlyLimit: event.target.value }))} />
            </Label>
          </div>
          <Label title="Notes">
            <TextArea rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </Label>
          {message ? <p className="text-sm" style={{ color: OPS_COLOR_TOKENS.muted }}>{message}</p> : null}
          <div className="flex gap-3">
            <Button onClick={save}>Save Key</Button>
            <Button tone="ghost" onClick={resetForm}>Clear</Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export function QuerySetsClient(props: { initialQuerySets: QuerySetSnapshot[] }) {
  const router = useRouter();
  const [querySets, setQuerySets] = useState(props.initialQuerySets);
  const [activeId, setActiveId] = useState(props.initialQuerySets[0]?.id ?? "");
  const [message, setMessage] = useState("");

  const active = querySets.find((item) => item.id === activeId) ?? null;

  async function saveQuerySet(querySet: QuerySetSnapshot) {
    const saved = await requestJson<{ querySet: QuerySetSnapshot }>("/api/admin/ops/queries", { body: querySet });
    setQuerySets((current) => {
      const next = current.filter((item) => item.id !== saved.querySet.id);
      return [...next, saved.querySet].sort((left, right) => left.name.localeCompare(right.name));
    });
    setActiveId(saved.querySet.id);
    setMessage(`Saved ${saved.querySet.name}.`);
    router.refresh();
  }

  async function generate(domain: string) {
    const generated = await requestJson<{ queries: QueryItem[] }>("/api/admin/ops/queries", {
      method: "POST",
      body: { action: "generate", domain },
    });
    if (!active) return;
    await saveQuerySet({ ...active, queries: generated.queries });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.6fr]">
      <Panel title="Sets" action={<Button tone="ghost" onClick={() => {
        const fresh: QuerySetSnapshot = {
          id: `draft-${Date.now()}`,
          name: "New Query Set",
          domain: "finance",
          description: "",
          version: 1,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          queries: [],
        };
        setQuerySets((current) => [fresh, ...current]);
        setActiveId(fresh.id);
      }}>Create Set</Button>}>
        <div className="space-y-3">
          {querySets.map((querySet) => (
            <button
              key={querySet.id}
              type="button"
              onClick={() => setActiveId(querySet.id)}
              className="w-full rounded-[22px] border px-4 py-4 text-left"
              style={{
                borderColor: querySet.id === activeId ? OPS_COLOR_TOKENS.text : OPS_COLOR_TOKENS.line,
                backgroundColor: querySet.id === activeId ? "#f0ead8" : OPS_COLOR_TOKENS.surface,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium" style={{ color: OPS_COLOR_TOKENS.text }}>{querySet.name}</span>
                {querySet.isActive ? <StatusBadge label="Active" tone="success" /> : <StatusBadge label="Paused" tone="warning" />}
              </div>
              <p className="mt-2 text-xs" style={{ color: OPS_COLOR_TOKENS.muted }}>
                {querySet.queries.length} queries · {findDomain(querySet.domain).label}
              </p>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title={active?.name ?? "Query Set"} action={active ? <Button tone="ghost" onClick={() => generate(active.domain)}>Generate 50 Queries</Button> : null}>
        {!active ? (
          <EmptyState title="Select a query set" body="Choose a set from the list to edit its queries inline." />
        ) : (
          <QuerySetEditor key={active.id} querySet={active} onSave={saveQuerySet} message={message} />
        )}
      </Panel>
    </div>
  );
}

function QuerySetEditor(props: { querySet: QuerySetSnapshot; onSave: (querySet: QuerySetSnapshot) => Promise<void>; message: string }) {
  const [querySet, setQuerySet] = useState(props.querySet);

  function updateQuery(index: number, patch: Partial<QueryItem>) {
    setQuerySet((current) => ({
      ...current,
      queries: current.queries.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Label title="Name">
          <Input value={querySet.name} onChange={(event) => setQuerySet((current) => ({ ...current, name: event.target.value }))} />
        </Label>
        <Label title="Domain">
          <Select value={querySet.domain} onChange={(event) => setQuerySet((current) => ({ ...current, domain: event.target.value }))}>
            {DOMAIN_DEFINITIONS.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.label}
              </option>
            ))}
          </Select>
        </Label>
        <Label title="Version">
          <Input type="number" min={1} value={querySet.version} onChange={(event) => setQuerySet((current) => ({ ...current, version: Number(event.target.value) }))} />
        </Label>
      </div>
      <Label title="Description">
        <TextArea rows={3} value={querySet.description ?? ""} onChange={(event) => setQuerySet((current) => ({ ...current, description: event.target.value }))} />
      </Label>

      <div className="space-y-3">
        {querySet.queries.map((item, index) => (
          <div key={`${querySet.id}-${index}`} className="grid gap-3 rounded-[22px] border p-4 md:grid-cols-[1.6fr_0.7fr_1fr_auto]" style={{ borderColor: OPS_COLOR_TOKENS.line }}>
            <Input value={item.query} onChange={(event) => updateQuery(index, { query: event.target.value })} />
            <Select value={item.complexity} onChange={(event) => updateQuery(index, { complexity: event.target.value as QueryItem["complexity"] })}>
              {COMPLEXITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
            <Input value={item.intent} onChange={(event) => updateQuery(index, { intent: event.target.value })} />
            <Button tone="ghost" onClick={() => setQuerySet((current) => ({ ...current, queries: current.queries.filter((_, itemIndex) => itemIndex !== index) }))}>Remove</Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button tone="ghost" onClick={() => setQuerySet((current) => ({ ...current, queries: [...current.queries, { query: "", complexity: "simple", intent: "" }] }))}>
          Add Query
        </Button>
        <Button onClick={() => props.onSave(querySet)}>Save Set</Button>
      </div>
      {props.message ? <p className="text-sm" style={{ color: OPS_COLOR_TOKENS.muted }}>{props.message}</p> : null}
    </div>
  );
}

export function RunsClient(props: { initialRuns: BenchmarkRunSnapshot[]; agents: AgentListItem[] }) {
  const [status, setStatus] = useState("all");
  const [agentId, setAgentId] = useState("all");
  const [hours, setHours] = useState(24);
  const [selected, setSelected] = useState<BenchmarkRunSnapshot | null>(null);

  const runs = useMemo(() => {
    return props.initialRuns.filter((run) => {
      if (status !== "all" && run.status !== status) return false;
      if (agentId !== "all" && run.configId !== agentId) return false;
      return Date.now() - new Date(run.startedAt).getTime() <= hours * 60 * 60 * 1000;
    });
  }, [agentId, hours, props.initialRuns, status]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Label title="Agent">
          <Select value={agentId} onChange={(event) => setAgentId(event.target.value)}>
            <option value="all">All agents</option>
            {props.agents.map((agent) => (
              <option key={agent.id} value={agent.id}>{agent.displayName}</option>
            ))}
          </Select>
        </Label>
        <Label title="Status">
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="running">Running</option>
            <option value="failed">Failed</option>
            <option value="timeout">Timeout</option>
          </Select>
        </Label>
        <Label title="Window">
          <Select value={String(hours)} onChange={(event) => setHours(Number(event.target.value))}>
            <option value="1">Last hour</option>
            <option value="24">Last 24h</option>
            <option value="168">Last 7d</option>
          </Select>
        </Label>
      </div>

      <Table columns={["Time", "Agent", "Q × T", "Rel", "Status"]}>
        {runs.map((run) => (
          <tr key={run.id} className="cursor-pointer hover:bg-[#faf7ef]" onClick={() => setSelected(run)}>
            <td className="px-4 py-4 text-sm" style={{ color: OPS_COLOR_TOKENS.text }}>{formatRelativeTime(run.startedAt)}</td>
            <td className="px-4 py-4 text-sm" style={{ color: OPS_COLOR_TOKENS.text }}>{run.configDisplayName}</td>
            <td className="px-4 py-4 text-sm" style={{ color: OPS_COLOR_TOKENS.text }}>{run.queriesRun} × {run.toolsTested}</td>
            <td className="px-4 py-4 text-sm" style={{ color: OPS_COLOR_TOKENS.text }}>{run.avgRelevance?.toFixed(2) ?? "—"}</td>
            <td className="px-4 py-4"><RunStatusLabel status={run.status} /></td>
          </tr>
        ))}
      </Table>

      {selected ? (
        <Panel title={selected.configDisplayName}>
          <div className="grid gap-4 md:grid-cols-4">
            <Metric label="Started" value={formatRelativeTime(selected.startedAt)} />
            <Metric label="Success Rate" value={formatPercent(selected.successRate)} />
            <Metric label="Avg Relevance" value={selected.avgRelevance?.toFixed(2) ?? "—"} />
            <Metric label="Latency" value={selected.avgLatencyMs ? `${selected.avgLatencyMs}ms` : "—"} />
          </div>
          <div className="mt-6 space-y-3">
            {selected.results.map((item, index) => (
              <div key={`${selected.id}-${index}`} className="rounded-[22px] border p-4" style={{ borderColor: OPS_COLOR_TOKENS.line }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium" style={{ color: OPS_COLOR_TOKENS.text }}>{item.tool}</p>
                    <p className="text-xs" style={{ color: OPS_COLOR_TOKENS.muted }}>{item.query}</p>
                  </div>
                  <RunStatusLabel status={item.status} />
                </div>
                <p className="mt-2 text-xs" style={{ color: OPS_COLOR_TOKENS.muted }}>
                  {item.latencyMs ? `${item.latencyMs}ms` : "—"} · relevance {item.relevance?.toFixed(2) ?? "—"}
                  {item.error ? ` · ${item.error}` : ""}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border p-4" style={{ borderColor: OPS_COLOR_TOKENS.line }}>
      <p className="text-xs uppercase tracking-[0.18em]" style={{ color: OPS_COLOR_TOKENS.muted }}>{props.label}</p>
      <p className="mt-2 text-lg font-semibold" style={{ color: OPS_COLOR_TOKENS.text }}>{props.value}</p>
    </div>
  );
}

export function ScheduleClient(props: { settings: OpsSettingsSnapshot; activeAgents: number; dueNow: number; buckets: Array<{ frequency: string; label: string; count: number }> }) {
  const router = useRouter();
  const [settings, setSettings] = useState(props.settings);
  const [message, setMessage] = useState("");

  async function save(applyToAll = false) {
    await requestJson("/api/admin/ops/schedule", { body: { ...settings, applyToAll } });
    setMessage(applyToAll ? "Saved settings and applied the new default frequency to all agents." : "Saved schedule settings.");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <Panel title="Scheduling Defaults">
        <div className="grid gap-4">
          <Label title="Default Frequency">
            <Select value={settings.defaultFrequency} onChange={(event) => setSettings((current) => ({ ...current, defaultFrequency: event.target.value as OpsSettingsSnapshot["defaultFrequency"] }))}>
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Label>
          <Label title="Auto-pause After">
            <Input type="number" min={1} max={10} value={settings.autoPauseAfter} onChange={(event) => setSettings((current) => ({ ...current, autoPauseAfter: Number(event.target.value) }))} />
          </Label>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => save(false)}>Save Settings</Button>
            <Button tone="ghost" onClick={() => save(true)}>Save + Apply To All</Button>
          </div>
          {message ? <p className="text-sm" style={{ color: OPS_COLOR_TOKENS.muted }}>{message}</p> : null}
        </div>
      </Panel>

      <Panel title="Fleet Schedule Snapshot">
        <div className="space-y-4">
          <Metric label="Active Agents" value={String(props.activeAgents)} />
          <Metric label="Due Right Now" value={String(props.dueNow)} />
          <div className="space-y-3">
            {props.buckets.map((bucket) => (
              <div key={bucket.frequency} className="flex items-center justify-between rounded-[18px] border px-4 py-3" style={{ borderColor: OPS_COLOR_TOKENS.line }}>
                <span className="text-sm" style={{ color: OPS_COLOR_TOKENS.text }}>{bucket.label}</span>
                <span className="text-sm font-medium" style={{ color: OPS_COLOR_TOKENS.text }}>{bucket.count}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}

export function OpenClawClient(props: { settings: OpsSettingsSnapshot; agents: AgentListItem[] }) {
  const router = useRouter();
  const [settings, setSettings] = useState(props.settings);
  const [message, setMessage] = useState("");

  async function save() {
    await requestJson("/api/admin/ops/openclaw/config", { body: settings });
    setMessage("Saved OpenClaw settings.");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <Panel title="Configuration">
        <div className="grid gap-4">
          <Label title="Workspace">
            <Input value={settings.openclawWorkspace ?? ""} onChange={(event) => setSettings((current) => ({ ...current, openclawWorkspace: event.target.value }))} placeholder="~/.openclaw/agentpick" />
          </Label>
          <Label title="Heartbeat Interval">
            <Select value={settings.heartbeatInterval} onChange={(event) => setSettings((current) => ({ ...current, heartbeatInterval: event.target.value as OpsSettingsSnapshot["heartbeatInterval"] }))}>
              {HEARTBEAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Label>
          <Label title="Export Base URL" hint="Used to generate absolute heartbeat URLs in YAML/JSON exports.">
            <Input value={settings.exportBaseUrl ?? ""} onChange={(event) => setSettings((current) => ({ ...current, exportBaseUrl: event.target.value }))} placeholder="https://agentpick.dev" />
          </Label>
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm" style={{ color: OPS_COLOR_TOKENS.text }}>
              <input type="checkbox" checked={settings.alertEmail} onChange={(event) => setSettings((current) => ({ ...current, alertEmail: event.target.checked }))} />
              Alert by email
            </label>
            <label className="flex items-center gap-2 text-sm" style={{ color: OPS_COLOR_TOKENS.text }}>
              <input type="checkbox" checked={settings.alertOpenclaw} onChange={(event) => setSettings((current) => ({ ...current, alertOpenclaw: event.target.checked }))} />
              Alert in OpenClaw
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={save}>Save OpenClaw Config</Button>
            <a
              href="/api/admin/ops/openclaw/export?format=yaml"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium"
              style={{ borderColor: OPS_COLOR_TOKENS.line, backgroundColor: OPS_COLOR_TOKENS.surface, color: OPS_COLOR_TOKENS.text }}
            >
              Export YAML
            </a>
            <a
              href="/api/admin/ops/openclaw/export?format=json"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium"
              style={{ borderColor: OPS_COLOR_TOKENS.line, backgroundColor: OPS_COLOR_TOKENS.surface, color: OPS_COLOR_TOKENS.text }}
            >
              Export JSON
            </a>
          </div>
          {message ? <p className="text-sm" style={{ color: OPS_COLOR_TOKENS.muted }}>{message}</p> : null}
        </div>
      </Panel>

      <Panel title="Export Preview">
        <div className="space-y-3">
          <Metric label="Connected" value={settings.openclawWorkspace ? "Yes" : "Not yet"} />
          <Metric label="Exported Agents" value={String(props.agents.filter((agent) => agent.openclawEnabled).length)} />
          <Metric label="Auto-pause Threshold" value={`${settings.autoPauseAfter} fails`} />
        </div>
      </Panel>
    </div>
  );
}
