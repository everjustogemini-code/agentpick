import Link from "next/link";
import { OPS_COLOR_TOKENS } from "./constants";
import { cn, formatPercent, formatRelativeTime, toTitleCase } from "./utils";

export function OpsMark() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-2xl border text-lg font-semibold"
        style={{ borderColor: OPS_COLOR_TOKENS.line, backgroundColor: OPS_COLOR_TOKENS.accentSoft }}
      >
        ⬡
      </div>
      <div>
        <p className="text-sm uppercase tracking-[0.24em]" style={{ color: OPS_COLOR_TOKENS.muted }}>
          AgentPick
        </p>
        <h1 className="text-xl font-semibold" style={{ color: OPS_COLOR_TOKENS.text }}>
          Ops
        </h1>
      </div>
    </div>
  );
}

export function OpsNav() {
  const links = [
    { href: "/admin/ops", label: "Dashboard" },
    { href: "/admin/ops/agents", label: "Agents" },
    { href: "/admin/ops/keys", label: "API Keys" },
    { href: "/admin/ops/queries", label: "Query Sets" },
    { href: "/admin/ops/runs", label: "Runs" },
    { href: "/admin/ops/schedule", label: "Schedule" },
    { href: "/admin/ops/openclaw", label: "OpenClaw" },
    { href: "/admin/ops/growth", label: "Growth" },
  ];

  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-full border px-4 py-2 text-sm transition hover:-translate-y-px"
          style={{ borderColor: OPS_COLOR_TOKENS.line, backgroundColor: OPS_COLOR_TOKENS.surface, color: OPS_COLOR_TOKENS.text }}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function OpsCard(props: { title: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-[28px] border p-5 shadow-sm" style={{ borderColor: OPS_COLOR_TOKENS.line, backgroundColor: OPS_COLOR_TOKENS.surface }}>
      <p className="text-xs uppercase tracking-[0.24em]" style={{ color: OPS_COLOR_TOKENS.muted }}>
        {props.title}
      </p>
      <p className="mt-3 text-3xl font-semibold" style={{ color: OPS_COLOR_TOKENS.text }}>
        {props.value}
      </p>
      {props.hint ? (
        <p className="mt-2 text-sm" style={{ color: OPS_COLOR_TOKENS.muted }}>
          {props.hint}
        </p>
      ) : null}
    </div>
  );
}

export function Panel(props: { title: string; children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <section
      className={cn("rounded-[30px] border p-6 shadow-sm", props.className)}
      style={{ borderColor: OPS_COLOR_TOKENS.line, backgroundColor: OPS_COLOR_TOKENS.surface }}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold" style={{ color: OPS_COLOR_TOKENS.text }}>
          {props.title}
        </h2>
        {props.action}
      </div>
      {props.children}
    </section>
  );
}

export function StatusDot(props: { active: boolean; running?: boolean }) {
  const color = props.running ? "#0ea5e9" : props.active ? OPS_COLOR_TOKENS.accent : OPS_COLOR_TOKENS.warn;
  return <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />;
}

export function StatusBadge(props: { label: string; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const toneMap = {
    neutral: { bg: "#f3f0e6", text: OPS_COLOR_TOKENS.text },
    success: { bg: "#daf2e6", text: OPS_COLOR_TOKENS.accent },
    warning: { bg: "#f8ead4", text: OPS_COLOR_TOKENS.warn },
    danger: { bg: "#fbe6e2", text: OPS_COLOR_TOKENS.danger },
  } as const;
  const tone = toneMap[props.tone ?? "neutral"];

  return (
    <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: tone.bg, color: tone.text }}>
      {props.label}
    </span>
  );
}

export function Meter(props: { value: number | null; numerator?: number; denominator?: number | null }) {
  const pct = props.value === null ? 0 : Math.max(0, Math.min(100, props.value));
  return (
    <div className="space-y-2">
      <div className="h-2 rounded-full" style={{ backgroundColor: "#ece6d6" }}>
        <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: pct > 85 ? OPS_COLOR_TOKENS.warn : OPS_COLOR_TOKENS.accent }} />
      </div>
      <p className="text-xs" style={{ color: OPS_COLOR_TOKENS.muted }}>
        {props.numerator ?? "—"}
        {props.denominator ? `/${props.denominator}` : ""} {props.value !== null ? `· ${pct}%` : ""}
      </p>
    </div>
  );
}

export function Table(props: { columns: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[24px] border" style={{ borderColor: OPS_COLOR_TOKENS.line }}>
      <table className="min-w-full divide-y" style={{ borderColor: OPS_COLOR_TOKENS.line }}>
        <thead style={{ backgroundColor: "#f4efe1" }}>
          <tr>
            {props.columns.map((column) => (
              <th
                key={column}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em]"
                style={{ color: OPS_COLOR_TOKENS.muted }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: OPS_COLOR_TOKENS.line }}>
          {props.children}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyState(props: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-dashed p-8 text-center" style={{ borderColor: OPS_COLOR_TOKENS.line }}>
      <h3 className="text-lg font-semibold" style={{ color: OPS_COLOR_TOKENS.text }}>
        {props.title}
      </h3>
      <p className="mt-2 text-sm" style={{ color: OPS_COLOR_TOKENS.muted }}>
        {props.body}
      </p>
      {props.action ? <div className="mt-4">{props.action}</div> : null}
    </div>
  );
}

export function QuickAction(props: { href: string; label: string }) {
  return (
    <Link
      href={props.href}
      className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition hover:-translate-y-px"
      style={{ borderColor: OPS_COLOR_TOKENS.line, backgroundColor: OPS_COLOR_TOKENS.surface, color: OPS_COLOR_TOKENS.text }}
    >
      {props.label}
    </Link>
  );
}

export function MetaLine(props: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0" style={{ borderColor: "#eee5d3" }}>
      <span className="text-sm" style={{ color: OPS_COLOR_TOKENS.muted }}>
        {props.label}
      </span>
      <span className="text-sm font-medium" style={{ color: OPS_COLOR_TOKENS.text }}>
        {props.value ?? "—"}
      </span>
    </div>
  );
}

export function RunStatusLabel(props: { status: string }) {
  if (props.status === "completed") return <StatusBadge label="Done" tone="success" />;
  if (props.status === "running") return <StatusBadge label="Running" tone="neutral" />;
  if (props.status === "timeout") return <StatusBadge label="Timeout" tone="warning" />;
  return <StatusBadge label={toTitleCase(props.status)} tone="danger" />;
}

export function RunSummary(props: { run: { startedAt: string; configDisplayName: string; queriesRun: number; toolsTested: number; status: string; error: string | null } }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0" style={{ borderColor: "#eee5d3" }}>
      <div>
        <p className="text-sm font-medium" style={{ color: OPS_COLOR_TOKENS.text }}>
          {props.run.configDisplayName}
        </p>
        <p className="text-xs" style={{ color: OPS_COLOR_TOKENS.muted }}>
          {formatRelativeTime(props.run.startedAt)} · {props.run.queriesRun} queries · {props.run.toolsTested} tools
          {props.run.error ? ` · ${props.run.error}` : ""}
        </p>
      </div>
      <RunStatusLabel status={props.run.status} />
    </div>
  );
}

export function CoverageRow(props: { domain: string; agents: number; tests: number; avgSuccessRate: number | null }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0" style={{ borderColor: "#eee5d3" }}>
      <div>
        <p className="text-sm font-medium" style={{ color: OPS_COLOR_TOKENS.text }}>
          {props.domain}
        </p>
        <p className="text-xs" style={{ color: OPS_COLOR_TOKENS.muted }}>
          {props.agents} agents · {props.tests.toLocaleString()} tests
        </p>
      </div>
      <p className="text-sm font-medium" style={{ color: OPS_COLOR_TOKENS.text }}>
        {formatPercent(props.avgSuccessRate)}
      </p>
    </div>
  );
}
