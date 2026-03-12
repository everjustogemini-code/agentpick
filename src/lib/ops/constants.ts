import type { DomainDefinition, Frequency, HeartbeatFrequency, ModelDefinition, ToolDefinition } from "./types";

export const ADMIN_COOKIE_NAME = "agentpick-ops-session";

export const DEFAULT_EVALUATOR_MODEL = "claude-sonnet-4";

export const FREQUENCY_OPTIONS: Array<{ value: Frequency; label: string; milliseconds: number }> = [
  { value: "every_30m", label: "Every 30 minutes", milliseconds: 30 * 60 * 1000 },
  { value: "every_1h", label: "Every hour", milliseconds: 60 * 60 * 1000 },
  { value: "every_2h", label: "Every 2 hours", milliseconds: 2 * 60 * 60 * 1000 },
  { value: "every_6h", label: "Every 6 hours", milliseconds: 6 * 60 * 60 * 1000 },
  { value: "daily", label: "Daily", milliseconds: 24 * 60 * 60 * 1000 },
];

export const HEARTBEAT_OPTIONS: Array<{ value: HeartbeatFrequency; label: string }> = [
  { value: "every_5m", label: "Every 5 minutes" },
  { value: "every_15m", label: "Every 15 minutes" },
  { value: "every_30m", label: "Every 30 minutes" },
  { value: "every_1h", label: "Every hour" },
];

export const COMPLEXITY_OPTIONS = [
  { value: "simple", label: "Simple" },
  { value: "medium", label: "Medium" },
  { value: "complex", label: "Complex" },
] as const;

export const DOMAIN_DEFINITIONS: DomainDefinition[] = [
  { slug: "finance", code: "fin", label: "Finance", subdomains: ["stocks", "macro", "earnings", "regulatory"], suggestedTools: ["tavily", "exa", "serper", "brave"] },
  { slug: "legal", code: "legal", label: "Legal", subdomains: ["compliance", "case-law", "contracts", "regulatory"], suggestedTools: ["tavily", "exa", "serper", "brave"] },
  { slug: "healthcare", code: "health", label: "Healthcare", subdomains: ["clinical", "insurance", "provider", "research"], suggestedTools: ["tavily", "exa", "brave", "firecrawl"] },
  { slug: "e-commerce", code: "commerce", label: "E-commerce", subdomains: ["pricing", "catalog", "seo", "conversion"], suggestedTools: ["tavily", "serper", "brave", "firecrawl"] },
  { slug: "devtools", code: "dev", label: "DevTools", subdomains: ["docs", "release-notes", "pricing", "ecosystem"], suggestedTools: ["exa", "tavily", "jina", "firecrawl"] },
  { slug: "education", code: "edu", label: "Education", subdomains: ["curriculum", "policy", "research", "admissions"], suggestedTools: ["tavily", "exa", "serper", "brave"] },
  { slug: "news", code: "news", label: "News", subdomains: ["breaking", "analysis", "politics", "markets"], suggestedTools: ["brave", "serper", "tavily", "exa"] },
  { slug: "science", code: "science", label: "Science", subdomains: ["papers", "journals", "grants", "breakthroughs"], suggestedTools: ["exa", "tavily", "jina", "brave"] },
  { slug: "general", code: "gen", label: "General", subdomains: ["research", "comparison", "explainers", "shopping"], suggestedTools: ["tavily", "exa", "serper", "brave"] },
  { slug: "multilingual", code: "multi", label: "Multilingual", subdomains: ["local-search", "translation", "regional-news", "international"], suggestedTools: ["brave", "serper", "exa", "tavily"] },
];

export const MODEL_DEFINITIONS: ModelDefinition[] = [
  { slug: "claude", provider: "anthropic", label: "Claude Sonnet", modelName: "claude-sonnet-4", evaluatorCompatible: true },
  { slug: "gpt", provider: "openai", label: "GPT-4o", modelName: "gpt-4o", evaluatorCompatible: true },
  { slug: "gemini", provider: "google", label: "Gemini 2.0", modelName: "gemini-2.0-flash", evaluatorCompatible: true },
  { slug: "deepseek", provider: "deepseek", label: "DeepSeek V3", modelName: "deepseek-chat", evaluatorCompatible: false },
  { slug: "llama", provider: "meta", label: "Llama 3.1", modelName: "llama-3.1-70b-instruct", evaluatorCompatible: false },
];

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  { slug: "tavily", label: "Tavily", description: "Search API for fast research retrieval" },
  { slug: "exa", label: "Exa", description: "Semantic web search and company intelligence" },
  { slug: "serper", label: "Serper", description: "Google SERP API for general web results" },
  { slug: "brave", label: "Brave", description: "Brave Search API for live web coverage" },
  { slug: "firecrawl", label: "Firecrawl", description: "Web extraction and crawl workflows" },
  { slug: "jina", label: "Jina", description: "Reader-style content extraction" },
  { slug: "perplexity", label: "Perplexity", description: "Answer-style retrieval and citations" },
  { slug: "anthropic", label: "Anthropic", description: "Anthropic model API key" },
  { slug: "openai", label: "OpenAI", description: "OpenAI model API key" },
  { slug: "google", label: "Google", description: "Google Gemini API key" },
  { slug: "deepseek", label: "DeepSeek", description: "DeepSeek model API key" },
  { slug: "meta", label: "Meta", description: "Meta-hosted model API key" },
];

export const DEFAULT_DISTRIBUTION: Array<{ domain: string; models: Array<{ slug: string; count: number }> }> = [
  { domain: "finance", models: [{ slug: "claude", count: 3 }, { slug: "gpt", count: 3 }, { slug: "gemini", count: 2 }, { slug: "deepseek", count: 1 }, { slug: "llama", count: 1 }] },
  { domain: "legal", models: [{ slug: "claude", count: 2 }, { slug: "gpt", count: 1 }, { slug: "gemini", count: 1 }, { slug: "deepseek", count: 1 }] },
  { domain: "healthcare", models: [{ slug: "claude", count: 1 }, { slug: "gpt", count: 1 }, { slug: "gemini", count: 1 }] },
  { domain: "e-commerce", models: [{ slug: "claude", count: 2 }, { slug: "gpt", count: 1 }, { slug: "gemini", count: 1 }, { slug: "deepseek", count: 1 }] },
  { domain: "devtools", models: [{ slug: "claude", count: 1 }, { slug: "gpt", count: 2 }, { slug: "gemini", count: 1 }, { slug: "llama", count: 1 }] },
  { domain: "education", models: [{ slug: "claude", count: 1 }, { slug: "gpt", count: 1 }, { slug: "gemini", count: 1 }] },
  { domain: "news", models: [{ slug: "claude", count: 2 }, { slug: "gpt", count: 1 }, { slug: "gemini", count: 1 }, { slug: "deepseek", count: 1 }] },
  { domain: "science", models: [{ slug: "claude", count: 1 }, { slug: "gpt", count: 1 }, { slug: "llama", count: 1 }] },
  { domain: "general", models: [{ slug: "claude", count: 2 }, { slug: "gpt", count: 2 }, { slug: "gemini", count: 2 }, { slug: "deepseek", count: 1 }, { slug: "llama", count: 1 }] },
  { domain: "multilingual", models: [{ slug: "claude", count: 1 }, { slug: "gpt", count: 1 }, { slug: "deepseek", count: 1 }] },
];

export const DEFAULT_QUERYSET_SIZE = 50;

export const OPS_COLOR_TOKENS = {
  background: "#f7f4ec",
  surface: "#fffdf7",
  line: "#d8d0bc",
  text: "#1d1a12",
  muted: "#6f6651",
  accent: "#0c7c59",
  accentSoft: "#daf2e6",
  warn: "#c67b18",
  danger: "#b42318",
};
