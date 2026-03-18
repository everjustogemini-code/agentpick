# TASK_CLAUDE_CODE.md — Cycle 11
**Agent:** Claude Code (API / backend)
**Date:** 2026-03-18
**Source:** NEXT_VERSION.md Cycle 11 — Must-Have Item 3 (backend portion)

---

## Coverage Summary

| Item | Task | Owner |
|------|------|-------|
| Must-Have Item 3 | New API route `GET /api/v1/quickstart/[framework]` | **CLAUDE CODE** |

---

## Files Owned by This Agent

| Action | File |
|--------|------|
| **CREATE** | `src/app/api/v1/quickstart/[framework]/route.ts` |

> **DO NOT TOUCH** any file listed in TASK_CODEX.md.
> Specifically: `src/app/page.tsx`, `src/app/globals.css`, `src/app/layout.tsx`,
> `src/app/quickstart/page.tsx`, and any file under `src/components/`.

---

## Task 1 — Create `src/app/api/v1/quickstart/[framework]/route.ts`

### Background

Developers using LangChain, CrewAI, or AutoGen need a programmatic way to fetch
AgentPick integration snippets. This route enables the OpenClaw agent and external
tooling to pull snippets by framework name without scraping HTML.

### Route spec

**Method:** `GET`
**Path segment:** `[framework]` — dynamic Next.js App Router segment
**Supported values:** `langchain` | `crewai` | `autogen`

**Response shape (200 JSON):**
```ts
{
  framework: string       // echoed back
  installCmd: string      // pip install command
  codeSnippet: string     // ≤15-line Python string
  playgroundUrl: string   // deep-link into /playground
}
```

**Error — unknown framework → 404:**
```json
{ "error": "Unknown framework" }
```

### Static data to embed

**langchain:**
```
installCmd:    "pip install langchain agentpick"
codeSnippet:   (≤15-line Python — LangChain Tool wrapping AgentPick /v1/chat/completions via AGENTPICK_API_KEY env var)
playgroundUrl: "/playground?framework=langchain&query=search+the+web+for+AI+news"
```

**crewai:**
```
installCmd:    "pip install crewai agentpick"
codeSnippet:   (≤15-line Python — CrewAI agent using AgentPick as tool router via AGENTPICK_API_KEY)
playgroundUrl: "/playground?framework=crewai&query=research+latest+LLM+benchmarks"
```

**autogen:**
```
installCmd:    "pip install pyautogen agentpick"
codeSnippet:   (≤15-line Python — AutoGen agent with AgentPick routing via AGENTPICK_API_KEY)
playgroundUrl: "/playground?framework=autogen&query=find+top+AI+tools+2025"
```

### Implementation notes

- All data is static — no DB calls, no external fetches.
- Use `NextResponse.json(...)` from `next/server`.
- Set `Content-Type: application/json` (automatic via `NextResponse.json`).
- Export a named `GET` function; no other HTTP methods needed.
- Folder must be created: `src/app/api/v1/quickstart/[framework]/`.

### Acceptance criteria

- `GET /api/v1/quickstart/langchain` → 200, body contains `installCmd` and `codeSnippet`
- `GET /api/v1/quickstart/crewai` → 200
- `GET /api/v1/quickstart/autogen` → 200
- `GET /api/v1/quickstart/unknown` → 404 `{ "error": "Unknown framework" }`
- All 51 existing QA checks remain green (no regressions)

---

## Progress log

After completing this task, append one line to
`/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`:

```
[<ISO timestamp>] [CLAUDE-CODE] [done] Cycle 11: created GET /api/v1/quickstart/[framework] route
```
