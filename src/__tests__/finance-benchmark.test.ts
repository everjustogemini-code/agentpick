import { describe, it, expect } from 'vitest';
import { generateQuerySet } from '@/lib/ops/data';

describe('Finance data query generation', () => {
  it('generates ticker-based queries for finance_data domain', () => {
    const queries = generateQuerySet('finance_data', 10);
    expect(queries).toHaveLength(10);
    // All queries should be ticker symbols, not search-style text
    for (const q of queries) {
      // Tickers are short uppercase strings (1-5 chars, possibly with a dot like BRK.B)
      expect(q.query).toMatch(/^[A-Z.]{1,6}$/);
      expect(q.query).not.toContain('latest');
      expect(q.query).not.toContain('changes');
      expect(q.query).not.toContain('affecting');
    }
  });

  it('includes known major tickers', () => {
    const queries = generateQuerySet('finance_data', 20);
    const tickers = queries.map(q => q.query);
    expect(tickers).toContain('AAPL');
    expect(tickers).toContain('NVDA');
    expect(tickers).toContain('MSFT');
    expect(tickers).toContain('GOOGL');
    expect(tickers).toContain('TSLA');
  });

  it('still generates search-style queries for non-finance domains', () => {
    const queries = generateQuerySet('finance', 5);
    // Regular finance domain uses search-style queries
    expect(queries[0].query).toContain('latest');
  });

  it('assigns complexity and intent to finance queries', () => {
    const queries = generateQuerySet('finance_data', 3);
    expect(queries[0].complexity).toBeDefined();
    expect(queries[0].intent).toBeDefined();
    // All three complexity levels should appear
    const complexities = queries.map(q => q.complexity);
    expect(complexities).toContain('simple');
    expect(complexities).toContain('medium');
    expect(complexities).toContain('complex');
  });
});
