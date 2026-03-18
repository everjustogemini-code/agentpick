# TASK_CLAUDE_CODE.md — Cycle 3
**Agent:** Claude Code (API / backend / config)
**Date:** 2026-03-18
**Source:** NEXT_VERSION.md Cycle 3

---

## Coverage Summary

| NEXT_VERSION.md Item | Task | Owner |
|---|---|---|
| P2 — Dead endpoint 301 redirects | Add redirects in `next.config.ts` | **CLAUDE CODE** |
| P1-A — SDK wrapper types wrong shape | Fix response types in `src/lib/router/sdk.ts` | **CLAUDE CODE** |
| Item 3 — Quickstart API route | Create `src/app/api/v1/quickstart/[framework]/route.ts` | **CLAUDE CODE** |

---

## Files Owned by This Agent

| Action | File |
|---|---|
| **MODIFY** | `next.config.ts` |
| **MODIFY** | `src/lib/router/sdk.ts` |
| **CREATE** | `src/app/api/v1/quickstart/[framework]/route.ts` |

> **DO NOT TOUCH** any file listed in TASK_CODEX.md.
> Specifically: `src/app/page.tsx`, `src/app/globals.css`, `src/app/layout.tsx`,
> `src/app/connect/page.tsx`, `src/components/Playground.tsx`,
> `src/app/quickstart/page.tsx`, and any arena/pricing component files.

---

## Task 1 — P2: Add 301 Redirects for Dead Endpoints

**Bug:** `/api/v1/account/usage` and `/api/v1/developer/usage` return 404. Correct path is `/api/v1/router/usage`.

**File:** `next.config.ts`

Read the current file first, then add an `async redirects()` method inside `nextConfig`:

```ts
async redirects() {
  return [
    {
      source: '/api/v1/account/usage',
      destination: '/api/v1/router/usage',
      permanent: true,   // HTTP 301
    },
    {
      source: '/api/v1/developer/usage',
      destination: '/api/v1/router/usage',
      permanent: true,   // HTTP 301
    },
  ];
},
```

Place it alongside the existing `headers()` method in the same `nextConfig` object.

**Acceptance:**
- `GET /api/v1/account/usage` → 301 with `Location: /api/v1/router/usage`
- `GET /api/v1/developer/usage` → 301 with `Location: /api/v1/router/usage`
- Existing security headers remain unchanged.

---

## Task 2 — P1-A: Fix SDK Response Types to Match Actual `meta`/`data` Shape

**Bug:** `src/lib/router/sdk.ts` contains response types/interfaces that have top-level `tool`, `results`, or `tool_used` keys. Actual API response is:
```json
{
  "meta": { "tool_used": "...", "latency_ms": 120, "cost_usd": 0.001, "ai_classification": "...", "calls_remaining": 99 },
  "data": { "results": [...] }
}
```

**File:** `src/lib/router/sdk.ts`

**Actions:**
1. Grep file for any interface/type that declares `tool?:`, `results?:`, `tool_used?:` at the response root level.
2. Replace with the correct two-level structure:

```ts
// Replace flat response type with:
export interface RouterResponseMeta {
  tool_used: string;
  latency_ms: number;
  cost_usd: number;
  /** null when strategy !== 'auto' */
  ai_classification: string | null;
  calls_remaining: number;
}

export interface RouterResponse {
  meta: RouterResponseMeta;
  data: {
    results: SearchResult[];
  };
}
```

3. Find any code in `sdk.ts` that reads `response.tool` or `response.results` at the top level — update those references to `response.meta.tool_used` and `response.data.results`.
4. Export the updated interfaces so frontend code can import them.

**Acceptance:**
- No exported type in `sdk.ts` has top-level `tool` or `results` on a response object.
- `RouterResponse` (or equivalent name) uses `meta` + `data` nesting.
- TypeScript compilation passes with no new type errors.

---

## Task 3 — Item 3: New `GET /api/v1/quickstart/[framework]` Route

**New file:** `src/app/api/v1/quickstart/[framework]/route.ts`

Create the directory `src/app/api/v1/quickstart/[framework]/` and the file `route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';

const SNIPPETS: Record<string, {
  installCmd: string;
  codeSnippet: string;
  playgroundUrl: string;
}> = {
  langchain: {
    installCmd: 'pip install langchain agentpick',
    codeSnippet: `import os
from langchain.tools import tool
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url="https://agentpick.com/v1",
    api_key=os.environ["AGENTPICK_API_KEY"],
    model="auto",
)
response = llm.invoke("Search the web for AI news")
print(response.content)`,
    playgroundUrl: '/playground?framework=langchain&query=search+the+web+for+AI+news',
  },
  crewai: {
    installCmd: 'pip install crewai agentpick',
    codeSnippet: `import os
from crewai import Agent, Task, Crew, LLM

llm = LLM(
    model="openai/auto",
    base_url="https://agentpick.com/v1",
    api_key=os.environ["AGENTPICK_API_KEY"],
)
researcher = Agent(role="Researcher", goal="Find information", llm=llm,
                   backstory="Expert researcher")
task = Task(description="Research latest LLM benchmarks", agent=researcher,
            expected_output="Summary")
crew = Crew(agents=[researcher], tasks=[task])
result = crew.kickoff()`,
    playgroundUrl: '/playground?framework=crewai&query=research+latest+LLM+benchmarks',
  },
  autogen: {
    installCmd: 'pip install pyautogen agentpick',
    codeSnippet: `import os
from autogen import AssistantAgent

config_list = [{
    "model": "auto",
    "base_url": "https://agentpick.com/v1",
    "api_key": os.environ["AGENTPICK_API_KEY"],
}]
assistant = AssistantAgent(
    name="assistant",
    llm_config={"config_list": config_list},
)
assistant.initiate_chat(assistant,
    message="Find top AI tools 2025", max_turns=1)`,
    playgroundUrl: '/playground?framework=autogen&query=find+top+AI+tools+2025',
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { framework: string } }
) {
  const key = params.framework.toLowerCase();
  const snippet = SNIPPETS[key];
  if (!snippet) {
    return NextResponse.json(
      { error: 'Unknown framework. Valid values: langchain, crewai, autogen' },
      { status: 404 }
    );
  }
  return NextResponse.json({ framework: key, ...snippet });
}
```

**Acceptance:**
- `GET /api/v1/quickstart/langchain` → 200 JSON with `installCmd`, `codeSnippet`, `playgroundUrl`.
- `GET /api/v1/quickstart/crewai` → 200 JSON.
- `GET /api/v1/quickstart/autogen` → 200 JSON.
- `GET /api/v1/quickstart/unknown` → 404 JSON `{ "error": "..." }`.
- All 51 existing QA checks remain green.

---

## Verification Checklist (Claude Code)

- [ ] `next.config.ts` — both 301 redirects added; app compiles; existing headers intact.
- [ ] `src/lib/router/sdk.ts` — no flat `tool`/`results` response types; `meta` + `data` shape used; TypeScript passes.
- [ ] `src/app/api/v1/quickstart/[framework]/route.ts` — created; all three frameworks return 200; unknown returns 404.
- [ ] Zero files from CODEX's list were modified.

---

## Progress Log

After completing all tasks, append to `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:
```
[<ISO timestamp>] [CLAUDE-CODE] [done] Cycle 3: 301 redirects, SDK response types fixed, /api/v1/quickstart/[framework] route created
```
