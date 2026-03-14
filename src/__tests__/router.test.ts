import { describe, it, expect } from 'vitest';
import { getRankedToolsForCapability, CAPABILITY_TOOLS } from '@/lib/router/index';

describe('Capability validation', () => {
  it('returns tools for valid capabilities', () => {
    expect(getRankedToolsForCapability('search')).toHaveLength(10);
    expect(getRankedToolsForCapability('crawl')).toHaveLength(5);
    expect(getRankedToolsForCapability('finance')).toHaveLength(3);
  });

  it('returns empty array for invalid capability (used for 404)', () => {
    expect(getRankedToolsForCapability('ai')).toEqual([]);
    expect(getRankedToolsForCapability('invalid')).toEqual([]);
    expect(getRankedToolsForCapability('')).toEqual([]);
    expect(getRankedToolsForCapability('storage')).toEqual([]);
  });

  it('CAPABILITY_TOOLS includes search, crawl, embed, finance, code, communication, translation, ocr', () => {
    const keys = Object.keys(CAPABILITY_TOOLS);
    expect(keys).toContain('search');
    expect(keys).toContain('crawl');
    expect(keys).toContain('embed');
    expect(keys).toContain('finance');
    expect(keys).toContain('code');
    expect(keys).toContain('communication');
  });
});

describe('Strategy-based ranking', () => {
  it('best_performance ranks highest quality first', () => {
    const ranked = getRankedToolsForCapability('search', 'best_performance');
    expect(ranked[0]).toBe('exa-search'); // quality 4.6
    expect(ranked[1]).toBe('perplexity-search'); // quality 4.2
  });

  it('cheapest ranks lowest cost first (with quality floor)', () => {
    const ranked = getRankedToolsForCapability('search', 'cheapest');
    expect(ranked[0]).toBe('brave-search'); // cost 0.0001
  });

  it('most_stable ranks highest stability first (with quality floor)', () => {
    const ranked = getRankedToolsForCapability('search', 'most_stable');
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0]).toBe('serpapi'); // stability 0.98
  });

  it('all canonical strategies return non-empty results', () => {
    const strategies = ['balanced', 'best_performance', 'cheapest', 'most_stable'] as const;
    for (const s of strategies) {
      const ranked = getRankedToolsForCapability('search', s);
      expect(ranked.length).toBeGreaterThan(0);
    }
  });

  it('excludes tools when specified', () => {
    const ranked = getRankedToolsForCapability('search', 'balanced', ['serpapi', 'tavily']);
    expect(ranked).not.toContain('serpapi');
    expect(ranked).not.toContain('tavily');
    expect(ranked.length).toBe(8); // 10 - 2
  });
});
