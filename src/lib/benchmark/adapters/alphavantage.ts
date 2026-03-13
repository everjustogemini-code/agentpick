import type { ToolCallResult } from './types';
import { extractTicker } from './polygon';

export async function callAlphaVantage(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY?.trim();
  if (!apiKey) throw new Error('ALPHAVANTAGE_API_KEY not set');

  const ticker = (config?.ticker as string) || extractTicker(query);
  const fn = (config?.function as string) || 'TIME_SERIES_DAILY';

  const params = new URLSearchParams({
    function: fn,
    symbol: ticker,
    outputsize: 'compact',
    apikey: apiKey,
  });

  const start = performance.now();
  const response = await fetch(`https://www.alphavantage.co/query?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  const latencyMs = Math.round(performance.now() - start);

  const data = await response.json();

  if (!response.ok) {
    console.error('[AlphaVantage] API error:', {
      status: response.status,
      body: JSON.stringify(data).slice(0, 500),
    });
  }

  // Count data points in the time series
  const tsKey = Object.keys(data as Record<string, unknown>).find(k => k.startsWith('Time Series'));
  const timeSeries = tsKey ? (data as Record<string, unknown>)[tsKey] : null;
  const resultCount = timeSeries ? Object.keys(timeSeries as Record<string, unknown>).length : 0;

  return {
    statusCode: response.status,
    latencyMs,
    resultCount,
    response: data,
    costUsd: 0, // Free tier
  };
}
