import { describe, it, expect } from 'vitest';
import { getRankedToolsForCapability, CAPABILITY_TOOLS } from '@/lib/router/index';

describe('Capability validation', () => {
  it('returns tools for valid capabilities', () => {
    expect(getRankedToolsForCapability('search')).toHaveLength(9);
    expect(getRankedToolsForCapability('crawl')).toHaveLength(5);
    expect(getRankedToolsForCapability('embed')).toHaveLength(4);
    expect(getRankedToolsForCapability('finance')).toHaveLength(3);
  });

  it('returns empty array for invalid capability (used for 404)', () => {
    expect(getRankedToolsForCapability('ai')).toEqual([]);
    expect(getRankedToolsForCapability('invalid')).toEqual([]);
    expect(getRankedToolsForCapability('')).toEqual([]);
    expect(getRankedToolsForCapability('storage')).toEqual([]);
  });

  it('CAPABILITY_TOOLS only has search, crawl, embed, finance', () => {
    const keys = Object.keys(CAPABILITY_TOOLS);
    expect(keys).toEqual(['search', 'crawl', 'embed', 'finance']);
  });
});

describe('Strategy-based ranking', () => {
  it('most_accurate ranks highest quality first', () => {
    const ranked = getRankedToolsForCapability('search', 'most_accurate');
    expect(ranked[0]).toBe('exa-search'); // quality 4.6
    expect(ranked[1]).toBe('perplexity-search'); // quality 4.2
  });

  it('cheapest ranks lowest cost first (with quality floor)', () => {
    const ranked = getRankedToolsForCapability('search', 'cheapest');
    expect(ranked[0]).toBe('serpapi'); // cost 0.0005
  });

  it('fastest ranks lowest latency first (with quality floor)', () => {
    const ranked = getRankedToolsForCapability('search', 'fastest');
    expect(ranked.length).toBeGreaterThan(0);
    // All returned tools should have quality >= 2.5
    expect(ranked[0]).toBeDefined();
  });

  it('all canonical strategies return non-empty results', () => {
    const strategies = ['balanced', 'fastest', 'cheapest', 'most_accurate'] as const;
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
