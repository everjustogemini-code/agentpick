import type { ToolCallResult } from './types';

/** Extract a ticker symbol from a natural language finance query. */
function extractTicker(query: string): string {
  // Try to find explicit ticker patterns like "AAPL", "$NVDA"
  const tickerMatch = query.match(/\$?([A-Z]{1,5})\b/);
  if (tickerMatch) return tickerMatch[1];

  // Common name → ticker mapping for benchmark queries
  const nameMap: Record<string, string> = {
    apple: 'AAPL', nvidia: 'NVDA', google: 'GOOGL', amazon: 'AMZN',
    microsoft: 'MSFT', tesla: 'TSLA', meta: 'META', netflix: 'NFLX',
    'sp500': 'SPY', 's&p': 'SPY', 's&p 500': 'SPY',
  };
  const lower = query.toLowerCase();
  for (const [name, ticker] of Object.entries(nameMap)) {
    if (lower.includes(name)) return ticker;
  }

  return 'SPY'; // Default fallback
}

export async function callPolygon(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.POLYGON_API_KEY?.trim();
  if (!apiKey) throw new Error('POLYGON_API_KEY not set');

  const ticker = (config?.ticker as string) || extractTicker(query);

  const start = performance.now();
  const response = await fetch(
    `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${apiKey}`,
    {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    },
  );
  const latencyMs = Math.round(performance.now() - start);

  const data = await response.json();

  if (!response.ok) {
    console.error('[Polygon] API error:', {
      status: response.status,
      body: JSON.stringify(data).slice(0, 500),
    });
  }

  const results = (data as any)?.results ?? [];
  return {
    statusCode: response.status,
    latencyMs,
    resultCount: results.length,
    response: data,
    costUsd: 0, // Free tier for prev close
  };
}
