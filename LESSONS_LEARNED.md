# AgentPick 开发经验教训
**来源:** 2026-03-14 通宵开发 session（4AM-9AM PDT）

---

## 🔴 P0 级教训（踩过的坑，绝不能再犯）

### 1. Prisma schema 改了必须同步生产 DB
**事件:** 加了 SCALE enum 和 PlaygroundSession 表，代码部署了但 Neon 没 migrate → 全站 500
**规则:** 每次改 `prisma/schema.prisma` 后，手动跑：
```bash
DATABASE_URL="<neon_url>" npx prisma db push --accept-data-loss
```
**不要**把 `prisma db push` 放进 build 脚本——它会拖慢 Vercel build 甚至超时

### 2. CSP 安全 headers 会杀死 Next.js
**事件:** 加了 `script-src 'self'` 的 CSP → 挡掉了 Next.js 所有 inline hydration script → 页面看起来加载了但内容全隐形
**规则:** Next.js 必须用 `script-src 'self' 'unsafe-inline'`，不能只有 `'self'`
**防御:** CSS 里加 fallback animation，就算 JS 挂了内容也能在 2s 后显示

### 3. 新的 DB driver 不要直接上生产
**事件:** 换了 `@neondatabase/serverless` driver → Prisma 查询全崩 → 回滚到 `@prisma/adapter-pg`
**规则:** 基础设施变更（DB driver/ORM/runtime）必须先在 staging 验证，不能直接 push to prod

### 4. Vercel env var 用 `<<<` 传值会带 `\n`
**事件:** Stripe Price ID 后面多了换行符 → Stripe API 报 "No such price"
**规则:** 用 `printf "value" | npx vercel env add NAME production` 而不是 `<<< "value"`

### 5. 多个 agent 并行改同一个 repo 会冲突
**事件:** autopilot、growth agent、手动修复同时改代码 → merge 冲突、覆盖、分支混乱
**规则:** 关键修复时先停 autopilot，修完再重启。或者用 file-level locking（不同 agent 改不同文件）

---

## 🟡 重要经验

### 6. Vercel Git 自动部署会断
**事件:** push 到 GitHub 不触发 deploy，19 小时没人发现
**规则:** 每次 push 后跟一个 `npx vercel --prod --yes`，不依赖 Git integration

### 7. try-catch fallback 到 0 比报错更危险
**事件:** `getStats()` 查询失败 fallback 到全 0 → 首页显示 "0 agents"，用户以为产品没人用
**规则:** fallback 用最后一次已知的好数据，不用 0。或者不显示，不要显示错误数据

### 8. 首页是 server component，一个查询崩全页面崩
**事件:** PlaygroundSession 查询在 Neon 上失败 → 整个 SSR 中断 → 白屏
**规则:** 首页每个 DB 查询都要独立 `.catch(() => [])`，一个挂了不影响其他

### 9. Stripe test key 和 live key 是不同账号体系
**事件:** 用 test key 创建的 Product/Price 在 live mode 不存在
**规则:** 切换 live 时必须重新创建 Product + Price + Webhook

### 10. 代码里的 env var 名字必须和 Vercel 完全一致
**事件:** 代码用 `STRIPE_PRICE_PRO_MONTHLY`，Vercel 配的是 `STRIPE_PRICE_PRO` → 读不到
**规则:** 先看代码里用什么名字，再去 Vercel 配，不要猜

---

## 🟢 好的实践（继续保持）

### 11. 多 agent 并行开发效率极高
- Autopilot 双轨（bugfix + feature）一晚上产出 5 个功能 + 4 轮 bugfix
- Growth Agent + Content Machine 并行产出博客和 AEO 内容
- 关键是分工明确：不同 agent 改不同文件

### 12. 每次部署后立刻验证
- `curl https://agentpick.dev/api/health` 检查 DB
- `curl https://agentpick.dev | grep "footer"` 检查首页完整
- 不要假设部署就没问题

### 13. API_REGISTRY.md 单一真相源
- 新增 API 只改一个文件 → sync 脚本更新全站
- 避免 16 个地方手动改数字

### 14. QA 报告驱动修复
- 把 QA 报告写成 QA_REPORT.md → autopilot 自动读取并修复
- 结构化的 P0/P1/P2 分级让 agent 知道先修什么

---

## 📋 部署 Checklist（每次发布前）

```
□ npx prisma generate
□ npx next build — 本地 build 通过
□ 如果改了 schema: DATABASE_URL="..." npx prisma db push
□ git push origin main
□ npx vercel --prod --yes
□ curl https://agentpick.dev/api/health — DB OK
□ curl https://agentpick.dev | grep "footer" — 首页完整
□ 浏览器打开 agentpick.dev 手动检查（别只看 curl）
```
