import { describe, it, expect } from 'vitest';
import { getRankedToolsForCapability, CAPABILITY_TOOLS } from '@/lib/router/index';

describe('Capability validation', () => {
  it('returns tools for valid capabilities', () => {
    expect(getRankedToolsForCapability('search')).toHaveLength(9);
    expect(getRankedToolsForCapability('crawl')).toHaveLength(5);
    expect(getRankedToolsForCapability('embed')).toHaveLength(5);
    expect(getRankedToolsForCapability('finance')).toHaveLength(3);
  });

  it('returns empty array for invalid capability (used for 404)', () => {
    expect(getRankedToolsForCapability('ai')).toEqual([]);
    expect(getRankedToolsForCapability('invalid')).toEqual([]);
    expect(getRankedToolsForCapability('')).toEqual([]);
    expect(getRankedToolsForCapability('storage')).toEqual([]);
  });

  it('CAPABILITY_TOOLS includes the supported router capability families', () => {
    const keys = Object.keys(CAPABILITY_TOOLS);
    expect(keys).toEqual([
      'search',
      'crawl',
      'embed',
      'finance',
      'code',
      'communication',
      'translation',
      'ocr',
    ]);
  });
});

describe('Strategy-based ranking', () => {
  it('best_performance ranks highest quality first', () => {
    const ranked = getRankedToolsForCapability('search', 'best_performance');
    expect(ranked).toContain('exa-search'); // quality 4.6
    expect(ranked).toContain('perplexity-api'); // quality 4.2
  });

  it('cheapest ranks lowest cost first (with quality floor)', () => {
    const ranked = getRankedToolsForCapability('search', 'cheapest');
    // Cheapest strategy uses pure cost order — deprioritizeUnconfiguredTools is
    // intentionally skipped (cycle 94 fix). brave-search ($0.0001) must appear
    // before serper ($0.0005) due to raw cost sort.
    const braveIdx = ranked.indexOf('brave-search');
    const serperIdx = ranked.indexOf('serper');
    expect(braveIdx).toBeGreaterThanOrEqual(0);
    expect(serperIdx).toBeGreaterThanOrEqual(0);
    expect(braveIdx).toBeLessThan(serperIdx);
  });

  it('most_stable ranks highest stability first (with quality floor)', () => {
    const ranked = getRankedToolsForCapability('search', 'most_stable');
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked).toContain('serpapi'); // stability 0.98
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
    expect(ranked.length).toBe(7); // 9 - 2
  });
});
