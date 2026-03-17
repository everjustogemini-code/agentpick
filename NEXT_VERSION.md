# NEXT_VERSION.md
**Date:** 2026-03-17
**Prepared by:** AgentPick PM — fresh plan post cycle 8
**QA Source:** QA_REPORT.md cycle 8 — 51/51 PASS, zero P1/P2 bugs
**Cycle 8 shipped:** Rate limit 429 regression test, UI upgrades (+596/-450 lines frontend), rate limit handler hardening

---

## P1/P2 Status

**Zero bugs.** Cycle 8 QA is 51/51 PASS. The rate-limit 429 regression test shipped in cycle 8.
The only non-blocking issue is `ci.yml` removal (GitHub token lacks `workflow` scope) — fix
is a one-time repo secret update, not a code change.

---

## Must-Have #1 — Restore CI: Add `workflow` Scope to GitHub Token

**Rule:** No P1s ship with code-only fixes — this one is a repo configuration change, but it
must be done before the next coding cycle so rate-limit regression coverage runs automatically.

**What happened:** Cycle 8 added the 429 regression test but had to delete `ci.yml` because
the GitHub OAuth token lacks `workflow` scope. The test exists; CI just doesn't run it.

**Required action (no code change):**
- In GitHub repo Settings → Developer settings → Personal access tokens, regenerate or create
  a token with `workflow` scope added.
- Re-add `.github/workflows/ci.yml` (already written and deleted in cycle 8 — restore from
  commit `d2238178`'s parent) with `on: push: branches: [main]` trigger.
- Confirm the rate-limit 429 test appears in the next CI run and passes.

**Acceptance criteria:**
- `ci.yml` present on `main`, CI runs on next push, all 51 tests pass in CI
- No manual-only coverage for the 429 path

---

## Must-Have #2 — Major UI Upgrade: Dark-First Glassmorphism + Motion

**Context:** Cycle 8 shipped +596/-450 lines of UI changes but the design is still
inconsistent. The homepage mixes light/dark surfaces, typography is undersized, and there are
no entrance animations. Competing dev tools (Vercel, Resend, Upstash) ship immersive animated
pages — this upgrade makes AgentPick feel premium and shareable.

**Required changes (zero new npm packages — pure CSS/Tailwind):**

### Global
- `src/app/globals.css`: root background `#08090d` (not `#fafafa`). All pages inherit this.
- Animated slow-drift radial gradient mesh as a `::before` pseudo-element on `<body>`
  (`@keyframes`, 20s cycle, opacity 0.4, no JS/canvas, zero CLS)

### Navigation (`SiteHeader`)
- `backdrop-filter: blur(12px)` glass bar on scroll (add `scrolled` class via `useEffect`)
- Pulsing green dot next to logo (2px circle, CSS `@keyframes pulse`, signals live system)
- Active page: 2px bottom border in accent color (not just text-color change)

### Cards & Panels (`ProductCard`, `ScoreBreakdown`, `StrategyCards`, `PricingSection`)
- Glass treatment: `backdrop-blur-xl bg-white/5 border border-white/10 shadow-xl`
- Hover: `translate-y-[-2px] shadow-2xl transition-transform duration-200`

### Typography (`page.tsx` hero)
- Hero `h1`: `clamp(2.5rem, 6vw, 4.5rem)` + gradient text
  `bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent`
- Section eyebrows: `font-mono tracking-widest text-xs uppercase opacity-50`

### Animations
- Hero stat counters (agent count, calls routed, votes): count-up from 0 on first viewport
  entry via `IntersectionObserver` + `requestAnimationFrame`, 800ms ease-out
- "Get API Key" CTA: glow pulse on hover `shadow-[0_0_32px_rgba(99,102,241,0.6)]`
- Score bars on leaderboard: red→yellow→green CSS gradient fill (not solid)
- One-click copy on code snippets with "Copied ✓" tooltip (200ms fade)

**Acceptance criteria:**
- Lighthouse Performance ≥ 90 mobile (no regression from current)
- All 51+ QA tests still pass
- No CLS on 375px viewport
- All motion wrapped in `@media (prefers-reduced-motion: no-preference)`

---

## Must-Have #3 — New Feature: OpenAI-Compatible `/v1/chat/completions` Routing Endpoint

**Why this drives developer adoption:** Developers already have `openai.chat.completions.create()`
calls in production. Pointing `baseURL: "https://agentpick.dev/v1"` at AgentPick gives
intelligently routed responses with **zero SDK changes**. This is the growth mechanic that
made Groq, Together AI, and Fireworks explode — frictionless drop-in adoption.

**Spec:**

```
POST /v1/chat/completions
Authorization: Bearer <agentpick-router-key>
Content-Type: application/json

{
  "model": "agentpick/auto",   // or "agentpick/search", "agentpick/finance", etc.
  "messages": [{"role": "user", "content": "What is the AAPL stock price?"}],
  "stream": false
}
```

Response shape matches OpenAI exactly:
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1710000000,
  "model": "agentpick/auto",
  "choices": [{"index": 0, "message": {"role": "assistant", "content": "..."}, "finish_reason": "stop"}],
  "usage": {"prompt_tokens": 12, "completion_tokens": 80, "total_tokens": 92},
  "x-agentpick-tool": "polygon-io",
  "x-agentpick-latency-ms": 312
}
```

- AgentPick inspects `messages[-1].content`, infers domain/capability, routes via existing
  `routeToBestTool()` logic — no new routing code.
- `model: "agentpick/auto"` = fully automatic. `model: "agentpick/search"` pins capability.
- `stream: true` supported via SSE (`data: {"choices":[{"delta":{"content":"..."}}]}`).
- Auth reuses existing `validateApiKey()` — no new auth surface.
- Usage metered identically to `/api/v1/route/*` calls — no new billing logic.
- Non-tool queries (code, general LLM) fall through to a configurable default model.

**Files:**
- `src/app/v1/chat/completions/route.ts` — POST handler (new file)
- `src/lib/openai-compat.ts` — request normalizer + response shaper (new file)
- `src/components/HeroCodeBlock.tsx` — swap hero snippet to the OpenAI drop-in 3-liner
- `public/llms.txt` — document new endpoint

**Acceptance criteria:**
- `openai.chat.completions.create({ baseURL: "https://agentpick.dev/v1", ... })` returns a
  valid response with no OpenAI SDK modification
- `stream: true` returns valid SSE chunks
- QA suite adds 3 new tests for `/v1/chat/completions` (normal, stream, bad key → 401)
- Hero code block shows the OpenAI drop-in snippet (not custom SDK)

---

## Ship Order

```
1. Must-Have #1 — Restore ci.yml + workflow scope   (repo config, 15 min)
                                                      ↓
2. Must-Have #2 — Glassmorphism UI upgrade           (pure frontend, parallel-safe)
                                                      ↓
3. Must-Have #3 — OpenAI-compat endpoint             (after #1 CI is green)
```

**Rule:** Must-Have #3 merges only after CI is confirmed green on `main`.
