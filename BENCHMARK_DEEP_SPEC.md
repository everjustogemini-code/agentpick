# Benchmark Deep Spec: 做细每个产品 & 对比

**策略：收缩，不扩品类。把现有 6 个搜索 tool 的测试做到行业最专业水平。**

---

## 核心问题

现在 benchmark cron 随机选 query × 随机选 tool，导致：
1. 同一个 query 不一定跑了所有 6 个 tool → 无法做 controlled comparison
2. 产品页只看到 run list，没有聚合洞察
3. Compare 页有表格但没有 same-query side-by-side

## Change 1: Controlled Benchmark Runs（最关键）

### 改 `src/app/api/cron/benchmark-run/route.ts`

每次 cron 触发，不再随机选 tool。改为：

**每个 query 必须跑完全部 6 个 benchmarkable tool。**

```
一次 cron run:
  选 3 个 query（不同 domain + difficulty）
  每个 query → Tavily + Exa + Serper + Brave + Jina + Firecrawl
  = 18 次 API 调用 + 18 次 LLM 评审
  成本 ≈ $0.054（API）+ $0.018（Haiku eval）= ~$0.07/run
```

**关键：给每批次一个 `batchId`**（UUID），这样同一批次的 runs 可以关联起来做 side-by-side 对比。

### Schema 改动

```prisma
model BenchmarkRun {
  // ... existing fields ...
  batchId    String?    // Groups runs from the same query across all tools
  
  @@index([batchId])
}
```

### 逻辑

```typescript
// pseudocode for new cron logic
const queries = pickQueries(3); // 1 easy + 1 medium + 1 hard, varied domains
const tools = BENCHMARKABLE_SLUGS; // ALL 6 tools, not random subset
const batchId = crypto.randomUUID();

for (const query of queries) {
  // Run all tools for this query IN PARALLEL
  const results = await Promise.allSettled(
    tools.map(slug => callToolAPI(slug, query.query))
  );
  
  // Evaluate all results
  for (let i = 0; i < tools.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      const evaluation = await evaluateResult(query.query, query.intent, result.value.response);
      await prisma.benchmarkRun.create({
        data: {
          batchId,
          benchmarkAgentId: agent.id,
          queryId: query.id,
          productId: productMap[tools[i]],
          query: query.query,
          // ... result + evaluation fields
        }
      });
    }
  }
}
```

**并行跑所有 tool 还有一个好处：latency 对比更公平，同一时间段的网络条件相同。**

---

## Change 2: 产品 Benchmark 页做细

### 改 `src/app/products/[slug]/benchmarks/page.tsx`

从 run list 升级为 **产品分析仪表板**：

#### Section 1: Overview Cards
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Avg Latency │ │ Success Rate │ │ Avg Relevance│ │   Cost/Call  │
│    342ms     │ │    96.2%     │ │    3.8/5     │ │   $0.001     │
│   ↓12% vs   │ │   ↑2% vs    │ │   Same as    │ │   Cheapest   │
│   category   │ │   category   │ │   category   │ │   in category│
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

每个指标跟 **同 category 平均值** 对比，用户一眼看出这个产品在哪方面强/弱。

#### Section 2: Performance by Domain
```
Domain      Relevance   vs Category Avg    Tests
──────────────────────────────────────────────────
Finance       4.2/5        +0.6 ★           28
DevTools      3.9/5        +0.3             22
News          3.1/5        -0.5 ⚠️           18
Science       4.0/5        +0.4             15
```

哪些领域这个 tool 最强，哪些领域弱，一目了然。

#### Section 3: Latency Distribution
一个简单的柱状图（纯 CSS 或 SVG，不加重依赖）：
- P50 / P75 / P95 / P99 latency
- 跟 category 中其他 tool 的中位数画一条参考线

#### Section 4: Category Ranking
```
#2 in Search & Research
  Ahead of: Serper (3.4/5), Brave (3.2/5), Jina (2.8/5)
  Behind: Exa (4.1/5)
  Similar to: Firecrawl (3.7/5)
```

#### Section 5: Recent Test Runs（保留现有列表，但加 batchId 链接）
点 batchId 跳到 side-by-side view：这个 query 所有 6 个 tool 的结果对比。

---

## Change 3: Compare 页加 Same-Query Side-by-Side

### 改 `src/app/compare/[slugs]/page.tsx`

现有 head-to-head 表格保留。在下方加一个新 section：

#### "Same Query Results" Section

从 BenchmarkRun 中找到两个产品都跑过的 **同一 batchId** 的 query，展示 side-by-side：

```
Query: "SEC filings for NVDA Q4 2025"
Domain: finance | Difficulty: medium

┌─ Tavily ────────────────┐  ┌─ Exa ──────────────────────┐
│ Latency: 280ms          │  │ Latency: 450ms             │
│ Results: 8              │  │ Results: 5                 │
│ Relevance: 4.2/5        │  │ Relevance: 4.5/5           │
│ Freshness: 4.0/5        │  │ Freshness: 3.5/5           │
│ Completeness: 3.8/5     │  │ Completeness: 4.2/5        │
│                         │  │                            │
│ "Good coverage of recent│  │ "Found primary SEC source  │
│  filings but mixed with │  │  directly, fewer but more  │
│  news articles"         │  │  targeted results"         │
│  — Claude Haiku         │  │  — Claude Haiku            │
└─────────────────────────┘  └────────────────────────────┘
```

**这才是真正有说服力的对比**——开发者能看到同一个 query 下两个 tool 返回了什么，evaluator 怎么评的。

### 实现

```typescript
// Find shared batches between two products
const sharedBatches = await prisma.$queryRaw`
  SELECT DISTINCT a."batchId", a.query, a.domain, a.complexity
  FROM "BenchmarkRun" a
  JOIN "BenchmarkRun" b ON a."batchId" = b."batchId"
  WHERE a."productId" = ${productA.id}
    AND b."productId" = ${productB.id}
    AND a."batchId" IS NOT NULL
  ORDER BY a."batchId" DESC
  LIMIT 10
`;

// For each batch, get both products' results
for (const batch of sharedBatches) {
  const [runA, runB] = await Promise.all([
    prisma.benchmarkRun.findFirst({
      where: { batchId: batch.batchId, productId: productA.id }
    }),
    prisma.benchmarkRun.findFirst({
      where: { batchId: batch.batchId, productId: productB.id }
    }),
  ]);
  // Render side-by-side
}
```

---

## Change 4: Batch Replay 页

### 新建 `src/app/benchmarks/batch/[batchId]/page.tsx`

一个 batchId 页面，展示同一个 query 下所有 6 个 tool 的结果。
类似 Arena 的 replay，但是 1-vs-all。

```
Query: "Compare Stripe vs Adyen for marketplace payouts"
Domain: finance | Difficulty: hard | Tested: Mar 12, 2026

Tool         Latency  Relevance  Freshness  Completeness  Cost
────────────────────────────────────────────────────────────────
Exa           450ms     4.5        3.5         4.2        $0.003  ★ Winner
Tavily        280ms     4.2        4.0         3.8        $0.001  ★ Fastest
Firecrawl    1200ms     3.9        3.0         4.0        $0.005
Serper        180ms     3.4        3.5         2.8        $0.001
Brave         220ms     3.2        4.2         2.5        $0.003
Jina         2100ms     2.8        2.0         3.0        $0.002

Evaluator Notes:
Exa: "Found Stripe and Adyen documentation pages directly..."
Tavily: "Good mix of comparison articles but some outdated..."
```

**SEO 价值高**：`/benchmarks/batch/xxx` 可以被搜索引擎收录，每个都是独特内容。

---

## Change 5: 产品页加 "How It Compares" Section

### 改 `src/app/products/[slug]/page.tsx`

在现有产品页底部加一个 quick comparison section：

```
How Tavily compares to alternatives
──────────────────────────────────────────
           Tavily   Exa    Serper  Brave
Relevance   3.8     4.1     3.4    3.2
Latency    280ms   450ms   180ms  220ms
Success    96.2%   94.8%   97.1%  95.5%
Cost/call  $0.001  $0.003  $0.001 $0.003

Best for: Fast, affordable general search
Weaker at: Deep finance research (Exa better)

[Compare with Exa →] [Compare with Serper →]
```

数据从 BenchmarkRun 聚合。只展示同 category 的产品。

---

## Implementation Order

1. **Schema migration** — 加 `batchId` 字段（5 min）
2. **benchmark-run cron** — 改为 controlled runs，所有 tool 跑同一 query（30 min）
3. **产品 benchmark 页** — 升级为分析仪表板（1-2h）
4. **Compare 页** — 加 same-query side-by-side（1h）
5. **Batch replay 页** — 新建（1h）
6. **产品页** — 加 "How It Compares" section（30 min）

全部完成后，每跑一次 cron（3 queries × 6 tools = 18 tests），自动产生：
- 3 个 batch replay 页（可分享的对比页面）
- 每个产品的分析数据更新
- Compare 页新增 3 组 same-query 对比

**Cost：每次 cron ≈ $0.07，每天跑 10 次 = $0.70/天 = $21/月**

---

## Files to Create/Modify

**New files:**
- `src/app/benchmarks/batch/[batchId]/page.tsx`
- `src/lib/benchmark/curated-queries.ts`

**Modify:**
- `prisma/schema.prisma` — add batchId
- `src/app/api/cron/benchmark-run/route.ts` — controlled runs
- `src/app/products/[slug]/benchmarks/page.tsx` — analytics dashboard
- `src/app/products/[slug]/page.tsx` — add comparison section
- `src/app/compare/[slugs]/page.tsx` — add same-query section

**DO NOT touch (Claude Code active):**
- `src/app/admin/ops/(console)/agents/page.tsx`
- `src/lib/ops/client.tsx`
- `src/app/api/admin/ops/agents/bulk/`
