import type { ToolCallResult } from './types';

/** Extract a ticker symbol from a natural language finance query. */
export function extractTicker(query: string): string {
  const lower = query.toLowerCase();

  // Common name → ticker mapping (checked FIRST to avoid partial uppercase matches)
  const nameMap: Record<string, string> = {
    // Equities
    apple: 'AAPL', nvidia: 'NVDA', google: 'GOOGL', alphabet: 'GOOGL',
    amazon: 'AMZN', microsoft: 'MSFT', tesla: 'TSLA', meta: 'META',
    netflix: 'NFLX', intel: 'INTC', amd: 'AMD', shopify: 'SHOP',
    uber: 'UBER', airbnb: 'ABNB', palantir: 'PLTR', snowflake: 'SNOW',
    coinbase: 'COIN', robinhood: 'HOOD', disney: 'DIS', nike: 'NKE',
    // Indices/ETFs
    'sp500': 'SPY', 's&p': 'SPY', 's&p 500': 'SPY', 'dow jones': 'DIA',
    nasdaq: 'QQQ', russell: 'IWM',
    // Crypto (Polygon uses X: prefix for crypto pairs)
    bitcoin: 'X:BTCUSD', btc: 'X:BTCUSD',
    ethereum: 'X:ETHUSD', eth: 'X:ETHUSD',
    solana: 'X:SOLUSD', sol: 'X:SOLUSD',
    dogecoin: 'X:DOGEUSD', doge: 'X:DOGEUSD',
    xrp: 'X:XRPUSD', ripple: 'X:XRPUSD',
    cardano: 'X:ADAUSD', ada: 'X:ADAUSD',
    // Forex
    'eur/usd': 'C:EURUSD', 'usd/jpy': 'C:USDJPY', 'gbp/usd': 'C:GBPUSD',
  };
  for (const [name, ticker] of Object.entries(nameMap)) {
    if (lower.includes(name)) return ticker;
  }

  // Try to find explicit ticker patterns like "AAPL", "$NVDA", but require 2+ uppercase letters
  // to avoid matching the first letter of normal words like "Bitcoin"
  const tickerMatch = query.match(/\$?([A-Z]{2,5})\b/);
  if (tickerMatch) return tickerMatch[1];

  return 'SPY'; // Default fallback — broad market
}

export async function callPolygon(query: string, config?: Record<string, unknown>): Promise<ToolCallResult> {
  const apiKey = process.env.POLYGON_API_KEY?.trim();
  if (!apiKey) throw new Error('POLYGON_API_KEY not set');

  const ticker = (config?.ticker as string) || extractTicker(query);

  // Crypto/forex tickers use different URL encoding (e.g., X:BTCUSD → X%3ABTCUSD)
  const encodedTicker = encodeURIComponent(ticker);

  const start = performance.now();
  const response = await fetch(
    `https://api.polygon.io/v2/aggs/ticker/${encodedTicker}/prev?adjusted=true&apiKey=${apiKey}`,
    {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
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
