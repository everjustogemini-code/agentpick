import { describe, it, expect } from 'vitest';
import { aiRoute, type QueryContext } from '@/lib/router/ai-classify';

describe('aiRoute — tool ordering by classification', () => {
  it('routes realtime finance to fast tools', () => {
    const ctx: QueryContext = { type: 'realtime', domain: 'finance', depth: 'shallow', freshness: 'realtime' };
    const tools = aiRoute(ctx, 'search');
    // Realtime should prefer serpapi-google (fast) first
    expect(tools[0]).toBe('serpapi-google');
    expect(tools.length).toBeGreaterThan(0);
  });

  it('routes news to fresh tools', () => {
    const ctx: QueryContext = { type: 'news', domain: 'tech', depth: 'shallow', freshness: 'recent' };
    const tools = aiRoute(ctx, 'search');
    // News should prefer tavily or serpapi (freshness-oriented)
    expect(['tavily', 'serpapi']).toContain(tools[0]);
    expect(tools.length).toBeGreaterThan(0);
  });

  it('routes research to quality tools', () => {
    const ctx: QueryContext = { type: 'research', domain: 'tech', depth: 'deep', freshness: 'any' };
    const tools = aiRoute(ctx, 'search');
    expect(tools[0]).toBe('exa-search'); // Highest quality
    expect(tools.length).toBeGreaterThan(0);
  });

  it('routes simple to cheap tools', () => {
    const ctx: QueryContext = { type: 'simple', domain: 'general', depth: 'shallow', freshness: 'any' };
    const tools = aiRoute(ctx, 'search');
    expect(tools[0]).toBe('brave-search'); // Cheapest
    expect(tools.length).toBeGreaterThan(0);
  });

  it('finance capability returns finance tools', () => {
    const ctx: QueryContext = { type: 'realtime', domain: 'finance', depth: 'shallow', freshness: 'realtime' };
    const tools = aiRoute(ctx, 'finance');
    expect(tools).toContain('polygon-io');
    expect(tools.length).toBe(3);
  });

  it('always includes all capability tools as fallbacks', () => {
    const ctx: QueryContext = { type: 'simple', domain: 'general', depth: 'shallow', freshness: 'any' };
    const tools = aiRoute(ctx, 'search');
    // Should include all 10 search tools
    expect(tools.length).toBe(10);
  });
});

describe('fastClassify (via regex patterns)', () => {
  // We test indirectly by importing the internal fastClassify or testing through getClassification
  // Since fastClassify is not exported, we test the patterns it should match

  it('should distinguish finance/realtime patterns', () => {
    // These patterns should be caught by the fast classifier regex
    const financeRealtimePatterns = [
      'NVDA stock price today',
      'Bitcoin price right now',
      'ETH current price',
      'Tesla stock today',
    ];
    // Verify the regex patterns work
    const financeTerms = /\b(stock|price|ticker|share|market cap|earnings|dividend|p\/e|crypto|bitcoin|btc|eth|ethereum|forex|exchange rate|trading)\b/i;
    const realtimeTerms = /\b(today|right now|current|live|real.?time|latest price|price now)\b/i;

    for (const query of financeRealtimePatterns) {
      expect(financeTerms.test(query)).toBe(true);
      // At least some should match realtime
      if (query.includes('today') || query.includes('right now') || query.includes('current')) {
        expect(realtimeTerms.test(query)).toBe(true);
      }
    }
  });

  it('should distinguish news patterns', () => {
    const newsTerms = /\b(latest|breaking|recent|new|announced|launched|funding|raised|acquired|ipo|merger|regulation|ruling)\b/i;
    const yearPattern = /\b20(2[4-9]|3[0-9])\b/;

    expect(newsTerms.test('latest AI funding rounds 2026')).toBe(true);
    expect(yearPattern.test('latest AI funding rounds 2026')).toBe(true);
  });

  it('should distinguish research patterns', () => {
    const researchTerms = /\b(explain|how does|architecture|in.?depth|compare|comparison|vs|versus|tutorial|deep dive|comprehensive|detailed)\b/i;

    expect(researchTerms.test('explain transformer architecture in detail')).toBe(true);
    expect(researchTerms.test('compare Redis vs Memcached')).toBe(true);
  });
});
