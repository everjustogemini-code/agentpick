# AgentPick 战略执行方案
**整理时间：** 2026-03-14 06:18 PDT
**讨论来源：** Boss + Pclaw 深夜战略会

---

## 一、产品定位（已确定）

**一句话：** "One skill. One API. Every tool your agent needs."

- 不是工具市场，不是社区，是 **Agent Tool Runtime Layer**
- 用户不需要知道 Tavily/Exa/Brave 的区别
- `pip install agentpick` → 一个 key → 所有工具自动路由 + 自动 fallback
- 消灭选择焦虑，不是给更多选择

---

## 二、Plan 结构（已确定）

| Plan | 价格 | 定位 |
|---|---|---|
| **Free** | $0 | 3000 calls/月，用我们的 key，够试 |
| **Pro** | $29/mo | 10K calls，全托管 all-in-one |
| **Growth** | $99/mo | 100K calls + SLA |
| *(隐藏) BYOK* | $9/mo | 用自己的 key，我们只做路由+fallback。不放首页，放 /connect 文档 |

**核心逻辑：** 主打 all-in-one 全托管，BYOK 是退路不是主打。目标客户是"懒得研究 API 的开发者"。

---

## 三、供应链架构（已确定方向，待执行）

### 四层供给体系：
```
AgentPick Router
├── Tier 1: 直签头部 API — Exa/Tavily/Brave/Firecrawl（批量价，最优质）
├── Tier 2: 聚合商 — Eden AI + DataForSEO（长尾覆盖，一个 key 扩品类）
├── Tier 3: BYOK — 用户自己的 key（零成本）
└── Tier 4: Permissionless Submit — API 开发者主动接入（他们付成本）
```

### 执行步骤：

**本周：**
- [ ] 注册 Eden AI，评估 embed + search 聚合能力和价格
- [ ] 注册 DataForSEO，评估批量 SERP 价格（~$1/1K searches）
- [ ] 接入后首页 "23 verified APIs" 数字争取翻到 50+

**下周：**
- [ ] 邮件 Exa/Tavily/Brave/Firecrawl BD 谈 volume discount
- [ ] 话术："We route X calls/day, your benchmark ranking is your ad. Let's talk bulk pricing."
- [ ] 用 benchmark 数据做谈判筹码

**一个月后：**
- [ ] 上线 Permissionless Submit Portal (`/submit-api`)
- [ ] 自动验证沙箱 → Shadow Routing 灰度 → 生产
- [ ] API 开发者主动给免费 quota → 零采购成本飞轮

---

## 四、分发渠道（已完成 + 进行中）

### ✅ 已完成：
- [x] **PyPI** — `pip install agentpick` v0.1.0 全球可用
- [x] **网站** — agentpick.dev 首页、OG 图、品牌统一
- [x] **博客** — 5 篇 SEO/AEO 技术文章上线
- [x] **skill.md** — Agent 自助接入文档
- [x] **llms.txt** — AI 爬虫可发现
- [x] **Moltbook** — 2 条帖子已发
- [x] **OpenClaw Skill** — 本地可用，等 ClawHub 发布

### ⏳ 进行中：
- [ ] **ClawHub 发布** — 账号 14 天限制，10 天后自动解锁发布
- [ ] **Growth Agent** — 持续发 Moltbook + 监控 AI 搜索可见度

### 🔜 待做：
- [ ] **AEO 终极目标** — 让 Claude/GPT/Gemini 回答 "best search API for agents" 时提到 AgentPick
- [ ] **Hacker News / Reddit / Twitter** — 用真实 benchmark 数据做内容，不是广告

---

## 五、技术债务 & Bug 修复（QA Round 7）

### P0 必修：
- [ ] **Stripe 支付** — pricing 页点升级报错，需配 Stripe env vars
- [ ] **toolUsed 为空** — RouterCall 记录里不写实际工具名
- [ ] **XSS 安全 headers** — 缺 X-Content-Type-Options + CSP

### P1：
- [ ] **策略差异化** — auto/balanced/cheapest 都选 brave，需修排序逻辑
- [ ] **Playground 500** — 需要跑 Prisma migration 到生产 DB（Neon）
- [ ] **MCP 端点 404** — tools/list 和 discover_tools 不可用

### 状态：
- Autopilot 双轨已重启（Claude Code 修 bug + Codex 做功能）
- QA_REPORT.md 已更新，autopilot 会自动读取并修复

---

## 六、Autopilot 架构（当前运行中）

```
并行执行：
├── Track A: Claude Code — 持续修 bug（读 QA_REPORT.md）
├── Track B: Codex — 排队做功能（BYOK → Analytics）
├── Growth Agent — AEO + Moltbook + 搜索可见度
└── Content Machine — 博客 + 对比页 + SEO 优化
```

每轮完成后自动 merge → push → `vercel --prod` 部署

---

## 七、Permissionless API Submit（战略级功能）

### 流程设计：
```
API 开发者提交 endpoint + auth 方式 + capability
→ 自动沙箱验证（10 个标准 query）
→ 检测 response format / 延迟 / 错误处理
→ Shadow Routing（100 次真实请求对比，不影响用户）
→ Benchmark 分数达标 → 自动上线
→ 不达标 → 通知开发者改进
```

### 为什么这是终局：
- API 开发者**主动给免费调用次数**（他们要流量和 benchmark 排名）
- 供给侧无限扩展
- 数据飞轮：更多 API → 更好路由 → 更多用户 → 更多 API 加入
- **Cloudflare Workers 模式** — 开发者把服务接入你的网络

---

## 八、里程碑

| 时间 | 目标 |
|---|---|
| **本周末** | P0 bug 全修、Stripe 闭环、50+ API 覆盖 |
| **下周** | BD 联系头部 API、BYOK tier 上线、ClawHub 发布 |
| **月底** | Permissionless Submit Portal MVP、首个付费用户 |
| **Q2** | 100+ API、1000 开发者注册、$1K MRR |
