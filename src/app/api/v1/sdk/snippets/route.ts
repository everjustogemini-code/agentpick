import { NextResponse } from 'next/server';

const SNIPPETS = {
  python: {
    install: 'pip install agentpick',
    example: `from agentpick import AgentPick

ap = AgentPick(api_key="YOUR_KEY", strategy="auto")
results = ap.search("SEC filings NVDA 2025")
# Returns: tool_used, latency_ms, results[]
print(results)`,
  },
  typescript: {
    install: '# no install needed — uses fetch',
    example: `interface RouteResult {
  tool_used: string;
  latency_ms: number;
  results: unknown[];
}

const res = await fetch('https://agentpick.dev/api/v1/route/search', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: 'latest AI benchmarks 2026', strategy: 'auto' }),
});
const data = (await res.json()) as RouteResult;
console.log(data.tool_used, data.latency_ms);`,
  },
  curl: {
    install: '',
    example: `curl -X POST https://agentpick.dev/api/v1/route/search \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "latest AI benchmarks 2026", "strategy": "auto"}'`,
  },
  go: {
    install: '# stdlib only — no external dependencies',
    example: `package main

import (
\t"bytes"
\t"encoding/json"
\t"fmt"
\t"net/http"
)

func main() {
\tbody, _ := json.Marshal(map[string]string{
\t\t"query":    "latest AI benchmarks 2026",
\t\t"strategy": "auto",
\t})
\treq, _ := http.NewRequest("POST",
\t\t"https://agentpick.dev/api/v1/route/search",
\t\tbytes.NewBuffer(body))
\treq.Header.Set("Authorization", "Bearer YOUR_KEY")
\treq.Header.Set("Content-Type", "application/json")
\tclient := &http.Client{}
\tresp, err := client.Do(req)
\tif err != nil { panic(err) }
\tdefer resp.Body.Close()
\tvar result map[string]interface{}
\tjson.NewDecoder(resp.Body).Decode(&result)
\tfmt.Println(result["tool_used"], result["latency_ms"])
}`,
  },
} as const;

export async function GET() {
  return NextResponse.json(SNIPPETS, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
