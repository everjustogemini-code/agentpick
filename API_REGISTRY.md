# AgentPick API Registry — Single Source of Truth

**规则：新增任何 API 时，只改这个文件 + 运行 sync 脚本，全站自动更新。**

---

## 当前支持的 Capabilities

| Capability | 工具数 | 对外展示名 |
|---|---|---|
| search | 9 | Web Search |
| crawl | 5 | Web Crawling & Scraping |
| embed | 5 | Text Embeddings |
| finance | 3 | Financial Data |
| code | 1 | Code Execution |
| communication | 1 | Email & Messaging |
| translation | 1 | Translation |
| ocr | 1 | Document & Image OCR |
| **总计** | **26** | **8 capabilities** |

## Eden AI 聚合覆盖（算我们支持的，不暴露底层）

Eden AI 一个 key 覆盖以下底层供应商，全部算 AgentPick 支持：

### Embed (通过 Eden AI)
- OpenAI, Cohere, Google, Mistral, Jina → 对外算 5 个 embed providers

### Translation (通过 Eden AI)  
- Google Translate, DeepL, Microsoft, Amazon → 对外算 4 个 translation providers

### OCR (通过 Eden AI)
- Google Vision, Amazon Textract, Microsoft Azure, Mindee → 对外算 4 个 OCR providers

### 未来可扩展 (Eden AI 已支持)
- Speech-to-Text: Google, OpenAI Whisper, AssemblyAI, Deepgram → 4 个
- Text-to-Speech: ElevenLabs, Google, Amazon Polly → 3 个
- Image Generation: DALL·E, Stable Diffusion, Midjourney API → 3 个
- Sentiment Analysis: Google, AWS, Azure → 3 个

## 对外宣传数字计算

### 直接接入 (我们有 key)
- Search: Exa, Tavily, Brave, Serper, SerpAPI, Perplexity, You.com, Jina, Bing = **9**
- Crawl: Firecrawl, Jina, Apify, ScrapingBee, Browserbase = **5**
- Embed: OpenAI, Cohere, Voyage, Jina = **4** (直接接)
- Finance: Polygon, Alpha Vantage, FMP = **3**
- Code: E2B = **1**
- Communication: Resend = **1**
- 直接接入小计: **23**

### Eden AI 聚合覆盖 (算我们支持的)
- Embed 额外: Google, Mistral = **+2**
- Translation: Google, DeepL, Microsoft, Amazon = **+4**
- OCR: Google Vision, Textract, Azure, Mindee = **+4**
- 聚合小计: **+10**

### 对外总数: **33 verified APIs across 8 capabilities**

---

## 需要自动更新的位置

当此文件变更时，以下位置必须同步更新：

### 代码 (必须同步)
1. `src/lib/router/index.ts` — SLUG_TO_ENV_VAR, CAPABILITY_TOOLS, TOOL_CHARACTERISTICS
2. `src/lib/benchmark/adapters/index.ts` — ADAPTERS map

### 全站文案 (自动 sync)
3. `src/app/page.tsx` — 首页 "XX verified APIs" 数字
4. `src/app/layout.tsx` — og:description 里的数字
5. `src/app/api/og/route.tsx` — OG 图里的数字
6. `src/app/skill.md/route.ts` — Agent 文档里的 capability 列表和工具数
7. `src/app/llms.txt/route.ts` — AI 爬虫文档
8. `src/app/connect/page.tsx` — Router 文档页
9. `src/components/PricingSection.tsx` — Pricing 里的 "X capabilities"
10. `src/components/PricingPageClient.tsx` — 同上
11. `README.md` — GitHub 首页
12. `STRATEGY.md` — 内部策略文档

### SDK (自动 sync)
13. `agentpick-python` PyPI 包 — README 里的数字和 capability 列表
14. OpenClaw skill `SKILL.md` — 支持的 capability 列表

### Marketing
15. Moltbook posts — 引用最新数字
16. Blog posts — 引用最新数字

---

## Sync 脚本需求

TODO: 创建 `scripts/sync_api_count.py`
- 读取此文件的 capability 表和对外总数
- 自动 sed 替换所有上述文件中的数字
- git commit + push
- 每次新增 API 后运行一次即可
