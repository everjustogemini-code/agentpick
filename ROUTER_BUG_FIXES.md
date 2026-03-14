# AgentPick Router — Bug Fix Spec

QA 测试发现的 P0/P1 问题，按优先级排序。

---

## P0-1: XSS 反射漏洞

**问题**: `query` 字段包含 `<script>alert(1)</script>` 时，原样出现在 response 中。

**复现**:
```bash
curl -s https://agentpick.dev/api/v1/route/search \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d '{"query":"<script>alert(1)</script>"}'
# response 中包含原始 <script> 标签
```

**修复**: 在 route handler 入口处对 `query` 做 HTML encode，或用 DOMPurify/他库 sanitize。建议：
```ts
import { escape } from 'html-escaper'; // 或任意 escape 库
const safeQuery = escape(body.query);
// 后续用 safeQuery 替代原始 query
```
Response 中不应该出现原始 HTML 标签。

---

## P0-2: Invalid capability 返回 502 而非 404

**问题**: 访问不存在的 capability（如 `/api/v1/route/nonexistent`）返回 HTTP 502，应返回 404。

**复现**:
```bash
curl -s -o /dev/null -w "%{http_code}" \
  https://agentpick.dev/api/v1/route/nonexistent \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d '{"query":"test"}'
# 返回 502，应返回 404
```

**修复**: 在 route handler 中校验 capability 是否在白名单内，不在则 `return NextResponse.json({error: {code: "NOT_FOUND", message: "Unknown capability: nonexistent"}}, {status: 404})`。

白名单: `["search", "crawl", "embed", "finance"]`

---

## P1-1: `priority` 参数被完全忽略

**问题**: 传入 `priority: ["fake1", "fake2"]`（全部不存在的工具），路由器没有报错，直接 fallback 到默认工具（serpapi-google）并返回 200。开发者自定义路由完全失效。

**复现**:
```bash
curl -s https://agentpick.dev/api/v1/route/search \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d '{"query":"test","priority":["fake1","fake2"]}'
# 返回 200 with tool=serpapi-google，priority 被忽略
```

**期望行为**:
- 如果 `priority` 中有已知工具 → 优先使用这些工具，失败才 fallback
- 如果 `priority` 中**全部**是未知工具 → 返回 400:
  ```json
  {"error": {"code": "INVALID_PRIORITY", "message": "None of the specified priority tools are available: fake1, fake2"}}
  ```
- Response meta 中应包含 `priority_requested` 字段，方便 debug

---

## P1-2: AI Classification 不识别 finance 类型

**问题**: `strategy=auto` 时，明显的 finance 查询被错误分类为 `simple/general`，导致路由到 brave-search 而不是 tavily/alpha-vantage。

**复现**:
```bash
# 这两个 query 都应该是 finance domain
"NVDA PE ratio forward estimate"    → simple/general ❌ (应 finance)
"What is Apple's market cap today"  → simple/general ❌ (应 finance)
```

**期望分类**:
| Query 特征 | type | domain | depth | freshness | 推荐工具 |
|-----------|------|--------|-------|-----------|---------|
| 股票代码 + 财务指标 (PE/EPS/market cap) | `simple` | `finance` | `shallow` | `recent` | alpha-vantage / tavily |
| 实时价格/行情 | `realtime` | `finance` | `shallow` | `realtime` | tavily |
| 深度研报/earnings analysis | `research` | `finance` | `deep` | `recent` | exa-search |

**修复方向**: 在 AI classification prompt 中补充 finance domain 的识别示例，或添加正则预检测（ticker 格式 + 财务词汇 → 强制 finance domain）。

Finance 关键词参考: `PE ratio`, `EPS`, `market cap`, `earnings`, `revenue`, `stock price`, `share price`, `P/S`, `EBITDA`, `forward estimate`, `TTM`, 以及 `^[A-Z]{1,5}$` 格式的 ticker。

---

## 验证方法

修复后可用以下命令快速验证：

```bash
KEY="<agent_key>"
BASE="https://agentpick.dev"

# XSS fix
curl -s $BASE/api/v1/route/search -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"query":"<script>alert(1)</script>"}' | grep -c '<script>' && echo "❌ STILL BROKEN" || echo "✅ XSS FIXED"

# 404 fix
curl -s -o /dev/null -w "%{http_code}" $BASE/api/v1/route/nonexistent \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d '{"query":"test"}'
# 期望: 404

# Priority fix
curl -s $BASE/api/v1/route/search -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"query":"test","priority":["fake1","fake2"]}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error',{}).get('code'))"
# 期望: INVALID_PRIORITY

# Finance classification fix
curl -s $BASE/api/v1/route/search -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"query":"NVDA PE ratio forward estimate","strategy":"auto"}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); ai=d.get('meta',{}).get('ai_classification',{}); print(ai.get('domain'))"
# 期望: finance
```
