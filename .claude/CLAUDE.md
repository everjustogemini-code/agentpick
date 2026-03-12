# CLAUDE.md — AgentPick Project

## 协作规则
每完成一个功能或修复，写一行到 `/Users/pwclaw/.openclaw/workspace/agentpick-progress.md`：
```
[ISO时间] [CLAUDE-CODE] [done/wip/blocked] 简短描述
```
例如：
```
[2026-03-12T02:30:00Z] [CLAUDE-CODE] [done] Arena delta 计算修复
[2026-03-12T02:45:00Z] [CLAUDE-CODE] [wip] Benchmark 内部端点开发中
[2026-03-12T03:00:00Z] [CLAUDE-CODE] [blocked] 需要 Serper API key
```

## 产品 Spec
完整 spec 在 `/Users/pwclaw/.openclaw/workspace/agentpick-seed/PRODUCT_SPEC.md`（v4, 1734 行）。
修改功能前先读对应章节。

## Benchmark Runner 协作
Pclaw（OpenClaw agent）在 `/Users/pwclaw/.openclaw/workspace/agentpick-benchmark/` 维护 benchmark runner。
- 需要一个内部 benchmark 端点 `POST /api/v1/benchmark/run`（复用已有 API keys，无 rate limit）
- 认证: 环境变量 BENCHMARK_SECRET
- 输入: `{ secret, domain, query, tools[] }`
- 输出: `{ results: [{tool, latency, resultCount, relevance, success}] }`
- 自动写入数据库（和 Playground 一样的逻辑）
