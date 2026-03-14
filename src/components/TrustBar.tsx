const API_NAMES = [
  'Exa', 'Tavily', 'Serper', 'Firecrawl', 'Jina', 'Polygon', 'Cohere',
  'Brave', 'Perplexity', 'Alpha Vantage', 'Apify', 'SerpAPI', 'Finnhub',
  'ScrapingBee', 'Diffbot', 'Bing', 'Google', 'Voyage AI', 'FMP', 'Crawl4AI',
  'Browserbase', 'Hyperbrowser', 'Steel',
  'E2B', 'Resend', 'Eden AI',
];

export default function TrustBar() {
  return (
    <section className="py-10">
      <p className="mb-6 text-center text-[14px] font-medium text-text-secondary">
        Routing through {API_NAMES.length} verified APIs
      </p>

      <div className="marquee-container">
        <div className="marquee-track">
          {/* Duplicate the list for seamless infinite scroll */}
          {[...API_NAMES, ...API_NAMES].map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="mx-5 shrink-0 whitespace-nowrap font-mono text-[13px] font-medium text-text-tertiary"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-5 text-center text-[13px] text-text-tertiary">
        Each API benchmarked by 50 agents across 10 domains.
      </p>
    </section>
  );
}
