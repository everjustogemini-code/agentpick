/**
 * AI-powered query classification for "auto" routing strategy.
 * Uses Claude Haiku to classify queries before tool selection.
 *
 * Also provides a fast regex-based pre-classifier for common patterns
 * to avoid LLM calls when the query type is obvious.
 */

import Anthropic from '@anthropic-ai/sdk';
import { CAPABILITY_TOOLS } from './index';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export interface QueryContext {
  type: 'news' | 'research' | 'realtime' | 'simple';
  domain: 'finance' | 'legal' | 'tech' | 'general';
  depth: 'shallow' | 'deep';
  freshness: 'realtime' | 'recent' | 'any';
}

const DEFAULT_CONTEXT: QueryContext = {
  type: 'simple',
  domain: 'general',
  depth: 'shallow',
  freshness: 'any',
};

// In-memory cache: key → { result, timestamp }
const classificationCache = new Map<string, { result: QueryContext; timestamp: number }>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Fast regex-based pre-classifier.
 * Catches obvious patterns without needing an LLM call.
 * Returns null if uncertain — falls through to Haiku.
 */
export function fastClassify(query: string): QueryContext | null {
  const lower = query.toLowerCase();

  // Realtime / finance signals
  const financeTerms = /\b(stock|price|ticker|share|market cap|earnings|dividend|p\/e|pe ratio|pe\b|eps|revenue|margin|valuation|ratio|roi|ebitda|cash flow|balance sheet|income statement|quarterly|annual report|sec filing|crypto|bitcoin|btc|eth|ethereum|forex|exchange rate|trading)\b/i;
  const realtimeTerms = /\b(today|right now|current|live|real.?time|latest price|price now)\b/i;

  // Ticker-like patterns: 1-5 uppercase letters followed by finance terms
  const tickerPattern = /\b[A-Z]{1,5}\b/;
  const hasTickerWithFinance = tickerPattern.test(query) && financeTerms.test(lower);

  if (financeTerms.test(lower) && realtimeTerms.test(lower)) {
    return { type: 'realtime', domain: 'finance', depth: 'shallow', freshness: 'realtime' };
  }
  if (financeTerms.test(lower) && /\b(price|stock|ticker|market cap|crypto)\b/i.test(lower)) {
    return { type: 'realtime', domain: 'finance', depth: 'shallow', freshness: 'realtime' };
  }
  // Finance metric queries like "NVDA PE ratio", "AAPL earnings"
  if (hasTickerWithFinance) {
    return { type: 'realtime', domain: 'finance', depth: 'shallow', freshness: 'recent' };
  }

  // News signals — strong news indicators OR news + time/domain reference
  const newsTerms = /\b(latest|breaking|recent|new|announced|launched|funding|raised|acquired|ipo|merger|regulation|ruling)\b/i;
  const strongNewsTerms = /\b(news|breaking|announced|launched|funding|raised|acquired|ipo|merger|released|release|update|patch|vulnerability|incident|outage|breach|hacked|exploit|layoffs?|bankrupt)\b/i;
  const yearPattern = /\b20(2[4-9]|3[0-9])\b/;
  // Tech/AI company or product signal — combined with any newsTerms triggers a news classification
  // without requiring an explicit year, since product launches are clearly time-sensitive.
  const techCompanySignal = /\b(openai|anthropic|google|microsoft|apple|meta|nvidia|amazon|tesla|spacex|stripe|figma|vercel|mistral|gemini|claude|gpt|llama|sora|dall-e|chatgpt|copilot)\b/i;
  const hasNewsWithDomain = newsTerms.test(lower) && (
    yearPattern.test(lower) ||
    /\b(today|this week|this month|yesterday|recently|right now|just now|latest version|what happened|what's happening|update on|status of)\b/i.test(lower) ||
    (techCompanySignal.test(lower) && /\b(ai|tech|software|startup|developer|api|framework|model|product)\b/i.test(lower))
  );
  if (strongNewsTerms.test(lower) || hasNewsWithDomain) {
    const domain = financeTerms.test(lower) ? 'finance' : /\b(legal|law|court|sec|regulation|ruling|compliance)\b/i.test(lower) ? 'legal' : /\b(ai|tech|software|startup|developer|api|framework|model)\b/i.test(lower) ? 'tech' : 'general';
    return { type: 'news', domain: domain as QueryContext['domain'], depth: 'shallow', freshness: 'recent' };
  }

  // Research signals — catches detailed/technical explanation requests (P1-4)
  const researchTerms = /\b(explain|how does|how do|how to|architecture|in.?depth|compare|comparison|vs|versus|tutorial|deep dive|comprehensive|detailed|analysis|analyze|review|pros and cons|tradeoffs?|trade.?offs?|benchmark|evaluation|implement|implementation|guide|walkthrough|overview of|step.?by.?step|under the hood)\b/i;
  if (researchTerms.test(lower)) {
    const domain = /\b(ai|ml|machine learning|neural|transformer|llm|gpt|bert|model|algorithm|framework|api|sdk|library|database|kubernetes|docker|cloud|aws|azure|gcp|react|python|rust|golang)\b/i.test(lower) ? 'tech' : financeTerms.test(lower) ? 'finance' : /\b(legal|law|court|regulation|compliance)\b/i.test(lower) ? 'legal' : 'general';
    return { type: 'research', domain: domain as QueryContext['domain'], depth: 'deep', freshness: 'any' };
  }

  // Simple signals
  const simpleTerms = /^(what is|define|who is|where is|when was)\b/i;
  if (simpleTerms.test(lower) && lower.length < 60) {
    return { type: 'simple', domain: 'general', depth: 'shallow', freshness: 'any' };
  }

  return null; // Uncertain — use LLM
}

/**
 * Classify a query. Uses fast regex first, falls back to Haiku.
 * Cached for 2 minutes. Fails safe with default context.
 */
export async function getClassification(query: string, capability: string): Promise<{ context: QueryContext; cached: boolean; classificationMs: number }> {
  const key = `${capability}:${query}`;
  const cached = classificationCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { context: cached.result, cached: true, classificationMs: 0 };
  }

  // Try fast regex classification first (0ms)
  const fastResult = fastClassify(query);
  if (fastResult) {
    classificationCache.set(key, { result: fastResult, timestamp: Date.now() });
    return { context: fastResult, cached: false, classificationMs: 0 };
  }

  // Fall back to Haiku
  const start = Date.now();
  try {
    const result = await Promise.race([
      classifyQuery(query, capability),
      new Promise<QueryContext>((_, reject) => setTimeout(() => reject(new Error('timeout')), 500)),
    ]);
    const ms = Date.now() - start;
    classificationCache.set(key, { result, timestamp: Date.now() });
    return { context: result, cached: false, classificationMs: ms };
  } catch {
    return { context: DEFAULT_CONTEXT, cached: false, classificationMs: Date.now() - start };
  }
}

const CLASSIFY_SYSTEM = `Classify this query. Return ONLY a JSON object:
{"type":"...","domain":"...","depth":"...","freshness":"..."}

type: news | research | realtime | simple
domain: finance | legal | tech | general
depth: shallow | deep
freshness: realtime | recent | any

Rules:
- "price/stock/crypto/exchange rate/market" → realtime + finance + realtime freshness
- "latest/breaking/funding/launched/announced" + year → news + recent freshness
- "explain/how/architecture/compare/vs/tutorial" → research + deep
- "what is/define" → simple
- stocks/crypto/forex/earnings → finance domain
- AI/ML/framework/API/code → tech domain
- court/SEC/regulation/law → legal domain

Examples:
"NVDA stock price" → {"type":"realtime","domain":"finance","depth":"shallow","freshness":"realtime"}
"bitcoin price today" → {"type":"realtime","domain":"finance","depth":"shallow","freshness":"realtime"}
"TSLA insider trading SEC filing" → {"type":"research","domain":"finance","depth":"deep","freshness":"any"}
"latest AI funding rounds 2026" → {"type":"news","domain":"tech","depth":"shallow","freshness":"recent"}
"OpenAI announced new model" → {"type":"news","domain":"tech","depth":"shallow","freshness":"recent"}
"explain transformer architecture in detail" → {"type":"research","domain":"tech","depth":"deep","freshness":"any"}
"compare Redis vs Memcached" → {"type":"research","domain":"tech","depth":"deep","freshness":"any"}
"how does attention mechanism work" → {"type":"research","domain":"tech","depth":"deep","freshness":"any"}
"SEC ruling on crypto regulation 2025" → {"type":"news","domain":"legal","depth":"shallow","freshness":"recent"}
"GDPR compliance requirements for SaaS" → {"type":"research","domain":"legal","depth":"deep","freshness":"any"}
"what is kubernetes" → {"type":"simple","domain":"tech","depth":"shallow","freshness":"any"}
"who is Sam Altman" → {"type":"simple","domain":"general","depth":"shallow","freshness":"any"}
"best react state management library" → {"type":"research","domain":"tech","depth":"deep","freshness":"any"}
"EUR USD exchange rate" → {"type":"realtime","domain":"finance","depth":"shallow","freshness":"realtime"}
"Y Combinator W26 batch companies" → {"type":"news","domain":"tech","depth":"shallow","freshness":"recent"}

No explanation. JSON only.`;

async function classifyQuery(query: string, _capability: string): Promise<QueryContext> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 60,
    temperature: 0,
    system: CLASSIFY_SYSTEM,
    messages: [{ role: 'user', content: query }],
  });

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    // Extract JSON from response (handle possible markdown code blocks)
    const jsonMatch = text.match(/\{[^}]+\}/);
    if (!jsonMatch) return DEFAULT_CONTEXT;
    const parsed = JSON.parse(jsonMatch[0]);
    // Validate fields
    const validTypes = ['news', 'research', 'realtime', 'simple'];
    const validDomains = ['finance', 'legal', 'tech', 'general'];
    const validDepths = ['shallow', 'deep'];
    const validFreshness = ['realtime', 'recent', 'any'];
    return {
      type: validTypes.includes(parsed.type) ? parsed.type : 'simple',
      domain: validDomains.includes(parsed.domain) ? parsed.domain : 'general',
      depth: validDepths.includes(parsed.depth) ? parsed.depth : 'shallow',
      freshness: validFreshness.includes(parsed.freshness) ? parsed.freshness : 'any',
    };
  } catch {
    return DEFAULT_CONTEXT;
  }
}

/**
 * Given a query context, return ordered tool list for the capability.
 * AI routing applies to search and finance in v1. Others return default order.
 */
export function aiRoute(context: QueryContext, capability: string): string[] {
  if (capability === 'finance') {
    // Finance capability always uses finance tools — order by reliability
    return CAPABILITY_TOOLS[capability] ?? [];
  }

  if (capability !== 'search') {
    return CAPABILITY_TOOLS[capability] ?? [];
  }

  // Realtime data, news, and research-with-recent-freshness → consistent tool order.
  // Grouping research+recent with news/realtime prevents non-determinism when Haiku
  // oscillates between classifying a query as type='news' vs type='research' across
  // different runs — both should prefer fresh-data tools (tavily, exa-search).
  // tavily is primary; exa-search is secondary (high-quality, reliably configured).
  // serpapi-google is last: it was causing non-determinism when primary tools were unconfigured.
  if (
    context.type === 'realtime' ||
    context.freshness === 'realtime' ||
    context.type === 'news' ||
    context.freshness === 'recent' ||
    (context.type === 'research' && context.freshness === 'recent')
  ) {
    return filterAvailable(['tavily', 'exa-search', 'brave-search', 'serper', 'serpapi', 'serpapi-google'], capability);
  }

  // Deep research → quality tools first
  if (context.depth === 'deep' || context.type === 'research') {
    return filterAvailable(['exa-search', 'perplexity-search', 'tavily', 'serpapi-google', 'serpapi'], capability);
  }

  // Finance domain search → domain-aware tools
  if (context.domain === 'finance') {
    return filterAvailable(['exa-search', 'tavily', 'serpapi-google', 'serpapi'], capability);
  }

  // Default: for simple queries, prefer cheap/fast tools first; tavily before serpapi-google
  // since tavily has higher quality (4.0 vs 3.2) and serpapi-google is not meaningfully cheaper.
  return filterAvailable(['brave-search', 'serper', 'serpapi', 'tavily', 'exa-search', 'serpapi-google'], capability);
}

/**
 * Filter tool list to only include tools available for the capability.
 * Also appends any remaining capability tools not in the list as fallbacks.
 */
function filterAvailable(preferred: string[], capability: string): string[] {
  const available = new Set(CAPABILITY_TOOLS[capability] ?? []);
  const result = preferred.filter((t) => available.has(t));
  // Append remaining tools as fallbacks
  for (const tool of available) {
    if (!result.includes(tool)) {
      result.push(tool);
    }
  }
  return result;
}
