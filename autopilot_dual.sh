#!/bin/bash
# AgentPick Dual-Track Autopilot — Claude Code fixes bugs, Codex builds features, ZERO idle

REPO="/Users/pwclaw/Desktop/code/agenthunt"
CODEX="/opt/homebrew/bin/codex"
BOT="8535747885:AAFZBbF7WsOfzKuJu_s7MxnbRXI8bO3NQDk"
CHAT="5986849183"
LOGDIR="/tmp/autopilot_dual"
mkdir -p "$LOGDIR"

export ANTHROPIC_API_KEY=$(python3 -c "import json; from pathlib import Path; print(json.load(open(Path.home()/'.openclaw/agents/main/agent/auth-profiles.json'))['profiles']['anthropic:default']['key'])")
export OPENAI_API_KEY=$(python3 -c "import json; from pathlib import Path; print(json.load(open(Path.home()/'.openclaw/agents/main/agent/auth-profiles.json'))['profiles']['openai:default']['key'])")

tg_raw() {
  curl -s -X POST "https://api.telegram.org/bot${BOT}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{\"chat_id\": \"${CHAT}\", \"text\": \"$1\"}" > /dev/null 2>&1
}

cd "$REPO"

MERGE_LOCK="$LOGDIR/.merge_lock"

safe_merge() {
  local branch="$1"
  local label="$2"
  
  while [ -f "$MERGE_LOCK" ]; do sleep 2; done
  touch "$MERGE_LOCK"
  
  git checkout main 2>/dev/null
  git pull --ff-only 2>/dev/null || true
  git merge --no-ff "$branch" -m "[$label] merge $branch" 2>&1 || {
    git checkout --theirs . 2>/dev/null
    git add -A 2>/dev/null
    git commit -m "[$label] merge $branch (auto-resolved)" 2>/dev/null
  }
  
  if git diff origin/main..HEAD -- '*.ts' '*.js' '*.mjs' | grep -qiE "(sk-ant-|sk-or-|pplx-|apify_api|tvly-|bb_live)"; then
    echo "BLOCKED: API key leak in $label"
    tg_raw "⚠️ $label: Push BLOCKED — API key in code"
    git reset --hard origin/main 2>/dev/null
    rm -f "$MERGE_LOCK"
    return 1
  fi
  
  git push origin main 2>&1 || {
    tg_raw "⚠️ $label: git push failed"
    rm -f "$MERGE_LOCK"
    return 1
  }
  git branch -d "$branch" 2>/dev/null
  
  # Force deploy to Vercel (Git integration may be broken)
  npx vercel --prod --yes 2>&1 | tail -3
  tg_raw "🌐 $label: Deployed to agentpick.dev"
  
  rm -f "$MERGE_LOCK"
  return 0
}

# ═══════════════════════════════════════════
# TRACK A: Claude Code — BUG FIXER (continuous)
# ═══════════════════════════════════════════
bugfix_loop() {
  local cycle=1
  while true; do
    echo "[BUGFIX] Cycle $cycle starting at $(date)"
    tg_raw "🔧 Bugfix cycle $cycle starting"
    
    cd "$REPO"
    git checkout main 2>/dev/null
    git pull --ff-only 2>/dev/null || true
    
    local branch="bugfix/cycle-${cycle}"
    git checkout -b "$branch" 2>/dev/null || { git checkout "$branch" 2>/dev/null; git reset --hard main; }
    
    claude --permission-mode bypassPermissions \
      -p "You are the AgentPick BUG FIXER. Workspace: $(pwd). Tech: Next.js 16 + Prisma + Tailwind + Vercel.

YOUR ONLY JOB IS FIXING BUGS. No new features. No refactoring. Just bugs.

STEP 1: Read QA_REPORT.md and NEXT_VERSION.md for known bugs.
STEP 2: Read git log --oneline -10 to see what's already fixed.
STEP 3: Fix every bug. If documented bugs are done, run npx tsc --noEmit and curl API endpoints to find more.

CRITICAL BUGS TO FIX:
- Crawl endpoint: POST /api/v1/route/crawl with bare {\"url\":\"...\"} returns 400. Accept url without params wrapper.
- Cheapest strategy routes to Tavily not Brave/Serper. Fix cost ranking.
- Usage API /api/v1/router/usage missing monthlyLimit, callsThisMonth, strategy fields.
- Dashboard tool_used shows 'unknown' — router must record actual tool name in RouterCall.
- ai_routing_summary never populated — implement or remove from docs.

When done: git add -A && git commit -m '[bugfix] cycle $cycle: <summary>'
Fix at least 3 bugs per cycle." \
      --output-format text 2>&1 | tee "$LOGDIR/bugfix_${cycle}.log" | tail -5
    
    git add -A 2>/dev/null
    git diff --cached --quiet || git commit -m "[bugfix] cycle $cycle" 2>/dev/null
    
    if safe_merge "$branch" "bugfix-$cycle"; then
      tg_raw "✅ Bugfix cycle $cycle merged+pushed"
    fi
    
    cycle=$((cycle + 1))
    sleep 5
  done
}

# ═══════════════════════════════════════════
# TRACK B: Codex — FEATURE BUILDER (queued)
# ═══════════════════════════════════════════
feature_loop() {
  local cycle=0
  
  # Write each feature prompt to a temp file so codex can read it
  local prompts=()
  
  cat > "$LOGDIR/feat_1.txt" << 'FEAT1'
You are building AgentPick (agentpick.dev). Workspace: /Users/pwclaw/Desktop/code/agenthunt. Tech: Next.js 16 + Prisma + Tailwind + Vercel.

BUILD: Interactive API Playground on /connect page.
- Create src/components/Playground.tsx (React client component)
- User types query, picks capability (Search/Crawl/Embed), clicks "Route it", sees tool selected + latency + results + traceId
- After 3 uses (localStorage), show CTA to register
- Backend: POST /api/v1/playground/route — unauthenticated, IP rate-limited (in-memory, 5/min), returns capped results
- Glass panel matching existing design. Animate results in. Copy-to-curl button.
- Add Playground to /connect page

When done: git add -A && git commit -m '[feature] Interactive API Playground'
FEAT1

  cat > "$LOGDIR/feat_2.txt" << 'FEAT2'
You are building AgentPick (agentpick.dev). Workspace: /Users/pwclaw/Desktop/code/agenthunt. Tech: Next.js 16 + Prisma + Tailwind + Vercel.

BUILD: Dashboard Account & Usage Panel.
- Wire dashboard to show: plan, callsThisMonth/monthlyLimit progress bar, current strategy selector, estimated cost
- Strategy selector (AUTO/BALANCED/CHEAPEST/FASTEST) calls POST /api/v1/router/strategy
- Budget input calls POST /api/v1/router/budget on blur
- Files: src/app/dashboard/page.tsx + src/components/dashboard/UsagePanel.tsx
- All on main dashboard view, no extra nav

When done: git add -A && git commit -m '[feature] Dashboard Usage Panel'
FEAT2

  cat > "$LOGDIR/feat_3.txt" << 'FEAT3'
You are building AgentPick (agentpick.dev). Workspace: /Users/pwclaw/Desktop/code/agenthunt. Tech: Next.js 16 + Prisma + Tailwind + Vercel.

BUILD: Stripe Payment Integration.
- POST /api/v1/router/upgrade endpoint
- Stripe Checkout for Pro ($29/mo) and Growth ($99/mo)
- src/app/pricing/page.tsx with plan comparison cards
- Stripe webhooks at /api/webhooks/stripe
- Update user plan in DB after payment

When done: git add -A && git commit -m '[feature] Stripe Payment Integration'
FEAT3

  cat > "$LOGDIR/feat_4.txt" << 'FEAT4'
You are building AgentPick (agentpick.dev). Workspace: /Users/pwclaw/Desktop/code/agenthunt. Tech: Next.js 16 + Prisma + Tailwind + Vercel.

BUILD: BYOK (Bring Your Own Key) support.
- Dashboard UI for users to add their own API keys (Exa, Tavily, Serper, etc)
- /api/v1/router/keys CRUD endpoint
- Router checks user BYOK keys before platform keys
- Show cost savings with BYOK active

When done: git add -A && git commit -m '[feature] BYOK Support'
FEAT4

  cat > "$LOGDIR/feat_5.txt" << 'FEAT5'
You are building AgentPick (agentpick.dev). Workspace: /Users/pwclaw/Desktop/code/agenthunt. Tech: Next.js 16 + Prisma + Tailwind + Vercel.

BUILD: Agent Analytics Dashboard.
- Real-time charts: calls by tool (line), strategy distribution (pie), latency p50/p95/p99, fallback rate, cost trend
- Use recharts (install if needed)
- /api/v1/router/analytics endpoint aggregating RouterCall records
- Time range selector (24h/7d/30d), auto-refresh 30s

When done: git add -A && git commit -m '[feature] Agent Analytics Dashboard'
FEAT5

  for i in 1 2 3 4 5; do
    cycle=$i
    echo "[FEATURE] Cycle $cycle starting at $(date)"
    tg_raw "🚀 Feature cycle $cycle starting"
    
    cd "$REPO"
    git checkout main 2>/dev/null
    git pull --ff-only 2>/dev/null || true
    
    local branch="feature/cycle-${cycle}"
    git checkout -b "$branch" 2>/dev/null || { git checkout "$branch" 2>/dev/null; git reset --hard main; }
    
    # Read prompt from file and pipe to codex
    cat "$LOGDIR/feat_${i}.txt" | $CODEX exec --dangerously-bypass-approvals-and-sandbox - \
      2>&1 | tee "$LOGDIR/feature_${cycle}.log" | tail -5
    
    git add -A 2>/dev/null
    git diff --cached --quiet || git commit -m "[feature] cycle $cycle" 2>/dev/null
    
    if safe_merge "$branch" "feature-$cycle"; then
      tg_raw "✅ Feature cycle $cycle merged+pushed"
    fi
    
    sleep 5
  done
  
  tg_raw "🏁 All 5 features shipped!"
}

# ═══════════════════════════════════════════
# LAUNCH BOTH
# ═══════════════════════════════════════════
echo "🚀 Dual-Track Autopilot launching at $(date)"
echo "  Track A: Claude Code → BUG FIXER"
echo "  Track B: Codex → FEATURE BUILDER (5 features)"
tg_raw "🚀 Dual-Track启动! CC修bug + Codex做功能 并行不停"

bugfix_loop &
BUGFIX_PID=$!

feature_loop &
FEATURE_PID=$!

echo "  Bugfix PID: $BUGFIX_PID"
echo "  Feature PID: $FEATURE_PID"

wait $BUGFIX_PID $FEATURE_PID
