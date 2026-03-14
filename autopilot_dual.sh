#!/bin/bash
# AgentPick Dual-Track Autopilot — Claude Code fixes bugs, Codex builds features, ZERO idle
# No waiting for each other. Independent loops running simultaneously.

REPO="/Users/pwclaw/Desktop/code/agenthunt"
CODEX="/opt/homebrew/bin/codex"
BOT="8535747885:AAFZBbF7WsOfzKuJu_s7MxnbRXI8bO3NQDk"
CHAT="5986849183"
LOGDIR="/tmp/autopilot_dual"
mkdir -p "$LOGDIR"

export ANTHROPIC_API_KEY=$(python3 -c "import json; from pathlib import Path; print(json.load(open(Path.home()/'.openclaw/agents/main/agent/auth-profiles.json'))['profiles']['anthropic:default']['key'])")
export OPENAI_API_KEY=$(python3 -c "import json; from pathlib import Path; print(json.load(open(Path.home()/'.openclaw/agents/main/agent/auth-profiles.json'))['profiles']['openai:default']['key'])")

tg() {
  local text="$1"
  curl -s -X POST "https://api.telegram.org/bot${BOT}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "$(python3 -c "import json; print(json.dumps({'chat_id':'${CHAT}','text':json.loads(json.dumps('''$text'''))}))")" > /dev/null 2>&1
}

tg_raw() {
  curl -s -X POST "https://api.telegram.org/bot${BOT}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{\"chat_id\": \"${CHAT}\", \"text\": \"$1\"}" > /dev/null 2>&1
}

cd "$REPO"

# Shared merge lock
MERGE_LOCK="/tmp/autopilot_dual/.merge_lock"

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
  
  # Security check
  if git diff origin/main..HEAD -- '*.ts' '*.js' '*.mjs' | grep -qiE "(sk-ant-|sk-or-|pplx-|apify_api|tvly-|bb_live)"; then
    echo "⚠ BLOCKED: API key leak detected in $label"
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
  rm -f "$MERGE_LOCK"
  return 0
}

# ═══════════════════════════════════════════════════
# TRACK A: Claude Code — BUG FIXER (continuous loop)
# ═══════════════════════════════════════════════════
bugfix_loop() {
  local cycle=1
  while true; do
    echo "[BUGFIX] Cycle $cycle starting at $(date)"
    tg_raw "🔧 Bugfix Track cycle $cycle starting"
    
    cd "$REPO"
    git checkout main 2>/dev/null
    git pull --ff-only 2>/dev/null || true
    
    local branch="bugfix/cycle-${cycle}"
    git checkout -b "$branch" 2>/dev/null || { git checkout "$branch" 2>/dev/null; git reset --hard main; }
    
    # Claude Code: find and fix bugs
    timeout 900 claude --permission-mode bypassPermissions \
      -p "You are the AgentPick BUG FIXER. Workspace: $(pwd). Tech: Next.js 16 + Prisma + Tailwind + Vercel.

YOUR ONLY JOB IS FIXING BUGS. No new features. No refactoring. Just bugs.

STEP 1: Read these files for known bugs:
- QA_REPORT.md (test failures, P1/P2 issues)
- NEXT_VERSION.md (Must-Have #1 = bug list)

STEP 2: Read recent git log (git log --oneline -10) to see what was already fixed.

STEP 3: If all documented bugs are fixed, do your own testing:
- curl the live API endpoints and find issues
- Check for TypeScript errors: npx tsc --noEmit 2>&1 | head -50
- Check for obvious runtime bugs in src/app/api/

STEP 4: Fix every bug you find. One by one. Test each fix mentally.

CRITICAL BUGS FROM LATEST QA (fix these FIRST):
- Crawl endpoint: POST /api/v1/route/crawl {\"url\":\"...\"} returns 400. Fix: accept bare url without params wrapper
- Cheapest strategy routes to Tavily not Brave/Serper. Fix: update cost ranking
- Usage API missing fields (monthlyLimit, callsThisMonth, strategy)
- Dashboard tool_used shows 'unknown' — fix the router to record actual tool name
- ai_routing_summary never populated

When done: git add -A && git commit -m '[bugfix] cycle $cycle: <what you fixed>'
DO NOT STOP until you've fixed at least 3 bugs or confirmed zero bugs remain." \
      --output-format text 2>&1 | tee "$LOGDIR/bugfix_${cycle}.log" | tail -5
    
    git add -A 2>/dev/null
    git diff --cached --quiet || git commit -m "[bugfix] cycle $cycle" 2>/dev/null
    
    # Merge to main
    if safe_merge "$branch" "bugfix-$cycle"; then
      tg_raw "✅ Bugfix cycle $cycle merged and pushed"
    fi
    
    cycle=$((cycle + 1))
    sleep 5  # Brief pause between cycles
  done
}

# ═══════════════════════════════════════════════════
# TRACK B: Codex — FEATURE BUILDER (continuous loop)
# ═══════════════════════════════════════════════════
feature_loop() {
  local cycle=1
  # Feature queue — Codex works through these in order
  local -a FEATURES=(
    "FEATURE 1: Interactive API Playground on /connect page. Create src/components/Playground.tsx — a self-contained React client component. User types query, picks capability (Search/Crawl/Embed/Finance), clicks 'Route it →', sees: tool selected, latency, first 2 results, traceId. After 3 uses (localStorage counter), show soft CTA to register. Backend: create POST /api/v1/playground/route — unauthenticated, IP rate-limited (in-memory Map, 5 req/min), uses process.env.PLAYGROUND_KEY, returns same shape as /route/search but caps results to 2 items. Add _playground:true flag. Glass panel matching existing design. Result animates opacity-0→1 translateY(8→0) 300ms. Copy-to-curl button. Add the Playground component to the /connect page."
    "FEATURE 2: Dashboard Account & Usage Panel. Wire dashboard to show: plan, callsThisMonth/monthlyLimit as animated progress bar, current strategy as inline selector (AUTO/BALANCED/CHEAPEST/FASTEST), estimated monthly cost. Strategy selector calls POST /api/v1/router/strategy on change. Budget input calls POST /api/v1/router/budget on blur, shows remaining vs spent. All on main dashboard view, no extra navigation. File: src/app/dashboard/page.tsx + src/components/dashboard/UsagePanel.tsx"
    "FEATURE 3: Stripe Payment Integration. Create POST /api/v1/router/upgrade endpoint. Integrate Stripe Checkout for Pro ($29/mo) and Growth ($99/mo) plans. Create src/app/pricing/page.tsx with plan comparison cards. After successful payment, update user plan in database. Add plan limits enforcement in the router middleware. Use Stripe webhooks at /api/webhooks/stripe for payment confirmation."
    "FEATURE 4: BYOK (Bring Your Own Key) support. Add UI on dashboard for users to input their own API keys for Exa, Tavily, Serper, etc. Store encrypted in database. Router checks for user BYOK keys before using platform keys. Create /api/v1/router/keys endpoint for CRUD. Show cost savings when BYOK is active. $9/mo pure-routing tier that requires BYOK."
    "FEATURE 5: Agent Analytics Dashboard. Real-time charts showing: calls by tool over time (line chart), strategy distribution (pie), latency percentiles (p50/p95/p99), fallback rate trend, cost per call trend. Use lightweight charting (recharts or chart.js). Data from /api/v1/router/analytics endpoint aggregating RouterCall records. Time range selector (24h/7d/30d). Auto-refresh every 30s."
  )
  
  while [ $cycle -le ${#FEATURES[@]} ]; do
    local feature="${FEATURES[$((cycle-1))]}"
    echo "[FEATURE] Cycle $cycle starting at $(date)"
    tg_raw "🚀 Feature Track cycle $cycle starting"
    
    cd "$REPO"
    git checkout main 2>/dev/null
    git pull --ff-only 2>/dev/null || true
    
    local branch="feature/cycle-${cycle}"
    git checkout -b "$branch" 2>/dev/null || { git checkout "$branch" 2>/dev/null; git reset --hard main; }
    
    TASK="$feature"
    
    timeout 900 $CODEX exec \
      -a full-auto \
      --quiet \
      "You are building AgentPick (agentpick.dev). Workspace: $(pwd). Tech: Next.js 16 + Prisma + Tailwind + Vercel.

YOUR TASK (build this feature completely):
${TASK}

RULES:
- Create all necessary files
- Use modern React patterns (server components where possible, client components when needed)
- Tailwind CSS only
- Make it production-quality — error handling, loading states, responsive
- Match existing design system (check src/app/globals.css and existing components)
- When done: git add -A && git commit -m '[feature] cycle $cycle: <feature name>'
- Do NOT modify any files in src/app/api/v1/route/ (those are for bugfix track)
- DO NOT STOP until the feature is complete and committed" \
      2>&1 | tee "$LOGDIR/feature_${cycle}.log" | tail -5
    
    git add -A 2>/dev/null
    git diff --cached --quiet || git commit -m "[feature] cycle $cycle" 2>/dev/null
    
    # Merge to main
    if safe_merge "$branch" "feature-$cycle"; then
      tg_raw "✅ Feature cycle $cycle merged and pushed"
    fi
    
    cycle=$((cycle + 1))
    sleep 5
  done
  
  tg_raw "🏁 Feature track: all 5 features shipped!"
  
  # After all features done, keep running QA cycles
  while true; do
    echo "[QA] Running QA pass..."
    tg_raw "🔍 Running QA pass on all features"
    
    cd "$REPO"
    git checkout main 2>/dev/null
    git pull --ff-only 2>/dev/null || true
    
    timeout 600 $CODEX exec \
      -a full-auto \
      --quiet \
      "You are QA for AgentPick. Workspace: $(pwd).
Test the live site https://agentpick.dev:
1. Check all pages load (/, /connect, /dashboard, /pricing, /sdk)
2. Test API endpoints with curl
3. Check for console errors, broken links, mobile issues
4. Write results to QA_REPORT.md with score and PASS/FAIL
5. If FAIL, list specific files and fixes needed" \
      2>&1 | tee "$LOGDIR/qa_feature.log" | tail -5
    
    sleep 120  # Wait 2 min between QA cycles
  done
}

# ═══════════════════════════════════════════════════
# LAUNCH BOTH TRACKS IN PARALLEL
# ═══════════════════════════════════════════════════
echo "🚀 Dual-Track Autopilot launching at $(date)"
echo "  Track A: Claude Code → BUG FIXER (continuous)"
echo "  Track B: Codex → FEATURE BUILDER (5 features queued)"
tg_raw "🚀 Dual-Track Autopilot 启动! Claude Code修bug + Codex做功能，并行不停"

bugfix_loop &
BUGFIX_PID=$!

feature_loop &
FEATURE_PID=$!

echo "  Bugfix PID: $BUGFIX_PID"
echo "  Feature PID: $FEATURE_PID"
echo "  Both running. This script stays alive to keep them going."

# Keep alive and monitor
wait $BUGFIX_PID $FEATURE_PID
