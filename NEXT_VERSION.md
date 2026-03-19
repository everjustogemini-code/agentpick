# NEXT_VERSION.md
**Date:** 2026-03-19
**PM:** AgentPick PM (claude-sonnet-4-6)
**QA baseline:** QA_REPORT.md (2026-03-19) — score **55/56** | P0: none | P1: 1 open
**Priority rule:** P1 bug fix first, then UI upgrade, then new feature.

---

## Must-Have #1 — Fix P1: Explicit `capability` param must win over AI classifier

**QA reference:** QA_REPORT.md P1 Issue #1 (B.1-embed)

**Two changes required:**

**1a — Router fix** (`src/lib/router/index.ts`, `routeRequest()`): After every call to `aiRoute()`, filter the returned tool list to only tools valid for the requested `capability`. Explicit capability must never be overridden by AI classification output. Target locations: ~line 457 (main auto path) and ~line 468 (`best_performance` branch).
```typescript
if (aiRankedTools) {
  const allowed = new Set(CAPABILITY_TOOLS[capability] ?? []);
  aiRankedTools = aiRankedTools.filter((t) => allowed.has(t));
  if (aiRankedTools.length === 0) aiRankedTools = undefined;
}
```

**1b — QA script fix** (`/Users/pwclaw/.openclaw/workspace/agentpick-router-qa.py`): Update stale valid-tools list — replace `"voyage-ai"` with `"voyage-embed"`.

**Acceptance:**
- `POST /api/v1/router/search` with `capability: "embed"` returns `meta.tool_used: "voyage-embed"` regardless of query text — never `tavily`
- QA B.1-embed passes; full suite score 56/56

---

## Must-Have #2 — Major UI Upgrade: Glassmorphism design system

**Scope:** Homepage, /connect, /dashboard, /products/* pages.

**Specifics:**
- **Typography:** Inter (headings) + JetBrains Mono (code). Hero text ≥56px desktop, bold weight.
- **Color palette:** Background `#0A0E1A` (deep navy), accent `#6366F1` (electric indigo), highlight `#22D3EE` (cyan).
- **Glass cards:** `backdrop-filter: blur(12px)`, `background: rgba(255,255,255,0.08)`, `border: 1px solid rgba(255,255,255,0.15)`, `border-radius: 16px`.
- **Animations:** CSS `@keyframes` fade-in-up on scroll for sections/cards. Hover lift (`transform: translateY(-4px) + box-shadow`) on tool cards and CTAs. Hero section shimmer or animated gradient.
- **Code blocks:** Syntax-highlighted dark theme with one-click copy button.

**Acceptance:** Lighthouse perf ≥85. All existing QA page/content checks pass (no content removed or broken).

---

## Must-Have #3 — New Feature: Interactive "Try it live" console on /connect

**Goal:** Reduce time-to-first-call. Developers see a real response before registering.

**Specifics:**
- Tabbed snippet block showing Python, Node.js, and cURL one-liners — pre-filled with working example query and `YOUR_API_KEY` placeholder. Copy button on each tab.
- Inline "Try it live" panel below snippets: text input for query, capability dropdown (search/embed/crawl), "Run" button. Calls `POST /api/v1/router/search` with a shared IP-limited demo key. Response JSON rendered formatted in the panel.
- Demo key rate limit: 10 requests/hour per IP. After any response, show inline CTA: "Get your own key →" linking to /connect#register.
- No external JS libraries — vanilla fetch or existing framework only.

**Acceptance:**
- All three language tabs render correct, copyable code
- "Try it live" panel returns real API JSON within 5s on a typical connection
- Demo key rejects >10/hr per IP with a user-friendly message (not a raw 429)
- /connect QA suite 7/7 still passes

## Out of Scope This Cycle
- Benchmark runner internal endpoint — no P0 dependency, deferred
- New tool integrations
- Pricing page changes
