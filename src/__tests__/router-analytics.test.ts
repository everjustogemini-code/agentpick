import { describe, expect, it } from 'vitest';
import {
  buildRouterAnalytics,
  type RouterAnalyticsCallRecord,
} from '@/lib/router/analytics';

describe('buildRouterAnalytics', () => {
  it('aggregates router calls into chart-friendly analytics', () => {
    const now = new Date('2026-03-14T12:30:00.000Z');
    const calls: RouterAnalyticsCallRecord[] = [
      {
        costUsd: 0.12,
        createdAt: new Date('2026-03-14T12:10:00.000Z'),
        fallbackUsed: false,
        latencyMs: 120,
        strategyUsed: 'AUTO',
        success: true,
        toolUsed: 'exa-search',
      },
      {
        costUsd: 0.21,
        createdAt: new Date('2026-03-14T11:45:00.000Z'),
        fallbackUsed: true,
        latencyMs: 320,
        strategyUsed: 'BALANCED',
        success: true,
        toolUsed: 'tavily',
      },
      {
        costUsd: 0.05,
        createdAt: new Date('2026-03-14T11:05:00.000Z'),
        fallbackUsed: false,
        latencyMs: 220,
        strategyUsed: 'AUTO',
        success: false,
        toolUsed: 'exa-search',
      },
      {
        costUsd: 0.99,
        createdAt: new Date('2026-03-13T10:15:00.000Z'),
        fallbackUsed: false,
        latencyMs: 999,
        strategyUsed: 'FASTEST',
        success: true,
        toolUsed: 'ignored-tool',
      },
    ];

    const analytics = buildRouterAnalytics(calls, '24h', now);

    expect(analytics.summary.totalCalls).toBe(3);
    expect(analytics.summary.totalFallbacks).toBe(1);
    expect(analytics.summary.fallbackRate).toBeCloseTo(33.3, 1);
    expect(analytics.summary.successRate).toBeCloseTo(66.7, 1);
    expect(analytics.summary.totalCostUsd).toBeCloseTo(0.38, 4);
    expect(analytics.summary.latencyMs.p50).toBe(220);
    expect(analytics.summary.latencyMs.p95).toBeCloseTo(310, 0);

    expect(analytics.toolSeries).toEqual(['exa-search', 'tavily']);
    expect(analytics.strategyDistribution).toEqual([
      {
        key: 'AUTO',
        label: 'Auto',
        share: 0.6667,
        value: 2,
      },
      {
        key: 'BALANCED',
        label: 'Balanced',
        share: 0.3333,
        value: 1,
      },
    ]);

    const currentBucket = analytics.callsByTool[analytics.callsByTool.length - 1];
    expect(currentBucket['exa-search']).toBe(1);
    expect(currentBucket.total).toBe(1);

    const previousBucket = analytics.callsByTool[analytics.callsByTool.length - 2];
    expect(previousBucket['exa-search']).toBe(1);
    expect(previousBucket.tavily).toBe(1);

    const latestLatencyBucket =
      analytics.latencyPercentiles[analytics.latencyPercentiles.length - 1];
    expect(latestLatencyBucket.p50).toBe(120);

    const latestCostBucket = analytics.costTrend[analytics.costTrend.length - 1];
    expect(latestCostBucket.costUsd).toBe(0.12);
  });
});
