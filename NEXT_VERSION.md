# NEXT_VERSION.md — AgentPick v0.24 Plan

**Date:** 2026-03-14
**QA Score entering this cycle:** 55/57 (Round 10)
**P0 blockers:** None
**P1 bugs remaining:** 1 production, 1 test-script

---

## Must-Have #1 — Fix deep-research routing misclassification (P1-1)

**Bug:** Analytical/socioeconomic queries (e.g. "comprehensive analysis of global chip shortage causes and solutions with supply chain implications") are misclassified as `type=news, depth=shallow`, routing to `tavily` when `strategy: best_performance` is set. Purely technical queries (quantum computing, etc.) classify correctly. The classifier conflates "news-adjacent topic framing" with "news query type."

**File:** `src/lib/router/ai-classify.ts`

**Fix:**
- Expand the classifier prompt to explicitly distinguish "analytical/policy/socioeconomic framing" from "news framing." Add keyword/pattern rule: if the query contains words like `"analysis"`, `"causes"`, `"implications"`, `"impact of"`, `"effects of"`, `"why did"` combined with multi-factor framing (supply chain, geopolitics, policy), bias classification toward `type=research, depth=deep` regardless of topic domain.
- Do NOT change behavior for queries that are genuinely news-seeking ("what happened with chip shortage today").
- Also fix QA script test `7.5-auth-missing` to explicitly clear the `_dev_key` global before testing the no-auth path, preventing the auto-inject false 200 that caused the QA regression.

**Acceptance:**
- Query `"comprehensive analysis of global chip shortage causes and solutions with supply chain implications"` + `strategy: best_performance` → `tool_used: exa-search` or `perplexity`, `type=research, depth=deep` in trace.
- Existing `6.1-deep-research` test passes 5/5 consecutive runs.
- All other routing tests remain green (no regressions).

---

## Must-Have #2 — Major UI upgrade: glassmorphism design system

**Goal:** Modernize the visual design to reduce bounce rate and increase trial signups from developer audiences (Hacker News, Product Hunt traffic).

**Scope:**
- **Hero section (`/`):** Replace flat card layout with frosted-glass cards (`backdrop-filter: blur(12px)`, semi-transparent borders). Add a subtle animated gradient mesh background (CSS keyframes, no JS dependency). Update typography to `Inter` variable font with tighter tracking on headings.
- **Pricing cards:** Add hover lift animation (`transform: translateY(-4px)` + `box-shadow` transition, 200ms ease). Highlight the "Pro" tier with a gradient border (`border-image` or `outline` + pseudo-element).
- **`/connect` playground:** Add syntax-highlighted code blocks (replace plain `<pre>` with Shiki or Prism). Add a copy-to-clipboard button on all code snippets.
- **Nav:** Add blur-backdrop sticky nav (`backdrop-filter: blur(8px)`). Thin gradient underline on active nav item.
- **Token sheet:** Define CSS custom properties (`--glass-bg`, `--glass-border`, `--accent-gradient`) for system-wide consistency.

---

## Must-Have #3 — SDK usage examples page (`/docs/examples`)

**Goal:** Increase developer adoption by giving devs copy-paste ready code they can run in under 2 minutes — the most common request from the developer trial funnel.

**Spec:**
- New route `/docs/examples` with tabbed layout: Python · Node.js · curl.
- 6 examples covering the highest-traffic use cases: basic search, deep research, real-time news, embedding, finance data, multi-tool fallback.
- Each example shows the full working flow (register → get key → call → parse response), not just the API call.
- Link from homepage hero CTA ("See examples →") and from `/connect` sidebar.
- Static-rendered page for SEO; `og:title` = "AgentPick API Examples — Python, Node.js, curl".
- Each snippet has a copy-to-clipboard button (reuse the component from Must-Have #2).

---

## Out of scope this version

- Benchmark runner internal endpoint (blocked — BENCHMARK_SECRET env config not confirmed)
- Agent leaderboard redesign
- Stripe billing changes
- Any refactoring of passing, untouched code
