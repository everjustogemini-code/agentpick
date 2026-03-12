// Tool detection patterns for various formats

interface DetectedTool {
  name: string;
  slug: string | null;
  source: string; // where we found it
}

// Map of known tool identifiers to AgentPick slugs
const TOOL_MAP: Record<string, { slug: string; name: string }> = {
  // Search tools
  tavily: { slug: 'tavily', name: 'Tavily' },
  tavilysearchresults: { slug: 'tavily', name: 'Tavily' },
  tavily_search: { slug: 'tavily', name: 'Tavily' },
  exa: { slug: 'exa-search', name: 'Exa' },
  exasearch: { slug: 'exa-search', name: 'Exa' },
  exa_search: { slug: 'exa-search', name: 'Exa' },
  serper: { slug: 'serper-api', name: 'Serper' },
  serperapi: { slug: 'serper-api', name: 'Serper' },
  serper_api: { slug: 'serper-api', name: 'Serper' },
  googleserpapi: { slug: 'serper-api', name: 'Serper' },
  brave: { slug: 'brave-search', name: 'Brave Search' },
  bravesearch: { slug: 'brave-search', name: 'Brave Search' },
  brave_search: { slug: 'brave-search', name: 'Brave Search' },
  // Crawling tools
  firecrawl: { slug: 'firecrawl-api', name: 'Firecrawl' },
  firecrawlloader: { slug: 'firecrawl-api', name: 'Firecrawl' },
  firecrawl_api: { slug: 'firecrawl-api', name: 'Firecrawl' },
  jina: { slug: 'jina-reader', name: 'Jina Reader' },
  jinareader: { slug: 'jina-reader', name: 'Jina Reader' },
  jina_reader: { slug: 'jina-reader', name: 'Jina Reader' },
  // Generic
  wikipedia: { slug: null as unknown as string, name: 'Wikipedia' },
  wikipediaqueryrun: { slug: null as unknown as string, name: 'Wikipedia' },
};

// Framework detection
const FRAMEWORK_PATTERNS: [RegExp, string][] = [
  [/langchain|from langchain/i, 'LangChain'],
  [/crewai|from crewai/i, 'CrewAI'],
  [/autogen|from autogen/i, 'AutoGen'],
  [/llamaindex|from llama_index/i, 'LlamaIndex'],
  [/haystack|from haystack/i, 'Haystack'],
  [/semantic.kernel/i, 'Semantic Kernel'],
  [/openai.*assistants|assistant.*tools/i, 'OpenAI Assistants'],
  [/claude.*tools|anthropic.*tools/i, 'Claude Tools'],
  [/openclaw/i, 'OpenClaw'],
];

export function parseCode(code: string, format: string): {
  tools: DetectedTool[];
  framework: string | null;
  inferredDomain: string | null;
} {
  const normalizedCode = code.toLowerCase();
  const tools: DetectedTool[] = [];
  const seen = new Set<string>();

  // Detect framework
  let framework: string | null = null;
  for (const [pattern, name] of FRAMEWORK_PATTERNS) {
    if (pattern.test(code)) {
      framework = name;
      break;
    }
  }

  // Try each tool pattern
  for (const [key, info] of Object.entries(TOOL_MAP)) {
    if (normalizedCode.includes(key) && !seen.has(info.name)) {
      seen.add(info.name);
      tools.push({
        name: info.name,
        slug: info.slug || null,
        source: key,
      });
    }
  }

  // Also check for API URLs
  const urlPatterns: [RegExp, { slug: string; name: string }][] = [
    [/api\.tavily\.com/i, { slug: 'tavily', name: 'Tavily' }],
    [/api\.exa\.ai/i, { slug: 'exa-search', name: 'Exa' }],
    [/google\.serper\.dev/i, { slug: 'serper-api', name: 'Serper' }],
    [/api\.search\.brave\.com/i, { slug: 'brave-search', name: 'Brave Search' }],
    [/api\.firecrawl\.dev/i, { slug: 'firecrawl-api', name: 'Firecrawl' }],
    [/r\.jina\.ai/i, { slug: 'jina-reader', name: 'Jina Reader' }],
  ];

  for (const [pattern, info] of urlPatterns) {
    if (pattern.test(code) && !seen.has(info.name)) {
      seen.add(info.name);
      tools.push({ name: info.name, slug: info.slug, source: 'url' });
    }
  }

  // If format is "text", treat each line as a potential tool name
  if (format === 'text' && tools.length === 0) {
    const lines = code.split(/[\n,]+/).map(l => l.trim().toLowerCase()).filter(Boolean);
    for (const line of lines) {
      const cleaned = line.replace(/[^a-z0-9_-]/g, '');
      const match = TOOL_MAP[cleaned];
      if (match && !seen.has(match.name)) {
        seen.add(match.name);
        tools.push({ name: match.name, slug: match.slug || null, source: 'text' });
      }
    }
  }

  // Infer domain from code context
  let inferredDomain: string | null = null;
  if (/financ|stock|sec filing|trading|market/i.test(code)) inferredDomain = 'finance';
  else if (/legal|law|court|litigation/i.test(code)) inferredDomain = 'legal';
  else if (/medical|health|clinical|patient/i.test(code)) inferredDomain = 'science';
  else if (/news|headline|journalist/i.test(code)) inferredDomain = 'news';
  else if (/ecommerce|product|shop|cart/i.test(code)) inferredDomain = 'ecommerce';
  else if (/education|learn|student|course/i.test(code)) inferredDomain = 'education';
  else inferredDomain = 'general';

  return { tools, framework, inferredDomain };
}
