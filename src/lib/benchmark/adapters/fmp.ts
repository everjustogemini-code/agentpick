import type { ToolCallResult } from './types';

function extractTicker(query: string): string {
  const tickerMatch = query.match(/\$?([A-Z]{1,5})\b/);
  if (tickerMatch) return tickerMatch[1];

  const nameMap: Record<string, string> = {
    apple: 'AAPL', nvidia: 'NVDA', google: 'GOOGL', amazon: 'AMZN',
    microsoft: 'MSFT', tesla: 'TSLA', meta: 'META', netflix: 'NFLX',
    'sp500': 'SPY', 's&p': 'SPY',
  };
  const lower = query.toLowerCase();
  for (const [name, ticker] of Object.entries(nameMap)) {
    if (lower.includes(name)) return ticker;
  }
  return 'SPY';
}

export async function callFMP(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.FMP_API_KEY?.trim();
  if (!apiKey) throw new Error('FMP_API_KEY not set');

  const ticker = (config?.ticker as string) || extractTicker(query);

  const start = performance.now();
  const response = await fetch(
    `https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${apiKey}`,
    {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    },
  );
  const latencyMs = Math.round(performance.now() - start);

  const data = await response.json();

  if (!response.ok) {
    console.error('[FMP] API error:', {
      status: response.status,
      body: JSON.stringify(data).slice(0, 500),
    });
  }

  const results = Array.isArray(data) ? data : [];
  return {
    statusCode: response.status,
    latencyMs,
    resultCount: results.length,
    response: data,
    costUsd: 0, // Free tier for basic quotes
  };
}
