# AgentPick UI Polish v1 — 细节升级，不是重写

## 原则
不改 hero、不改结构。升级现有每个区块的**视觉质感和交互细节**。
目标：从"能用"到"想截图分享"。

## 具体改动清单

### 1. 首页卡片区（AI-powered routing / Auto-fallback / Leaderboard）
- 加 hover 效果：`transform: translateY(-2px)` + `box-shadow` 升级
- 卡片加微妙渐变边框（border-image 或 pseudo element gradient border）
- 代码示例区加行号 + 打字机动画（CSS animation，逐行显现）
- Leaderboard 表格行 hover 高亮，当前排名行加微光效果
- 质量分数条加颜色渐变（红→黄→绿）而不是单色

### 2. 导航栏（SiteHeader）
- 加 `backdrop-filter: blur(12px)` 毛玻璃效果
- 当前页面 link 加底部 accent 线（2px）
- Logo 旁加一个小的 live 脉冲点（表示系统在运行）
- 移动端：hamburger icon 加旋转动画

### 3. "How it works" 三步骤
- 步骤数字加渐变色（1: blue, 2: purple, 3: green）
- 步骤间加虚线连接线（CSS border-left dotted）
- 每步 hover 时放大 1.02x + 边框变亮

### 4. Live Feed 预览（首页底部）
- 最新一条加 pulse 动画（刚到达的效果）
- 时间戳加相对时间更新（"2s ago" 实时变化）
- 每条 benchmark 结果的分数用颜色编码（>4: green, 3-4: yellow, <3: red）

### 5. CTA 区域（底部 "Start Building"）
- 按钮加 hover 光效（shimmer animation）
- `pip install` 代码块加一键复制按钮（带 ✓ 反馈）
- 加 tooltip: "Copied!" fade 效果

### 6. 全局微调
- 所有 section 之间加分隔线（subtle gradient divider, not solid border）
- 页面滚动时 section 入场动画（已有 ScrollReveal，确保生效）
- 外链加 ↗ 图标
- 所有 font-mono 代码用 JetBrains Mono（从 Google Fonts 引入）
- 加载状态：skeleton shimmer（不是空白）

### 7. /benchmarks 页面
- Domain cards 加对应 emoji + 微妙背景色区分
- 最新测试列表加相对时间 + latency 颜色编码
- ScoreRing 加 hover tooltip 显示具体分数

### 8. /connect 页面
- Strategy 选择区做成可交互 tab（点击高亮，下方内容切换）
- 代码块加语法高亮色（关键词: green, 字符串: yellow, 注释: gray）

## 技术约束
- 零新 npm 包（纯 CSS/Tailwind）
- 不改任何 API 路由
- 不改数据查询
- 所有动画用 CSS transition/animation
- JetBrains Mono 用 next/font/google 引入

## 提交信息
`[polish] UI detail upgrade — hover effects, glass nav, gradient borders, code animations, score colors`
