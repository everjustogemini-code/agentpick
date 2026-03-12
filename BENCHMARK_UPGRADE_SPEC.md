# Benchmark Upgrade Spec: Professional-Grade Evaluation

**Author:** Pclaw (OpenClaw agent)
**For:** Claude Code to implement
**Priority:** High — 50 agents ready, need credible data before activating

---

## TL;DR

Current benchmark has three weaknesses:
1. **Single evaluator model** (Haiku only) — biased, no cross-validation
2. **Ops runner uses heuristic scoring** (`scoreProbe` in `runner.ts` scores by result count, ignores LLM evaluation)
3. **No difficulty tiers or ground truth** in query sets — can't distinguish easy vs hard queries

This spec fixes all three. Estimated API cost: **~$50-100 to benchmark all 50 agents thoroughly**.

---

## Change 1: Multi-Model Evaluator

### File: `src/lib/benchmark/evaluator.ts`

Replace single Haiku call with 3-model voting. Keep Haiku as primary (cheapest), add GPT-4o-mini and Gemini Flash as secondary judges.

```typescript
// New interface
export interface MultiModelEvaluation {
  relevance: number;      // 0-5, averaged across models
  freshness: number;      // 0-5, averaged
  completeness: number;   // 0-5, averaged
  reasoning: string;      // From primary model
  consensus: number;      // 0-1, how much models agree (1 = unanimous)
  evaluators: Array<{
    model: string;
    relevance: number;
    freshness: number;
    completeness: number;
    reasoning: string;
  }>;
}
```

**Implementation:**
- Call 3 models in parallel with `Promise.allSettled`
- Models: `claude-haiku-4-5` (Anthropic SDK), `gpt-4o-mini` (OpenAI SDK), `gemini-2.0-flash` (Google SDK)
- Average scores; compute consensus = 1 - (max_std_dev across dimensions / 2.5)
- If a model fails, fall back to 2-model average; if 2 fail, use single model
- Same prompt as current `evaluateResult`, just sent to 3 providers

**Required env vars** (already in `.env.local` or add):
- `ANTHROPIC_API_KEY` ✅ exists
- `OPENAI_API_KEY` — add to `.env.local` and Vercel
- `GOOGLE_API_KEY` — add to `.env.local` and Vercel

**Cost:** ~$0.003 per evaluation (3 cheap models). 50 agents × 2 queries × 4 tools × 3 judges = 1200 LLM calls ≈ $3.60 per full sweep.

**Backward compatible:** Keep `evaluateResult()` as a wrapper that calls new `evaluateResultMultiModel()` and returns the averaged `EvaluationResult` shape. Existing callers don't break.

---

## Change 2: Wire LLM Evaluation into Ops Runner

### File: `src/lib/ops/runner.ts`

Current `runBenchmarkAgentNow()` calls `runToolProbe()` and scores with `scoreProbe()` (heuristic: 0 results → 0.2, 3+ → 0.92). This is meaningless.

**Changes:**
1. Import `evaluateResult` from `@/lib/benchmark/evaluator`
2. After `runToolProbe()` returns, if `probe.ok && probe.details`, call `evaluateResult(query, null, probe.details)`
3. Replace `scoreProbe(probe.details)` with `evaluation.relevance / 5` (normalize 0-5 → 0-1)
4. Store evaluation breakdown in result metadata

```typescript
// In the inner loop of runBenchmarkAgentNow:
const probe = await runToolProbe(tool, encryptedKey, query);

let relevance = probe.ok ? scoreProbe(probe.details) : 0; // Keep as fallback
let evaluation = null;

if (probe.ok && probe.details) {
  try {
    evaluation = await evaluateResult(query, null, probe.details);
    relevance = evaluation.relevance / 5; // Normalize to 0-1
  } catch {
    // Fall back to heuristic
  }
}

results.push({
  query,
  tool,
  success: probe.ok,
  latencyMs: probe.latencyMs || null,
  relevance,
  status: probe.status,
  error: probe.error ?? null,
  meta: {
    ...probe.details,
    evaluation: evaluation ?? null,
  },
});
```

**Note:** This makes Ops runner results directly comparable with cron benchmark-run results. Both use LLM evaluation now.

---

## Change 3: Enhanced Query Sets with Difficulty Tiers

### File: `src/lib/ops/constants.ts` + `src/lib/ops/data.ts`

Current `generateQuerySet()` creates flat query lists. Upgrade to tiered queries with expected attributes.

**New QueryItem shape** (extend existing):
```typescript
interface EnhancedQueryItem {
  query: string;
  difficulty: 'easy' | 'medium' | 'hard';
  intent: string;                    // What a good answer should contain
  expectedAttributes?: string[];     // Keywords/facts that should appear
  timeRelevant?: boolean;            // Does freshness matter for this query?
}
```

**Difficulty definitions:**
- **easy** — Factual lookup, single entity, widely indexed. E.g. "What is Stripe's API pricing?"
- **medium** — Requires synthesis, comparison, or filtering. E.g. "Compare Stripe vs Adyen for marketplace payouts in Southeast Asia"
- **hard** — Requires deep context, niche sources, or multi-step reasoning. E.g. "Which payment processors support dynamic currency conversion for Nigerian Naira with PCI DSS Level 1 compliance?"

**Add curated queries per domain.** Replace or supplement `generateQuerySet()` with hand-written queries. Start with 15 per domain (5 easy / 5 medium / 5 hard) for the 4 most important domains: `finance`, `devtools`, `general`, `news`. Other domains can keep auto-generated for now.

Put curated queries in a new file: `src/lib/benchmark/curated-queries.ts`

Example structure:
```typescript
export const CURATED_QUERIES: Record<string, EnhancedQueryItem[]> = {
  finance: [
    {
      query: "What were NVIDIA's Q4 2025 earnings results?",
      difficulty: 'easy',
      intent: 'Recent earnings numbers with revenue, EPS, guidance',
      expectedAttributes: ['revenue', 'earnings', 'guidance', 'Q4'],
      timeRelevant: true,
    },
    {
      query: "Compare the risk-adjusted returns of gold ETFs vs 10-year Treasury bonds over the past 5 years",
      difficulty: 'hard',
      intent: 'Quantitative comparison with Sharpe ratios or similar metrics',
      expectedAttributes: ['Sharpe', 'return', 'volatility'],
      timeRelevant: false,
    },
    // ...
  ],
};
```

**Scoring upgrade in evaluator:** When `expectedAttributes` are provided, add a bonus dimension:
```typescript
// In evaluator prompt, append:
// "COVERAGE: How many of these expected terms/concepts appear in the results? ${expectedAttributes.join(', ')}"
// Score 0-5 for coverage.
```

---

## Change 4: Benchmark Run Schema Enhancement

### File: `prisma/schema.prisma`

Add fields to `BenchmarkRun`:
```prisma
model BenchmarkRun {
  // ... existing fields ...

  // Multi-model evaluation (new)
  evaluatorConsensus  Float?        // 0-1, agreement between judge models
  evaluatorBreakdown  Json?         // Full per-model scores
  coverageScore       Float?        // 0-5, how well expected attributes were covered
  difficulty          String?       // 'easy' | 'medium' | 'hard' (from query)
}
```

Add field to `BenchmarkAgentRun` (Ops system):
```prisma
model BenchmarkAgentRun {
  // ... existing fields ...
  avgConsensus    Float?           // Average evaluator consensus across all tests
}
```

**Migration:** `npx prisma migrate dev --name add-evaluation-fields`

---

## Change 5: Benchmark Run Cron Enhancement

### File: `src/app/api/cron/benchmark-run/route.ts`

Current cron picks 5 agents, 2 queries each, 4 tools each = up to 40 tests per run.

**Upgrade:**
1. Use curated queries when available (prefer them over random DB queries)
2. Ensure at least 1 easy + 1 hard query per agent (not 2 random)
3. Store `difficulty` in BenchmarkRun
4. Log evaluator consensus in response

```typescript
// When selecting queries:
const easyQuery = shuffledQueries.find(q => q.complexity === 'simple');
const hardQuery = shuffledQueries.find(q => q.complexity === 'complex');
const selectedQueries = [easyQuery, hardQuery].filter(Boolean);
// Fall back to random if difficulty tiers don't exist yet
if (selectedQueries.length < 2) {
  selectedQueries.push(...shuffledQueries.slice(0, 2 - selectedQueries.length));
}
```

---

## Change 6: Continuous Arena → Head-to-Head with Consensus

### File: `src/app/api/cron/continuous-arena/route.ts`

Current continuous arena calls tools and stores telemetry but **doesn't evaluate quality**. It's just latency + success tracking.

**Upgrade:**
1. After calling each tool, also call `evaluateResult()` 
2. Store evaluation in telemetry context as JSON
3. For each query, rank tools by (relevance × 0.5 + completeness × 0.3 + freshness × 0.2) and log winner

This creates **head-to-head comparison data** that feeds product rankings with real quality signal, not just uptime.

---

## Implementation Order

1. **evaluator.ts** — Add multi-model support (no other file changes needed, backward compatible)
2. **prisma schema** — Add new fields + migrate
3. **curated-queries.ts** — Create file with 60 curated queries (4 domains × 15)
4. **runner.ts** — Wire LLM eval into Ops runner
5. **benchmark-run/route.ts** — Use difficulty tiers + store consensus
6. **continuous-arena/route.ts** — Add evaluation to arena runs

Each step is independently deployable. Step 1-2 first, then 3-4, then 5-6.

---

## Env Vars Needed

Add to `.env.local` and Vercel:
```
OPENAI_API_KEY=sk-...        # For GPT-4o-mini judge
GOOGLE_API_KEY=AIza...       # For Gemini Flash judge
```

These may already exist in the Ops API key vault (encrypted). If so, the evaluator can optionally read from vault instead of env vars. But env vars are simpler for now.

---

## Cost Estimate (Full Sweep)

| Item | Count | Unit Cost | Total |
|------|-------|-----------|-------|
| Tool API calls (6 tools × 50 agents × 3 queries) | 900 | ~$0.002 | ~$1.80 |
| LLM evaluation (900 × 3 judges) | 2,700 | ~$0.001 | ~$2.70 |
| Total per sweep | | | **~$4.50** |
| Daily (4 cron runs) | | | **~$18/day** |
| Monthly | | | **~$540/mo** |

**Optimization:** Run multi-model evaluation on 20% of tests (random sample), single-model on the rest. Drops to ~$200/mo.

---

## DO NOT Touch

These files are being actively edited by Claude Code for bulk agent management:
- `src/app/admin/ops/(console)/agents/page.tsx`
- `src/lib/ops/client.tsx`  
- `src/app/api/admin/ops/agents/bulk/`

Stay away from those files in this PR.
