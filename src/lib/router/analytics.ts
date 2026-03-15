export type RouterAnalyticsRange = '24h' | '7d' | '30d';

export interface RouterAnalyticsCallRecord {
  createdAt: Date;
  toolUsed: string;
  strategyUsed: string;
  latencyMs: number;
  fallbackUsed: boolean;
  costUsd: number;
  success: boolean;
}

export interface RouterAnalyticsBucketPoint {
  bucketStart: string;
  label: string;
}

export interface RouterAnalyticsToolPoint extends RouterAnalyticsBucketPoint {
  total: number;
  [tool: string]: number | string;
}

export interface RouterAnalyticsLatencyPoint extends RouterAnalyticsBucketPoint {
  avg: number | null;
  p50: number | null;
  p95: number | null;
  p99: number | null;
  totalCalls: number;
}

export interface RouterAnalyticsFallbackPoint extends RouterAnalyticsBucketPoint {
  fallbackCalls: number;
  fallbackRate: number;
  totalCalls: number;
}

export interface RouterAnalyticsCostPoint extends RouterAnalyticsBucketPoint {
  avgCostUsd: number;
  costUsd: number;
  totalCalls: number;
}

export interface RouterAnalyticsStrategySlice {
  key: string;
  label: string;
  share: number;
  value: number;
}

export interface RouterAnalyticsToolSummary {
  avgLatencyMs: number;
  calls: number;
  fallbackCount: number;
  share: number;
  tool: string;
}

export interface RouterAnalyticsResponse {
  callsByTool: RouterAnalyticsToolPoint[];
  costTrend: RouterAnalyticsCostPoint[];
  fallbackRateTrend: RouterAnalyticsFallbackPoint[];
  latencyPercentiles: RouterAnalyticsLatencyPoint[];
  range: {
    bucketCount: number;
    bucketSizeMinutes: number;
    key: RouterAnalyticsRange;
    label: string;
    now: string;
    since: string;
  };
  strategyDistribution: RouterAnalyticsStrategySlice[];
  summary: {
    avgCostUsd: number;
    fallbackRate: number;
    latestCallAt: string | null;
    latencyMs: {
      avg: number | null;
      p50: number | null;
      p95: number | null;
      p99: number | null;
    };
    successRate: number;
    totalCalls: number;
    totalCostUsd: number;
    totalFallbacks: number;
  };
  toolSeries: string[];
  topTools: RouterAnalyticsToolSummary[];
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MAX_TOOL_SERIES = 4;

export const ANALYTICS_RANGE_OPTIONS: Array<{
  key: RouterAnalyticsRange;
  label: string;
}> = [
  { key: '24h', label: '24h' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
];

const RANGE_CONFIG: Record<
  RouterAnalyticsRange,
  {
    bucketCount: number;
    bucketSizeMs: number;
    label: string;
  }
> = {
  '24h': {
    bucketCount: 24,
    bucketSizeMs: HOUR_MS,
    label: 'Last 24 hours',
  },
  '7d': {
    bucketCount: 7,
    bucketSizeMs: DAY_MS,
    label: 'Last 7 days',
  },
  '30d': {
    bucketCount: 30,
    bucketSizeMs: DAY_MS,
    label: 'Last 30 days',
  },
};

interface MutableBucket {
  costUsd: number;
  fallbackCalls: number;
  label: string;
  latencyValues: number[];
  start: Date;
  toolCounts: Map<string, number>;
  totalCalls: number;
}

interface MutableToolSummary {
  calls: number;
  fallbackCount: number;
  latencySum: number;
}

function alignToBucketStart(date: Date, bucketSizeMs: number) {
  const time = Math.floor(date.getTime() / bucketSizeMs) * bucketSizeMs;
  return new Date(time);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatBucketLabel(date: Date, range: RouterAnalyticsRange) {
  if (range === '24h') {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
    });
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatStrategyLabel(strategy: string) {
  switch (strategy) {
    case 'AUTO':
      return 'Auto';
    case 'BALANCED':
      return 'Balanced';
    case 'CHEAPEST':
      return 'Cheapest';
    case 'FASTEST':
      return 'Fastest';
    case 'MOST_ACCURATE':
      return 'Most accurate';
    case 'MANUAL':
      return 'Manual';
    default:
      return strategy
        .toLowerCase()
        .split('_')
        .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
        .join(' ');
  }
}

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  if (sorted.length === 1) return sorted[0];

  const index = (sorted.length - 1) * clamp(p, 0, 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];

  const weight = index - lower;
  return sorted[lower] + (sorted[upper] - sorted[lower]) * weight;
}

export function normalizeAnalyticsRange(input: string | null): RouterAnalyticsRange {
  if (input === '24h' || input === '7d' || input === '30d') {
    return input;
  }

  return '24h';
}

export function getRouterAnalyticsWindow(range: RouterAnalyticsRange, now = new Date()) {
  const config = RANGE_CONFIG[range];
  const currentBucketStart = alignToBucketStart(now, config.bucketSizeMs);

  return {
    bucketCount: config.bucketCount,
    bucketSizeMs: config.bucketSizeMs,
    now,
    since: new Date(
      currentBucketStart.getTime() - (config.bucketCount - 1) * config.bucketSizeMs,
    ),
  };
}

export function buildRouterAnalytics(
  calls: RouterAnalyticsCallRecord[],
  range: RouterAnalyticsRange,
  now = new Date(),
): RouterAnalyticsResponse {
  const config = RANGE_CONFIG[range];
  const { since } = getRouterAnalyticsWindow(range, now);

  const buckets: MutableBucket[] = Array.from({ length: config.bucketCount }, (_, index) => {
    const start = new Date(since.getTime() + index * config.bucketSizeMs);
    return {
      costUsd: 0,
      fallbackCalls: 0,
      label: formatBucketLabel(start, range),
      latencyValues: [],
      start,
      toolCounts: new Map(),
      totalCalls: 0,
    };
  });

  const toolTotals = new Map<string, MutableToolSummary>();
  const strategyTotals = new Map<string, number>();

  let successCalls = 0;
  let fallbackCalls = 0;
  let totalCostUsd = 0;
  const latencyValues: number[] = [];

  let latestCallAt: Date | null = null;

  // Capability names stored as toolUsed fallback in recordRouterCall must not appear as
  // phantom tool entries in analytics (e.g. 'search', 'crawl'). Mirrors the filter in sdk.ts.
  const CAPABILITY_NAMES = new Set([
    'search', 'crawl', 'embed', 'finance', 'code', 'communication',
    'translation', 'ocr', 'storage', 'payments', 'auth', 'scheduling', 'ai', 'observability',
  ]);

  for (const call of calls) {
    if (call.createdAt < since || call.createdAt > now) {
      continue;
    }
    // Skip legacy/failure DB records where toolUsed was not properly recorded
    if (!call.toolUsed || call.toolUsed === 'unknown' || call.toolUsed.endsWith('-unavailable') || CAPABILITY_NAMES.has(call.toolUsed)) {
      continue;
    }

    const bucketIndex = clamp(
      Math.floor((call.createdAt.getTime() - since.getTime()) / config.bucketSizeMs),
      0,
      config.bucketCount - 1,
    );
    const bucket = buckets[bucketIndex];

    bucket.totalCalls += 1;
    bucket.costUsd += call.costUsd;
    bucket.latencyValues.push(call.latencyMs);
    if (call.fallbackUsed) {
      bucket.fallbackCalls += 1;
    }

    bucket.toolCounts.set(call.toolUsed, (bucket.toolCounts.get(call.toolUsed) ?? 0) + 1);

    const toolSummary = toolTotals.get(call.toolUsed) ?? {
      calls: 0,
      fallbackCount: 0,
      latencySum: 0,
    };
    toolSummary.calls += 1;
    toolSummary.latencySum += call.latencyMs;
    if (call.fallbackUsed) {
      toolSummary.fallbackCount += 1;
    }
    toolTotals.set(call.toolUsed, toolSummary);

    strategyTotals.set(call.strategyUsed, (strategyTotals.get(call.strategyUsed) ?? 0) + 1);

    if (call.success) {
      successCalls += 1;
    }
    if (call.fallbackUsed) {
      fallbackCalls += 1;
    }

    totalCostUsd += call.costUsd;
    latencyValues.push(call.latencyMs);

    if (!latestCallAt || call.createdAt > latestCallAt) {
      latestCallAt = call.createdAt;
    }
  }

  const totalCalls = latencyValues.length;

  const topToolEntries = [...toolTotals.entries()]
    .sort((left, right) => right[1].calls - left[1].calls)
    .map(([tool, summary]) => ({
      avgLatencyMs: summary.calls > 0 ? round(summary.latencySum / summary.calls, 1) : 0,
      calls: summary.calls,
      fallbackCount: summary.fallbackCount,
      share: totalCalls > 0 ? round(summary.calls / totalCalls, 4) : 0,
      tool,
    }));

  const visibleTools = topToolEntries.slice(0, MAX_TOOL_SERIES).map((entry) => entry.tool);
  const hiddenTools = new Set(
    topToolEntries.slice(MAX_TOOL_SERIES).map((entry) => entry.tool),
  );
  const otherToolCalls = topToolEntries
    .slice(MAX_TOOL_SERIES)
    .reduce((sum, entry) => sum + entry.calls, 0);
  const toolSeries = otherToolCalls > 0 ? [...visibleTools, 'Other'] : visibleTools;

  const callsByTool: RouterAnalyticsToolPoint[] = buckets.map((bucket) => {
    const point: RouterAnalyticsToolPoint = {
      bucketStart: bucket.start.toISOString(),
      label: bucket.label,
      total: bucket.totalCalls,
    };

    let otherCalls = 0;
    for (const tool of visibleTools) {
      point[tool] = bucket.toolCounts.get(tool) ?? 0;
    }
    if (otherToolCalls > 0) {
      for (const [tool, count] of bucket.toolCounts.entries()) {
        if (hiddenTools.has(tool)) {
          otherCalls += count;
        }
      }
      point.Other = otherCalls;
    }

    return point;
  });

  const latencyPercentiles: RouterAnalyticsLatencyPoint[] = buckets.map((bucket) => {
    const avg =
      bucket.totalCalls > 0
        ? round(bucket.latencyValues.reduce((sum, value) => sum + value, 0) / bucket.totalCalls, 1)
        : null;

    return {
      avg,
      bucketStart: bucket.start.toISOString(),
      label: bucket.label,
      p50: percentile(bucket.latencyValues, 0.5),
      p95: percentile(bucket.latencyValues, 0.95),
      p99: percentile(bucket.latencyValues, 0.99),
      totalCalls: bucket.totalCalls,
    };
  });

  const fallbackRateTrend: RouterAnalyticsFallbackPoint[] = buckets.map((bucket) => ({
    bucketStart: bucket.start.toISOString(),
    fallbackCalls: bucket.fallbackCalls,
    fallbackRate:
      bucket.totalCalls > 0 ? round((bucket.fallbackCalls / bucket.totalCalls) * 100, 1) : 0,
    label: bucket.label,
    totalCalls: bucket.totalCalls,
  }));

  const costTrend: RouterAnalyticsCostPoint[] = buckets.map((bucket) => ({
    avgCostUsd: bucket.totalCalls > 0 ? round(bucket.costUsd / bucket.totalCalls, 4) : 0,
    bucketStart: bucket.start.toISOString(),
    costUsd: round(bucket.costUsd, 4),
    label: bucket.label,
    totalCalls: bucket.totalCalls,
  }));

  const strategyDistribution: RouterAnalyticsStrategySlice[] = [...strategyTotals.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([key, value]) => ({
      key,
      label: formatStrategyLabel(key),
      share: totalCalls > 0 ? round(value / totalCalls, 4) : 0,
      value,
    }));

  return {
    callsByTool,
    costTrend,
    fallbackRateTrend,
    latencyPercentiles,
    range: {
      bucketCount: config.bucketCount,
      bucketSizeMinutes: Math.floor(config.bucketSizeMs / (60 * 1000)),
      key: range,
      label: config.label,
      now: now.toISOString(),
      since: since.toISOString(),
    },
    strategyDistribution,
    summary: {
      avgCostUsd: totalCalls > 0 ? round(totalCostUsd / totalCalls, 4) : 0,
      fallbackRate: totalCalls > 0 ? round((fallbackCalls / totalCalls) * 100, 1) : 0,
      latestCallAt: latestCallAt?.toISOString() ?? null,
      latencyMs: {
        avg:
          totalCalls > 0
            ? round(latencyValues.reduce((sum, value) => sum + value, 0) / totalCalls, 1)
            : null,
        p50: percentile(latencyValues, 0.5),
        p95: percentile(latencyValues, 0.95),
        p99: percentile(latencyValues, 0.99),
      },
      successRate: totalCalls > 0 ? round((successCalls / totalCalls) * 100, 1) : 0,
      totalCalls,
      totalCostUsd: round(totalCostUsd, 4),
      totalFallbacks: fallbackCalls,
    },
    toolSeries,
    topTools: topToolEntries,
  };
}
