// One-time script to store 11 API keys in ApiKeyVault
// Run: npx tsx scripts/store-keys.ts

import { saveApiKey } from '../src/lib/ops/data';

const KEYS = [
  { service: 'perplexity', displayName: 'Perplexity API', apiKey: process.env.PERPLEXITY_API_KEY!, tier: 'paid', monthlyLimit: 10000 },
  { service: 'you', displayName: 'You.com Search', apiKey: process.env.YOU_API_KEY!, tier: 'paid', monthlyLimit: 5000 },
  { service: 'serpapi', displayName: 'SerpAPI', apiKey: process.env.SERPAPI_KEY!, tier: 'paid', monthlyLimit: 5000 },
  { service: 'apify', displayName: 'Apify', apiKey: process.env.APIFY_API_KEY!, tier: 'paid', monthlyLimit: 5000 },
  { service: 'scrapingbee', displayName: 'ScrapingBee', apiKey: process.env.SCRAPINGBEE_API_KEY!, tier: 'paid', monthlyLimit: 5000 },
  { service: 'browserbase', displayName: 'Browserbase', apiKey: process.env.BROWSERBASE_API_KEY!, tier: 'paid', monthlyLimit: 1000 },
  { service: 'polygon', displayName: 'Polygon.io', apiKey: process.env.POLYGON_API_KEY!, tier: 'free', monthlyLimit: 5000 },
  { service: 'alphavantage', displayName: 'Alpha Vantage', apiKey: process.env.ALPHAVANTAGE_API_KEY!, tier: 'free', monthlyLimit: 500 },
  { service: 'fmp', displayName: 'Financial Modeling Prep', apiKey: process.env.FMP_API_KEY!, tier: 'free', monthlyLimit: 250 },
  { service: 'cohere', displayName: 'Cohere', apiKey: process.env.COHERE_API_KEY!, tier: 'paid', monthlyLimit: 10000 },
  { service: 'voyage', displayName: 'Voyage AI', apiKey: process.env.VOYAGE_API_KEY!, tier: 'paid', monthlyLimit: 10000 },
];

async function main() {
  console.log('Storing 11 API keys in vault...');
  for (const key of KEYS) {
    if (!key.apiKey) {
      console.log(`  SKIP ${key.service} — no key in env`);
      continue;
    }
    try {
      await saveApiKey(key);
      console.log(`  OK ${key.service}`);
    } catch (err) {
      console.error(`  FAIL ${key.service}:`, err);
    }
  }
  console.log('Done.');
}

main().catch(console.error);
