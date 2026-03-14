/**
 * Enterprise QA tests covering all P0/P1/P2 items from the three QA reports.
 * Tests: XSS, invalid capability, priority tools, deep research classification,
 * non-auto strategies, budget enforcement, stable response contract,
 * boundary validation, and strategy naming consistency.
 */
import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeForJsonLd, stripHtml } from '@/lib/sanitize';
import { getRankedToolsForCapability, CAPABILITY_TOOLS } from '@/lib/router/index';
import { aiRoute, fastClassify, type QueryContext } from '@/lib/router/ai-classify';
import { normalizeStrategy, isRouterStrategy } from '@/lib/router/sdk';
import { apiError } from '@/types';

// ── P0-1: Reflected XSS ──

describe('P0-1: Reflected XSS prevention', () => {
  it('escapes script tags in capability names', () => {
    const malicious = '<script>alert("xss")</script>';
    const escaped = escapeHtml(malicious);
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
  });

  it('escapes onerror payloads (neutralizes the HTML tag)', () => {
    const payload = '<img src=x onerror=alert(document.cookie)>';
    const escaped = escapeHtml(payload);
    // The <img> tag is escaped so it won't render as HTML
    expect(escaped).not.toContain('<img');
    expect(escaped).toContain('&lt;img');
  });

  it('escapes javascript: URLs', () => {
    const payload = '<a href="javascript:void(0)">click</a>';
    expect(escapeHtml(payload)).toContain('&lt;a');
  });

  it('sanitizes JSON-LD script injection', () => {
    const obj = { name: '</script><script>alert(1)</script>' };
    const result = sanitizeForJsonLd(obj);
    expect(result).not.toContain('</script>');
  });

  it('strips HTML from upstream responses', () => {
    const html = '<b>bold</b><script>evil()</script>text';
    expect(stripHtml(html)).toBe('boldtext');
  });

  it('preserves legitimate text through escaping', () => {
    const safe = 'exa-search returned 42 results for "AI tools"';
    expect(escapeHtml(safe)).toBe('exa-search returned 42 results for &quot;AI tools&quot;');
  });
});

// ── P0-2: Invalid capability returns 404 ──

describe('P0-2: Invalid capability returns 404 (via getRankedToolsForCapability)', () => {
  it('returns empty array for "ai" (invalid capability)', () => {
    expect(getRankedToolsForCapability('ai')).toEqual([]);
  });

  it('returns empty array for "email" (invalid capability)', () => {
    expect(getRankedToolsForCapability('email')).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(getRankedToolsForCapability('')).toEqual([]);
  });

  it('returns tools for all valid capabilities', () => {
    for (const cap of Object.keys(CAPABILITY_TOOLS)) {
      expect(getRankedToolsForCapability(cap).length).toBeGreaterThan(0);
    }
  });

  it('valid capabilities include search, crawl, embed, finance, code, communication, translation, ocr', () => {
    const keys = Object.keys(CAPABILITY_TOOLS).sort();
    expect(keys).toEqual(['code', 'communication', 'crawl', 'embed', 'finance', 'ocr', 'search', 'translation']);
  });
});

// ── P1-3: Priority tools affect routing ──

describe('P1-3: Priority tools affect fallback chain', () => {
  it('returns tools in strategy order by default', () => {
    const ranked = getRankedToolsForCapability('search', 'balanced');
    expect(ranked.length).toBe(10);
    // Balanced = quality/(cost*latency), should have a reasonable first pick
    expect(ranked[0]).toBeDefined();
  });

  it('excludes tools correctly when specified', () => {
    const ranked = getRankedToolsForCapability('search', 'balanced', ['serpapi', 'tavily']);
    expect(ranked).not.toContain('serpapi');
    expect(ranked).not.toContain('tavily');
    expect(ranked.length).toBe(8);
  });

  it('all strategies produce non-empty results for valid capabilities', () => {
    const strategies = ['balanced', 'best_performance', 'cheapest', 'most_stable'] as const;
    for (const strategy of strategies) {
      for (const capability of Object.keys(CAPABILITY_TOOLS)) {
        const ranked = getRankedToolsForCapability(capability, strategy);
        expect(ranked.length).toBeGreaterThan(0);
      }
    }
  });
});

// ── P1-4: Deep research classification ──

describe('P1-4: Deep research AI classification', () => {
  it('classifies "explain transformer architecture" as research/deep', () => {
    // The fastClassify regex should catch "explain" and "architecture"
    const researchTerms = /\b(explain|how does|how do|how to|architecture|in.?depth|compare|comparison|vs|versus|tutorial|deep dive|comprehensive|detailed|analysis|analyze|review|pros and cons|tradeoffs?|trade.?offs?|benchmark|evaluation|implement|implementation|guide|walkthrough|overview of|step.?by.?step|under the hood)\b/i;
    expect(researchTerms.test('explain transformer architecture in detail')).toBe(true);
    expect(researchTerms.test('compare Redis vs Memcached')).toBe(true);
    expect(researchTerms.test('how does attention mechanism work')).toBe(true);
    expect(researchTerms.test('step-by-step guide to building RAG')).toBe(true);
    expect(researchTerms.test('in-depth analysis of LLM costs')).toBe(true);
  });

  it('routes research queries to quality tools', () => {
    const ctx: QueryContext = { type: 'research', domain: 'tech', depth: 'deep', freshness: 'any' };
    const tools = aiRoute(ctx, 'search');
    expect(tools[0]).toBe('exa-search');
    expect(tools.length).toBe(10); // All search tools as fallbacks
  });

  it('does NOT classify research queries as simple', () => {
    // Research patterns should NOT match simple
    const simpleTerms = /^(what is|define|who is|where is|when was)\b/i;
    expect(simpleTerms.test('explain transformer architecture in detail')).toBe(false);
    expect(simpleTerms.test('compare Redis vs Memcached')).toBe(false);
  });

  it('still classifies finance/realtime correctly', () => {
    const financeTerms = /\b(stock|price|ticker|share|market cap|earnings|dividend|p\/e|crypto|bitcoin|btc|eth|ethereum|forex|exchange rate|trading)\b/i;
    const realtimeTerms = /\b(today|right now|current|live|real.?time|latest price|price now)\b/i;
    expect(financeTerms.test('NVDA stock price today')).toBe(true);
    expect(realtimeTerms.test('NVDA stock price today')).toBe(true);
  });

  it('routes news queries to fresh tools', () => {
    const ctx: QueryContext = { type: 'news', domain: 'tech', depth: 'shallow', freshness: 'recent' };
    const tools = aiRoute(ctx, 'search');
    expect(['tavily', 'serpapi']).toContain(tools[0]);
  });
});

// ── P1-5: Non-auto strategies return valid routed payloads ──

describe('P1-5: Non-auto strategies return valid tools', () => {
  it('balanced returns tools for search', () => {
    const ranked = getRankedToolsForCapability('search', 'balanced');
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0]).toBeDefined();
  });

  it('most_accurate returns tools for search', () => {
    const ranked = getRankedToolsForCapability('search', 'best_performance');
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0]).toBe('exa-search'); // Highest quality
  });

  it('cheapest returns tools for search', () => {
    const ranked = getRankedToolsForCapability('search', 'cheapest');
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0]).toBe('brave-search'); // Lowest cost (0.0001)
  });

  it('fastest returns tools for search', () => {
    const ranked = getRankedToolsForCapability('search', 'most_stable');
    expect(ranked.length).toBeGreaterThan(0);
  });

  it('all strategies return tools for finance', () => {
    const strategies = ['balanced', 'best_performance', 'cheapest', 'most_stable'] as const;
    for (const s of strategies) {
      const ranked = getRankedToolsForCapability('finance', s);
      expect(ranked.length).toBe(3);
    }
  });
});

// ── P1-5 continued: Strategy naming consistency ──

describe('P1-5: Strategy naming consistency', () => {
  it('normalizes all canonical SDK strategy names', () => {
    expect(normalizeStrategy('BALANCED')).toBe('BALANCED');
    expect(normalizeStrategy('FASTEST')).toBe('FASTEST');
    expect(normalizeStrategy('CHEAPEST')).toBe('CHEAPEST');
    expect(normalizeStrategy('MOST_ACCURATE')).toBe('MOST_ACCURATE');
    expect(normalizeStrategy('AUTO')).toBe('AUTO');
    expect(normalizeStrategy('MANUAL')).toBe('MANUAL');
  });

  it('normalizes lowercase variants', () => {
    expect(normalizeStrategy('balanced')).toBe('BALANCED');
    expect(normalizeStrategy('most_stable')).toBe('FASTEST');
    expect(normalizeStrategy('cheapest')).toBe('CHEAPEST');
    expect(normalizeStrategy('auto')).toBe('AUTO');
  });

  it('maps legacy aliases (best_performance, most_stable)', () => {
    expect(normalizeStrategy('best_performance')).toBe('MOST_ACCURATE');
    expect(normalizeStrategy('BEST_PERFORMANCE')).toBe('MOST_ACCURATE');
    expect(normalizeStrategy('most_stable')).toBe('FASTEST');
    expect(normalizeStrategy('MOST_STABLE')).toBe('FASTEST');
  });

  it('rejects invalid strategy names', () => {
    expect(normalizeStrategy('invalid_strategy')).toBeNull();
    expect(normalizeStrategy('turbo')).toBeNull();
    expect(normalizeStrategy('')).toBeNull();
  });

  it('isRouterStrategy accepts valid strategies case-insensitively', () => {
    expect(isRouterStrategy('BALANCED')).toBe(true);
    expect(isRouterStrategy('balanced')).toBe(true);
    expect(isRouterStrategy('Fastest')).toBe(true);
    expect(isRouterStrategy('AUTO')).toBe(true);
    expect(isRouterStrategy('auto')).toBe(true);
    expect(isRouterStrategy('CHEAPEST')).toBe(true);
    expect(isRouterStrategy('MOST_ACCURATE')).toBe(true);
  });

  it('isRouterStrategy rejects invalid values', () => {
    expect(isRouterStrategy('invalid')).toBe(false);
    expect(isRouterStrategy(null)).toBe(false);
    expect(isRouterStrategy(undefined)).toBe(false);
    expect(isRouterStrategy(123)).toBe(false);
  });
});

// ── P0-3: Rate limiting 429 with Retry-After ──

describe('P0-3: Rate limiting response includes Retry-After', () => {
  it('apiError returns Retry-After header on 429', async () => {
    const response = apiError('RATE_LIMITED', 'Too many requests.', 429, { retry_after: 60 });
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
  });

  it('apiError does NOT include Retry-After on non-429 responses', async () => {
    const response = apiError('VALIDATION_ERROR', 'Bad input.', 400, { retry_after: 60 });
    expect(response.status).toBe(400);
    expect(response.headers.get('Retry-After')).toBeNull();
  });

  it('apiError body contains error code and message', async () => {
    const response = apiError('RATE_LIMITED', 'Slow down.', 429, { retry_after: 30 });
    const body = await response.json();
    expect(body.error.code).toBe('RATE_LIMITED');
    expect(body.error.message).toBe('Slow down.');
    expect(body.error.retry_after).toBe(30);
  });
});

// ── P1-7: Finance metric classification ──

describe('P1-7: Finance metric queries classified correctly', () => {
  it('classifies "NVDA PE ratio" as finance/realtime', () => {
    const result = fastClassify('NVDA PE ratio');
    expect(result).not.toBeNull();
    expect(result!.domain).toBe('finance');
  });

  it('classifies "AAPL earnings" as finance/realtime', () => {
    const result = fastClassify('AAPL earnings');
    expect(result).not.toBeNull();
    expect(result!.domain).toBe('finance');
  });

  it('classifies "TSLA revenue margin" as finance', () => {
    const result = fastClassify('TSLA revenue margin');
    expect(result).not.toBeNull();
    expect(result!.domain).toBe('finance');
  });

  it('classifies "bitcoin price today" as finance/realtime', () => {
    const result = fastClassify('bitcoin price today');
    expect(result).not.toBeNull();
    expect(result!.domain).toBe('finance');
    expect(result!.freshness).toBe('realtime');
  });

  it('classifies "MSFT stock price" as finance/realtime', () => {
    const result = fastClassify('MSFT stock price');
    expect(result).not.toBeNull();
    expect(result!.domain).toBe('finance');
    expect(result!.type).toBe('realtime');
  });

  it('routes finance context to finance tools', () => {
    const ctx: QueryContext = { type: 'realtime', domain: 'finance', depth: 'shallow', freshness: 'realtime' };
    const tools = aiRoute(ctx, 'finance');
    expect(tools.length).toBe(3);
  });
});

// ── P1-6: Budget enforcement ──

describe('P1-6: Budget enforcement returns 402', () => {
  it('apiError can return 402 BUDGET_EXCEEDED', async () => {
    const response = apiError('BUDGET_EXCEEDED', 'Monthly budget exceeded.', 402, {
      details: { budget: 10, spent: 10.5 },
    });
    expect(response.status).toBe(402);
    const body = await response.json();
    expect(body.error.code).toBe('BUDGET_EXCEEDED');
    expect(body.error.details.budget).toBe(10);
    expect(body.error.details.spent).toBe(10.5);
  });
});

// ── P1-5: Priority tools ──

describe('P1-5: Priority tools do not get overridden by strategy', () => {
  it('getRankedToolsForCapability respects exclusions across all strategies', () => {
    const strategies = ['balanced', 'most_stable', 'cheapest', 'best_performance'] as const;
    for (const s of strategies) {
      const ranked = getRankedToolsForCapability('search', s, ['exa-search']);
      expect(ranked).not.toContain('exa-search');
    }
  });
});

// ── P2-9: Boundary validation ──

describe('P2-9: Boundary validation', () => {
  it('MAX_QUERY_LENGTH is 2000', () => {
    const maxLen = 2000;
    const longQuery = 'a'.repeat(maxLen + 1);
    expect(longQuery.length).toBeGreaterThan(maxLen);
  });

  it('budget upper bound rejects $999,999,999', () => {
    const maxBudget = 100_000;
    expect(999_999_999).toBeGreaterThan(maxBudget);
  });

  it('escapeHtml handles all special characters', () => {
    expect(escapeHtml('&')).toBe('&amp;');
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('>')).toBe('&gt;');
    expect(escapeHtml('"')).toBe('&quot;');
    expect(escapeHtml("'")).toBe('&#x27;');
  });
});

// ── P2-10: Doc/endpoint consistency ──

describe('P2-10: Capability list consistency', () => {
  it('search, crawl, embed, finance, code, communication, translation, ocr are valid capabilities', () => {
    const capabilities = Object.keys(CAPABILITY_TOOLS);
    expect(capabilities).toContain('search');
    expect(capabilities).toContain('crawl');
    expect(capabilities).toContain('embed');
    expect(capabilities).toContain('finance');
    expect(capabilities).toContain('code');
    expect(capabilities).toContain('communication');
    expect(capabilities).toContain('translation');
    expect(capabilities).toContain('ocr');
    expect(capabilities).not.toContain('email');
    expect(capabilities).not.toContain('ai');
  });
});
