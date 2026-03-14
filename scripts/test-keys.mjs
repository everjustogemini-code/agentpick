// Test all 11 API keys with real API calls
// Run: node scripts/test-keys.mjs

const TESTS = [
  {
    name: 'Perplexity',
    test: async () => {
      const r = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}` },
        body: JSON.stringify({ model: 'sonar', messages: [{ role: 'user', content: 'health check' }], max_tokens: 10 }),
        signal: AbortSignal.timeout(15000),
      });
      return { status: r.status, ok: r.ok };
    },
  },
  {
    name: 'You.com',
    test: async () => {
      const r = await fetch('https://api.ydc-index.io/search?query=test&num_web_results=1', {
        headers: { 'X-API-Key': process.env.YOU_API_KEY },
        signal: AbortSignal.timeout(15000),
      });
      return { status: r.status, ok: r.ok };
    },
  },
  {
    name: 'SerpAPI',
    test: async () => {
      const r = await fetch(`https://serpapi.com/search.json?q=test&engine=google&num=1&api_key=${process.env.SERPAPI_KEY}`, {
        signal: AbortSignal.timeout(15000),
      });
      return { status: r.status, ok: r.ok };
    },
  },
  {
    name: 'Apify',
    test: async () => {
      const r = await fetch(`https://api.apify.com/v2/acts?token=${process.env.APIFY_API_KEY}&limit=1`, {
        signal: AbortSignal.timeout(15000),
      });
      return { status: r.status, ok: r.ok };
    },
  },
  {
    name: 'ScrapingBee',
    test: async () => {
      const r = await fetch(`https://app.scrapingbee.com/api/v1/?api_key=${process.env.SCRAPINGBEE_API_KEY}&url=https://example.com&render_js=false`, {
        signal: AbortSignal.timeout(20000),
      });
      return { status: r.status, ok: r.ok };
    },
  },
  {
    name: 'Browserbase',
    test: async () => {
      const r = await fetch('https://www.browserbase.com/v1/sessions?limit=1', {
        headers: { 'x-bb-api-key': process.env.BROWSERBASE_API_KEY },
        signal: AbortSignal.timeout(15000),
      });
      return { status: r.status, ok: r.ok };
    },
  },
  {
    name: 'Polygon',
    test: async () => {
      const r = await fetch(`https://api.polygon.io/v2/aggs/ticker/AAPL/prev?adjusted=true&apiKey=${process.env.POLYGON_API_KEY}`, {
        signal: AbortSignal.timeout(15000),
      });
      return { status: r.status, ok: r.ok };
    },
  },
  {
    name: 'Alpha Vantage',
    test: async () => {
      const r = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=AAPL&outputsize=compact&apikey=${process.env.ALPHAVANTAGE_API_KEY}`, {
        signal: AbortSignal.timeout(15000),
      });
      const data = await r.json();
      const hasData = !!data['Time Series (Daily)'];
      return { status: r.status, ok: r.ok && hasData };
    },
  },
  {
    name: 'FMP',
    test: async () => {
      const r = await fetch(`https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=${process.env.FMP_API_KEY}`, {
        signal: AbortSignal.timeout(15000),
      });
      return { status: r.status, ok: r.ok };
    },
  },
  {
    name: 'Cohere',
    test: async () => {
      const r = await fetch('https://api.cohere.com/v1/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.COHERE_API_KEY}` },
        body: JSON.stringify({ model: 'embed-english-v3.0', texts: ['test'], input_type: 'search_query', truncate: 'END' }),
        signal: AbortSignal.timeout(15000),
      });
      return { status: r.status, ok: r.ok };
    },
  },
  {
    name: 'Voyage',
    test: async () => {
      const r = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.VOYAGE_API_KEY}` },
        body: JSON.stringify({ model: 'voyage-3', input: ['test'], input_type: 'query' }),
        signal: AbortSignal.timeout(15000),
      });
      return { status: r.status, ok: r.ok };
    },
  },
];

async function main() {
  console.log('Testing 11 API keys...\n');
  const results = [];
  for (const t of TESTS) {
    const start = Date.now();
    try {
      const result = await t.test();
      const ms = Date.now() - start;
      const status = result.ok ? 'PASS' : 'FAIL';
      console.log(`  ${status} ${t.name} — HTTP ${result.status} (${ms}ms)`);
      results.push({ name: t.name, ...result, ms });
    } catch (err) {
      const ms = Date.now() - start;
      console.log(`  FAIL ${t.name} — ${err.message} (${ms}ms)`);
      results.push({ name: t.name, ok: false, status: 0, ms, error: err.message });
    }
  }

  const passed = results.filter(r => r.ok).length;
  console.log(`\n${passed}/${results.length} keys working.`);
}

main().catch(console.error);
