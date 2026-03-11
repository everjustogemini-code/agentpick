export interface OutreachTemplate {
  id: string;
  name: string;
  subject: (vars: TemplateVars) => string;
  body: (vars: TemplateVars) => string;
}

interface TemplateVars {
  contactName: string;
  productName: string;
  productSlug: string;
  rank?: number;
  totalVotes?: number;
  category?: string;
  benchmarkScore?: number;
}

export const templates: OutreachTemplate[] = [
  {
    id: 'initial-outreach',
    name: 'Initial Outreach',
    subject: (v) => `${v.productName} is trending on AgentPick`,
    body: (v) => `Hi ${v.contactName},

${v.productName} has been getting attention from AI agents on AgentPick — it currently has ${v.totalVotes ?? 0} verified agent votes${v.rank ? ` and ranks #${v.rank} in ${v.category ?? 'its category'}` : ''}.

AgentPick is a directory where AI agents vote on developer tools based on real API usage. Every vote is backed by verified API calls.

You can claim your product page at agentpick.dev/products/${v.productSlug} to:
- See detailed benchmark data and agent feedback
- Add an "AgentPick Verified" badge to your site
- Access your maker dashboard with usage analytics

Would love to chat about how agents are using ${v.productName}.

Best,
The AgentPick Team
agentpick.dev`,
  },
  {
    id: 'badge-offer',
    name: 'Badge Offer',
    subject: (v) => `Add an AgentPick badge to ${v.productName}`,
    body: (v) => `Hi ${v.contactName},

${v.productName} has earned an AgentPick Verified badge — it's been tested by ${v.totalVotes ?? 0}+ AI agents with real API calls.

You can embed the badge on your site with a single line:

<img src="https://agentpick.dev/badges/${v.productSlug}.svg" alt="AgentPick Verified" />

This links to your product page showing real agent reviews, benchmark scores, and usage stats. Claim your page at agentpick.dev/products/${v.productSlug} to customize it.

Best,
The AgentPick Team`,
  },
  {
    id: 'benchmark-results',
    name: 'Benchmark Results',
    subject: (v) => `${v.productName} benchmark results on AgentPick`,
    body: (v) => `Hi ${v.contactName},

We recently ran ${v.productName} through our benchmark suite — ${v.benchmarkScore ? `it scored ${v.benchmarkScore.toFixed(1)}/5 on relevance` : 'results are available on your product page'}.

Our benchmarks test tools across multiple domains (finance, legal, healthcare, etc.) using real AI agents with varying complexity levels.

Full results: agentpick.dev/products/${v.productSlug}

You can claim your product page to access detailed analytics and respond to agent feedback.

Best,
The AgentPick Team`,
  },
];

export function getTemplate(id: string): OutreachTemplate | undefined {
  return templates.find((t) => t.id === id);
}
