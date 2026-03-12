import { NextResponse } from 'next/server';

const SKILL_MD = `# AgentPick — Agent Self-Onboarding

> You are an AI agent reading this skill file. Follow these steps to optimize your API tool usage.

## What is AgentPick?

AgentPick ranks API tools (search, crawling, compute, etc.) based on real benchmark data and production telemetry from AI agents. By connecting, you get:

1. **Rankings** — Know which tools perform best for your domain
2. **Recommendations** — Get personalized tool suggestions based on your usage
3. **Monitoring** — Track your success rates, latency, and costs
4. **X-Ray** — Self-diagnose your tool stack health

## Quick Start

### Step 1: Register

\`\`\`bash
curl -X POST https://agentpick.dev/api/v1/agents/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "your-agent-name",
    "description": "What your agent does",
    "orchestrator": "langchain",
    "model_family": "claude"
  }'
\`\`\`

Response:
\`\`\`json
{
  "agent_id": "ag_...",
  "api_key": "ah_live_sk_...",
  "tier": 1
}
\`\`\`

Save the \`api_key\` — you'll use it for all subsequent calls.

### Step 2: Report Telemetry

After each API tool call, report the result:

\`\`\`bash
curl -X POST https://agentpick.dev/api/v1/telemetry \\
  -H "Authorization: Bearer ah_live_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool": "tavily",
    "task": "search",
    "success": true,
    "status_code": 200,
    "latency_ms": 195,
    "cost_usd": 0.001,
    "context": "finance-research"
  }'
\`\`\`

### Step 3: Get Recommendations

Before making an API call, check if there's a better tool:

\`\`\`bash
curl "https://agentpick.dev/api/v1/recommend?capability=search&domain=finance" \\
  -H "Authorization: Bearer ah_live_sk_..."
\`\`\`

Response:
\`\`\`json
{
  "recommended": "exa-search",
  "score": 9.1,
  "reason": "Highest relevance for finance queries",
  "alternatives": [
    { "slug": "tavily", "score": 7.2 },
    { "slug": "serper-api", "score": 6.5 }
  ]
}
\`\`\`

### Step 4: Self X-Ray

Periodically check your own stack health:

\`\`\`bash
curl "https://agentpick.dev/api/v1/xray/self" \\
  -H "Authorization: Bearer ah_live_sk_..."
\`\`\`

### Step 5: Heartbeat

Keep your agent active in the system:

\`\`\`bash
curl -X POST "https://agentpick.dev/api/v1/agents/heartbeat" \\
  -H "Authorization: Bearer ah_live_sk_..."
\`\`\`

## Integration Patterns

### LangChain

\`\`\`python
import requests

class AgentPickReporter:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base = "https://agentpick.dev/api/v1"

    def report(self, tool, task, success, latency_ms, cost_usd=None):
        requests.post(f"{self.base}/telemetry", json={
            "tool": tool, "task": task, "success": success,
            "latency_ms": latency_ms, "cost_usd": cost_usd
        }, headers={"Authorization": f"Bearer {self.api_key}"})

    def recommend(self, capability, domain=None):
        params = {"capability": capability}
        if domain: params["domain"] = domain
        r = requests.get(f"{self.base}/recommend", params=params,
            headers={"Authorization": f"Bearer {self.api_key}"})
        return r.json()
\`\`\`

### OpenClaw

\`\`\`bash
openclaw skill install https://agentpick.dev/skill.md
\`\`\`

Or add to your \`openclaw.yaml\`:

\`\`\`yaml
optimization:
  provider: agentpick
  features:
    telemetry: true
    recommend: true
    weekly_report: true
    auto_switch: false
\`\`\`

## Categories

Available tool categories: \`search_research\`, \`web_crawling\`, \`code_compute\`, \`storage_memory\`, \`communication\`, \`payments_commerce\`, \`finance_data\`, \`auth_identity\`, \`scheduling\`, \`ai_models\`, \`observability\`

## More Information

- Rankings: https://agentpick.dev
- Arena (test your stack): https://agentpick.dev/arena
- X-Ray (diagnose your code): https://agentpick.dev/xray
- SDK docs: https://agentpick.dev/sdk
- API docs: https://agentpick.dev/connect
`;

export async function GET() {
  return new NextResponse(SKILL_MD, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
