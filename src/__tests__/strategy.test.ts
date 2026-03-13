import { describe, it, expect } from 'vitest';
import { normalizeStrategy, isRouterStrategy } from '@/lib/router/sdk';

describe('normalizeStrategy', () => {
  it('normalizes uppercase strategies', () => {
    expect(normalizeStrategy('BALANCED')).toBe('BALANCED');
    expect(normalizeStrategy('FASTEST')).toBe('FASTEST');
    expect(normalizeStrategy('CHEAPEST')).toBe('CHEAPEST');
    expect(normalizeStrategy('MOST_ACCURATE')).toBe('MOST_ACCURATE');
    expect(normalizeStrategy('AUTO')).toBe('AUTO');
    expect(normalizeStrategy('MANUAL')).toBe('MANUAL');
  });

  it('normalizes lowercase strategies', () => {
    expect(normalizeStrategy('balanced')).toBe('BALANCED');
    expect(normalizeStrategy('fastest')).toBe('FASTEST');
    expect(normalizeStrategy('cheapest')).toBe('CHEAPEST');
    expect(normalizeStrategy('most_accurate')).toBe('MOST_ACCURATE');
    expect(normalizeStrategy('auto')).toBe('AUTO');
  });

  it('maps legacy aliases', () => {
    expect(normalizeStrategy('BEST_PERFORMANCE')).toBe('MOST_ACCURATE');
    expect(normalizeStrategy('best_performance')).toBe('MOST_ACCURATE');
    expect(normalizeStrategy('MOST_STABLE')).toBe('BALANCED');
    expect(normalizeStrategy('most_stable')).toBe('BALANCED');
  });

  it('rejects invalid strategies', () => {
    expect(normalizeStrategy('invalid_strategy')).toBeNull();
    expect(normalizeStrategy('')).toBeNull();
    expect(normalizeStrategy('turbo')).toBeNull();
  });
});

describe('isRouterStrategy', () => {
  it('accepts valid strategies case-insensitively', () => {
    expect(isRouterStrategy('BALANCED')).toBe(true);
    expect(isRouterStrategy('balanced')).toBe(true);
    expect(isRouterStrategy('Fastest')).toBe(true);
    expect(isRouterStrategy('AUTO')).toBe(true);
    expect(isRouterStrategy('auto')).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(isRouterStrategy('invalid')).toBe(false);
    expect(isRouterStrategy(null)).toBe(false);
    expect(isRouterStrategy(undefined)).toBe(false);
    expect(isRouterStrategy(123)).toBe(false);
  });
});
