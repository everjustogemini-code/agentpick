import { DEFAULT_EVALUATOR_MODEL, DOMAIN_DEFINITIONS, FREQUENCY_OPTIONS, MODEL_DEFINITIONS, TOOL_DEFINITIONS } from "./constants";
import type { Frequency } from "./types";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function findDomain(slug: string) {
  return DOMAIN_DEFINITIONS.find((domain) => domain.slug === slug) ?? DOMAIN_DEFINITIONS[0];
}

export function findModel(slugOrProvider: string) {
  return (
    MODEL_DEFINITIONS.find((model) => model.slug === slugOrProvider) ??
    MODEL_DEFINITIONS.find((model) => model.provider === slugOrProvider) ??
    MODEL_DEFINITIONS[0]
  );
}

export function findTool(slug: string) {
  return TOOL_DEFINITIONS.find((tool) => tool.slug === slug);
}

export function toTitleCase(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function maskSecret(secret: string) {
  if (!secret) return "";
  if (secret.length <= 8) return `${secret.slice(0, 2)}••••`;
  return `${secret.slice(0, 4)}••••${secret.slice(-4)}`;
}

export function getFrequencyMs(value: Frequency) {
  return FREQUENCY_OPTIONS.find((option) => option.value === value)?.milliseconds ?? FREQUENCY_OPTIONS[2].milliseconds;
}

export function getFrequencyLabel(value: Frequency) {
  return FREQUENCY_OPTIONS.find((option) => option.value === value)?.label ?? "Every 2 hours";
}

export function getHeartbeatLabel(value: string) {
  return value.replace("every_", "Every ").replace("m", " minutes").replace("h", " hour");
}

export function formatPercent(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatRelativeTime(value: string | Date | null | undefined) {
  if (!value) return "Never";
  const date = value instanceof Date ? value : new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function buildBenchmarkDisplayName(domain: string, modelProvider: string, sequence: number) {
  const domainMeta = findDomain(domain);
  const modelMeta = findModel(modelProvider);
  return `benchmark-${domainMeta.code}-${modelMeta.slug}-${String(sequence).padStart(2, "0")}`;
}

export function normalizeDisplayName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
}

export function pickDefaultSubdomain(domain: string) {
  return findDomain(domain).subdomains[0] ?? "general";
}

export function buildDefaultDescription(domain: string, subdomain: string, tools: string[]) {
  const toolNames = tools
    .map((tool) => findTool(tool)?.label ?? toTitleCase(tool))
    .slice(0, 3)
    .join(", ");
  return `Tests ${toolNames} for ${toTitleCase(domain)} ${toTitleCase(subdomain)} workflows.`;
}

export function getDefaultEvaluatorModel(value?: string | null) {
  return value?.trim() || DEFAULT_EVALUATOR_MODEL;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
