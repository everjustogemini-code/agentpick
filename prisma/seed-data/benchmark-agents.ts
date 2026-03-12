// 50 benchmark agents across 10 domains
// Each agent has a unique name, model provider, model name, and domain specialization

export interface BenchmarkAgentSeed {
  name: string;
  domain: string;
  modelProvider: string;
  modelName: string;
  modelFamily: string; // for Agent model
  complexity: string[];
}

export const BENCHMARK_AGENTS: BenchmarkAgentSeed[] = [
  // ═══ Finance (10 agents) ═══
  { name: 'benchmark-fin-claude-01', domain: 'finance', modelProvider: 'anthropic', modelName: 'claude-sonnet-4', modelFamily: 'Claude', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-fin-claude-02', domain: 'finance', modelProvider: 'anthropic', modelName: 'claude-sonnet-4', modelFamily: 'Claude', complexity: ['medium', 'complex'] },
  { name: 'benchmark-fin-claude-03', domain: 'finance', modelProvider: 'anthropic', modelName: 'claude-haiku-4', modelFamily: 'Claude', complexity: ['simple', 'medium'] },
  { name: 'benchmark-fin-gpt-01', domain: 'finance', modelProvider: 'openai', modelName: 'gpt-4o', modelFamily: 'GPT-4', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-fin-gpt-02', domain: 'finance', modelProvider: 'openai', modelName: 'gpt-4o-mini', modelFamily: 'GPT-4', complexity: ['simple', 'medium'] },
  { name: 'benchmark-fin-gpt-03', domain: 'finance', modelProvider: 'openai', modelName: 'gpt-4o', modelFamily: 'GPT-4', complexity: ['medium', 'complex'] },
  { name: 'benchmark-fin-gemini-01', domain: 'finance', modelProvider: 'google', modelName: 'gemini-2.0-flash', modelFamily: 'Gemini', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-fin-gemini-02', domain: 'finance', modelProvider: 'google', modelName: 'gemini-2.0-pro', modelFamily: 'Gemini', complexity: ['medium', 'complex'] },
  { name: 'benchmark-fin-deepseek-01', domain: 'finance', modelProvider: 'deepseek', modelName: 'deepseek-v3', modelFamily: 'DeepSeek', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-fin-llama-01', domain: 'finance', modelProvider: 'meta', modelName: 'llama-3.3-70b', modelFamily: 'Llama', complexity: ['simple', 'medium'] },

  // ═══ Legal (5 agents) ═══
  { name: 'benchmark-legal-claude-01', domain: 'legal', modelProvider: 'anthropic', modelName: 'claude-sonnet-4', modelFamily: 'Claude', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-legal-claude-02', domain: 'legal', modelProvider: 'anthropic', modelName: 'claude-haiku-4', modelFamily: 'Claude', complexity: ['simple', 'medium'] },
  { name: 'benchmark-legal-gpt-01', domain: 'legal', modelProvider: 'openai', modelName: 'gpt-4o', modelFamily: 'GPT-4', complexity: ['medium', 'complex'] },
  { name: 'benchmark-legal-gemini-01', domain: 'legal', modelProvider: 'google', modelName: 'gemini-2.0-flash', modelFamily: 'Gemini', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-legal-deepseek-01', domain: 'legal', modelProvider: 'deepseek', modelName: 'deepseek-v3', modelFamily: 'DeepSeek', complexity: ['medium', 'complex'] },

  // ═══ Healthcare (3 agents) ═══
  { name: 'benchmark-health-claude-01', domain: 'healthcare', modelProvider: 'anthropic', modelName: 'claude-sonnet-4', modelFamily: 'Claude', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-health-gpt-01', domain: 'healthcare', modelProvider: 'openai', modelName: 'gpt-4o', modelFamily: 'GPT-4', complexity: ['medium', 'complex'] },
  { name: 'benchmark-health-gemini-01', domain: 'healthcare', modelProvider: 'google', modelName: 'gemini-2.0-flash', modelFamily: 'Gemini', complexity: ['simple', 'medium'] },

  // ═══ E-commerce (5 agents) ═══
  { name: 'benchmark-ecom-claude-01', domain: 'ecommerce', modelProvider: 'anthropic', modelName: 'claude-sonnet-4', modelFamily: 'Claude', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-ecom-claude-02', domain: 'ecommerce', modelProvider: 'anthropic', modelName: 'claude-haiku-4', modelFamily: 'Claude', complexity: ['simple', 'medium'] },
  { name: 'benchmark-ecom-gpt-01', domain: 'ecommerce', modelProvider: 'openai', modelName: 'gpt-4o', modelFamily: 'GPT-4', complexity: ['medium', 'complex'] },
  { name: 'benchmark-ecom-gemini-01', domain: 'ecommerce', modelProvider: 'google', modelName: 'gemini-2.0-flash', modelFamily: 'Gemini', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-ecom-deepseek-01', domain: 'ecommerce', modelProvider: 'deepseek', modelName: 'deepseek-v3', modelFamily: 'DeepSeek', complexity: ['simple', 'medium'] },

  // ═══ DevTools (5 agents) ═══
  { name: 'benchmark-dev-claude-01', domain: 'devtools', modelProvider: 'anthropic', modelName: 'claude-sonnet-4', modelFamily: 'Claude', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-dev-gpt-01', domain: 'devtools', modelProvider: 'openai', modelName: 'gpt-4o', modelFamily: 'GPT-4', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-dev-gpt-02', domain: 'devtools', modelProvider: 'openai', modelName: 'gpt-4o-mini', modelFamily: 'GPT-4', complexity: ['simple', 'medium'] },
  { name: 'benchmark-dev-gemini-01', domain: 'devtools', modelProvider: 'google', modelName: 'gemini-2.0-flash', modelFamily: 'Gemini', complexity: ['medium', 'complex'] },
  { name: 'benchmark-dev-llama-01', domain: 'devtools', modelProvider: 'meta', modelName: 'llama-3.3-70b', modelFamily: 'Llama', complexity: ['simple', 'medium'] },

  // ═══ Education (3 agents) ═══
  { name: 'benchmark-edu-claude-01', domain: 'education', modelProvider: 'anthropic', modelName: 'claude-sonnet-4', modelFamily: 'Claude', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-edu-gpt-01', domain: 'education', modelProvider: 'openai', modelName: 'gpt-4o', modelFamily: 'GPT-4', complexity: ['medium', 'complex'] },
  { name: 'benchmark-edu-gemini-01', domain: 'education', modelProvider: 'google', modelName: 'gemini-2.0-flash', modelFamily: 'Gemini', complexity: ['simple', 'medium'] },

  // ═══ News & Media (5 agents) ═══
  { name: 'benchmark-news-claude-01', domain: 'news', modelProvider: 'anthropic', modelName: 'claude-sonnet-4', modelFamily: 'Claude', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-news-claude-02', domain: 'news', modelProvider: 'anthropic', modelName: 'claude-haiku-4', modelFamily: 'Claude', complexity: ['simple', 'medium'] },
  { name: 'benchmark-news-gpt-01', domain: 'news', modelProvider: 'openai', modelName: 'gpt-4o', modelFamily: 'GPT-4', complexity: ['medium', 'complex'] },
  { name: 'benchmark-news-gemini-01', domain: 'news', modelProvider: 'google', modelName: 'gemini-2.0-flash', modelFamily: 'Gemini', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-news-deepseek-01', domain: 'news', modelProvider: 'deepseek', modelName: 'deepseek-v3', modelFamily: 'DeepSeek', complexity: ['simple', 'medium'] },

  // ═══ Science (3 agents) ═══
  { name: 'benchmark-sci-claude-01', domain: 'science', modelProvider: 'anthropic', modelName: 'claude-sonnet-4', modelFamily: 'Claude', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-sci-gpt-01', domain: 'science', modelProvider: 'openai', modelName: 'gpt-4o', modelFamily: 'GPT-4', complexity: ['medium', 'complex'] },
  { name: 'benchmark-sci-llama-01', domain: 'science', modelProvider: 'meta', modelName: 'llama-3.3-70b', modelFamily: 'Llama', complexity: ['simple', 'medium'] },

  // ═══ General (8 agents) ═══
  { name: 'benchmark-gen-claude-01', domain: 'general', modelProvider: 'anthropic', modelName: 'claude-sonnet-4', modelFamily: 'Claude', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-gen-claude-02', domain: 'general', modelProvider: 'anthropic', modelName: 'claude-haiku-4', modelFamily: 'Claude', complexity: ['simple', 'medium'] },
  { name: 'benchmark-gen-gpt-01', domain: 'general', modelProvider: 'openai', modelName: 'gpt-4o', modelFamily: 'GPT-4', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-gen-gpt-02', domain: 'general', modelProvider: 'openai', modelName: 'gpt-4o-mini', modelFamily: 'GPT-4', complexity: ['simple', 'medium'] },
  { name: 'benchmark-gen-gemini-01', domain: 'general', modelProvider: 'google', modelName: 'gemini-2.0-flash', modelFamily: 'Gemini', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-gen-gemini-02', domain: 'general', modelProvider: 'google', modelName: 'gemini-2.0-pro', modelFamily: 'Gemini', complexity: ['medium', 'complex'] },
  { name: 'benchmark-gen-deepseek-01', domain: 'general', modelProvider: 'deepseek', modelName: 'deepseek-v3', modelFamily: 'DeepSeek', complexity: ['simple', 'medium'] },
  { name: 'benchmark-gen-llama-01', domain: 'general', modelProvider: 'meta', modelName: 'llama-3.3-70b', modelFamily: 'Llama', complexity: ['simple', 'medium', 'complex'] },

  // ═══ Multilingual (3 agents) ═══
  { name: 'benchmark-multi-claude-01', domain: 'multilingual', modelProvider: 'anthropic', modelName: 'claude-sonnet-4', modelFamily: 'Claude', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-multi-gpt-01', domain: 'multilingual', modelProvider: 'openai', modelName: 'gpt-4o', modelFamily: 'GPT-4', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-multi-deepseek-01', domain: 'multilingual', modelProvider: 'deepseek', modelName: 'deepseek-v3', modelFamily: 'DeepSeek', complexity: ['simple', 'medium'] },

  // ═══ Finance Data (3 agents — test Polygon, AlphaVantage, FMP) ═══
  { name: 'benchmark-findata-claude-01', domain: 'finance_data', modelProvider: 'anthropic', modelName: 'claude-sonnet-4', modelFamily: 'Claude', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-findata-gpt-01', domain: 'finance_data', modelProvider: 'openai', modelName: 'gpt-4o', modelFamily: 'GPT-4', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-findata-gemini-01', domain: 'finance_data', modelProvider: 'google', modelName: 'gemini-2.0-flash', modelFamily: 'Gemini', complexity: ['simple', 'medium'] },

  // ═══ Crawling (3 agents — test Apify, ScrapingBee, Browserbase) ═══
  { name: 'benchmark-crawl-claude-01', domain: 'crawling', modelProvider: 'anthropic', modelName: 'claude-sonnet-4', modelFamily: 'Claude', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-crawl-gpt-01', domain: 'crawling', modelProvider: 'openai', modelName: 'gpt-4o', modelFamily: 'GPT-4', complexity: ['simple', 'medium', 'complex'] },
  { name: 'benchmark-crawl-gemini-01', domain: 'crawling', modelProvider: 'google', modelName: 'gemini-2.0-flash', modelFamily: 'Gemini', complexity: ['simple', 'medium'] },

  // ═══ Embedding (3 agents — test OpenAI, Cohere, Voyage, Jina Embed) ═══
  { name: 'benchmark-embed-claude-01', domain: 'embedding', modelProvider: 'anthropic', modelName: 'claude-sonnet-4', modelFamily: 'Claude', complexity: ['simple', 'medium'] },
  { name: 'benchmark-embed-gpt-01', domain: 'embedding', modelProvider: 'openai', modelName: 'gpt-4o', modelFamily: 'GPT-4', complexity: ['simple', 'medium'] },
  { name: 'benchmark-embed-gemini-01', domain: 'embedding', modelProvider: 'google', modelName: 'gemini-2.0-flash', modelFamily: 'Gemini', complexity: ['simple', 'medium'] },
];
