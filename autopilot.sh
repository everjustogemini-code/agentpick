#!/bin/bash
# AgentPick Autopilot v2 — Continuous parallel development
# Claude Code + Codex run simultaneously, zero idle time

REPO="/Users/pwclaw/Desktop/code/agenthunt"
WORKSPACE="/Users/pwclaw/.openclaw/workspace"
CODEX="/opt/homebrew/bin/codex"
BOT="8535747885:AAFZBbF7WsOfzKuJu_s7MxnbRXI8bO3NQDk"
CHAT="5986849183"
LOGDIR="/tmp/autopilot"
mkdir -p "$LOGDIR"

# Load API keys
export ANTHROPIC_API_KEY=$(python3 -c "import json; from pathlib import Path; print(json.load(open(Path.home()/'.openclaw/agents/main/agent/auth-profiles.json'))['profiles']['anthropic:default']['key'])")
export OPENAI_API_KEY=$(python3 -c "import json; from pathlib import Path; print(json.load(open(Path.home()/'.openclaw/agents/main/agent/auth-profiles.json'))['profiles']['openai:default']['key'])")

tg() {
  curl -s -X POST "https://api.telegram.org/bot${BOT}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{\"chat_id\": \"${CHAT}\", \"text\": $(python3 -c "import json; print(json.dumps('$1'))")}" > /dev/null 2>&1
}

tg_raw() {
  curl -s -X POST "https://api.telegram.org/bot${BOT}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{\"chat_id\": \"${CHAT}\", \"text\": \"$1\"}" > /dev/null 2>&1
}

cd "$REPO"

CYCLE=${1:-1}
echo "🚀 AgentPick Autopilot v2 — Cycle $CYCLE starting at $(date)"
tg_raw "🚀 Autopilot v2 Cycle $CYCLE starting"

# ═══════════════════════════════════════════
# STEP 1: PM Agent — produce next version spec
# ═══════════════════════════════════════════
# Check if last QA failed — if so, this cycle is BUG FIX ONLY
QA_LAST=$(tail -1 QA_REPORT.md 2>/dev/null || echo "NONE")
if echo "$QA_LAST" | grep -qi "FAIL"; then
  echo "📋 Step 1: BUGFIX CYCLE — QA failed last time, fixing issues first"
  tg_raw "🔧 Cycle $CYCLE: BUGFIX 优先 — 上轮QA未通过"
  
  claude --permission-mode bypassPermissions \
    -p "You are the AgentPick PM. Your workspace is $(pwd).

THIS IS A BUGFIX CYCLE. QA failed last round. Read QA_REPORT.md carefully.

RULES:
1. Read QA_REPORT.md — every P1 and P2 issue listed there MUST be addressed
2. NO NEW FEATURES this cycle. Zero. Only bug fixes.
3. Write NEXT_VERSION.md with ONLY bug fixes from QA_REPORT.md
4. Each fix must reference the exact QA issue number
5. Include the exact file paths and what needs to change

The pattern is: QA keeps reporting the same issues every cycle because they never get fixed.
THIS CYCLE BREAKS THAT PATTERN. Fix every single reported issue.

Write NEXT_VERSION.md now. Bug fixes only." \
    --output-format text 2>&1 | tee "$LOGDIR/pm_${CYCLE}.log" | tail -5
else
  echo "📋 Step 1: PM producing NEXT_VERSION.md (feature cycle)..."
  
  claude --permission-mode bypassPermissions \
    -p "You are the AgentPick PM. Your workspace is $(pwd).

INSTRUCTIONS:
1. Read QA_REPORT.md if it exists — any remaining P1/P2 bugs MUST be included as must-have fixes
2. Read git log --oneline -20 for recent changes  
3. Check the live site https://agentpick.dev
4. Write NEXT_VERSION.md with exactly 3 must-have items

PRIORITY ORDER (strict):
1. Fix ALL remaining P1/P2 bugs from QA_REPORT.md (if any exist, they are must-have #1)
2. Major UI upgrade — modern design, glassmorphism, animations, better typography
3. One new feature that increases developer adoption

NEVER ship new features while bugs remain. Bugs first, features second.

Write NEXT_VERSION.md now. Be specific." \
    --output-format text 2>&1 | tee "$LOGDIR/pm_${CYCLE}.log" | tail -5
fi

if [ ! -f NEXT_VERSION.md ]; then
  echo "❌ PM failed"
  tg_raw "❌ Cycle $CYCLE: PM failed to produce NEXT_VERSION.md"
  exit 1
fi

echo "✅ PM done"

# ═══════════════════════════════════════════
# STEP 2: Orchestrator — split tasks for parallel execution
# ═══════════════════════════════════════════
echo "🏗️ Step 2: Splitting tasks for Claude Code + Codex..."

claude --permission-mode bypassPermissions \
  -p "You are the AgentPick task splitter. Read NEXT_VERSION.md.

Split the work into exactly 2 task files, one for each coding agent:

TASK_CLAUDE_CODE.md — API/backend fixes, complex multi-file changes, new endpoints, database work.
TASK_CODEX.md — Frontend fixes, component bugs, styling issues, simple single-file changes.

CRITICAL RULES:
- Tasks MUST NOT touch the same files (prevent merge conflicts)
- Each task file must list EXACTLY which files to create/modify
- Be extremely specific — include exact function names, line numbers if possible
- IF NEXT_VERSION.md contains bug fixes, those bugs MUST appear in one of the task files
- EVERY bug from NEXT_VERSION.md must be assigned. No bug left behind.
- After writing both files, verify: is every item from NEXT_VERSION.md covered in either TASK_CLAUDE_CODE.md or TASK_CODEX.md?

Write both files now: TASK_CLAUDE_CODE.md and TASK_CODEX.md" \
  --output-format text 2>&1 | tee "$LOGDIR/split_${CYCLE}.log" | tail -5

echo "✅ Tasks split"

# ═══════════════════════════════════════════
# STEP 3: PARALLEL EXECUTION — Claude Code + Codex simultaneously
# ═══════════════════════════════════════════
echo "⚡ Step 3: Running Claude Code + Codex in PARALLEL..."
tg_raw "⚡ Cycle $CYCLE: Claude Code + Codex running in parallel"

# Prepare branches
git checkout main 2>/dev/null
git pull --ff-only 2>/dev/null || true

# Branch for Claude Code
git checkout -b "feat/cycle-${CYCLE}-cc" 2>/dev/null || git checkout "feat/cycle-${CYCLE}-cc" 2>/dev/null

# Run Claude Code in background
(
  cd "$REPO"
  echo "[CC] Starting Claude Code task..."
  claude --permission-mode bypassPermissions \
    -p "You are a senior full-stack engineer working on AgentPick (agentpick.dev).
Your workspace is $(pwd). Tech stack: Next.js 16 + Prisma + Tailwind + Vercel.

Read TASK_CLAUDE_CODE.md for your specific task.

RULES:
- Implement EVERYTHING in the task file
- Make real file changes (create/edit files directly)
- Use modern React patterns (server components, suspense, etc.)
- Tailwind CSS only — no inline styles
- Commit your work when done: git add -A && git commit -m '[autopilot] Claude Code: cycle $CYCLE'
- If you encounter errors, fix them and continue
- Do NOT ask questions — make reasonable decisions and keep going" \
    --output-format text 2>&1 | tee "$LOGDIR/cc_${CYCLE}.log" | tail -3
  
  # Ensure committed
  git add -A 2>/dev/null
  git diff --cached --quiet || git commit -m "[autopilot] Claude Code: cycle $CYCLE" 2>/dev/null
  echo "[CC] ✅ Done"
) &
CC_PID=$!

# Branch for Codex  
git checkout main 2>/dev/null
git checkout -b "feat/cycle-${CYCLE}-codex" 2>/dev/null || git checkout "feat/cycle-${CYCLE}-codex" 2>/dev/null

# Run Codex in background
(
  cd "$REPO"
  TASK=$(cat TASK_CODEX.md 2>/dev/null || echo "Fix bugs and improve styling based on NEXT_VERSION.md")
  echo "[CX] Starting Codex task..."
  $CODEX exec \
    -a full-auto \
    --quiet \
    "You are working on the AgentPick codebase at $(pwd). Tech stack: Next.js 16 + Prisma + Tailwind + Vercel.

Your task:
${TASK}

RULES:
- Make real file changes
- Commit when done: git add -A && git commit -m '[autopilot] Codex: cycle $CYCLE'
- Do NOT modify files listed in TASK_CLAUDE_CODE.md (those belong to Claude Code)
- If a file doesn't exist yet, create it
- Keep going until the task is complete" \
    2>&1 | tee "$LOGDIR/codex_${CYCLE}.log" | tail -3
  
  git add -A 2>/dev/null
  git diff --cached --quiet || git commit -m "[autopilot] Codex: cycle $CYCLE" 2>/dev/null
  echo "[CX] ✅ Done"
) &
CX_PID=$!

echo "  Claude Code PID: $CC_PID"
echo "  Codex PID: $CX_PID"
echo "  Waiting for both to finish..."

# Wait for both with timeout (15 min each)
TIMEOUT=900
( sleep $TIMEOUT; kill $CC_PID 2>/dev/null; echo "⚠ Claude Code timed out" ) &
TIMER1=$!
( sleep $TIMEOUT; kill $CX_PID 2>/dev/null; echo "⚠ Codex timed out" ) &
TIMER2=$!

wait $CC_PID 2>/dev/null; CC_EXIT=$?
wait $CX_PID 2>/dev/null; CX_EXIT=$?
kill $TIMER1 $TIMER2 2>/dev/null

echo "  Claude Code exit: $CC_EXIT"
echo "  Codex exit: $CX_EXIT"

# ═══════════════════════════════════════════
# STEP 4: Merge both branches into main
# ═══════════════════════════════════════════
echo "🔀 Step 4: Merging..."

git checkout main 2>/dev/null

# Merge Claude Code
git merge --no-ff "feat/cycle-${CYCLE}-cc" -m "Merge Claude Code cycle $CYCLE" 2>&1 || {
  echo "⚠ CC merge conflict, auto-resolving..."
  git checkout --theirs . 2>/dev/null
  git add -A 2>/dev/null
  git commit -m "Merge Claude Code cycle $CYCLE (auto-resolved)" 2>/dev/null
}

# Merge Codex
git merge --no-ff "feat/cycle-${CYCLE}-codex" -m "Merge Codex cycle $CYCLE" 2>&1 || {
  echo "⚠ Codex merge conflict, auto-resolving..."
  git checkout --theirs . 2>/dev/null
  git add -A 2>/dev/null
  git commit -m "Merge Codex cycle $CYCLE (auto-resolved)" 2>/dev/null
}

# ── Stamp deploy marker ──
GHASH=$(git rev-parse --short HEAD)
cat > DEPLOY_MARKER.json << MARKER_EOF
{"cycle": $CYCLE, "gitHash": "$GHASH", "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"}
MARKER_EOF
git add DEPLOY_MARKER.json
git commit -m "[autopilot] Deploy marker: cycle $CYCLE ($GHASH)" 2>/dev/null
GHASH=$(git rev-parse --short HEAD)

# ── Security: block push if API keys leaked ──
if git diff origin/main..HEAD -- '*.ts' '*.js' '*.mjs' | grep -qiE "(sk-ant-|sk-or-|pplx-|apify_api|tvly-|bb_live)"; then
  echo "⚠ BLOCKED: API key leak detected"
  tg_raw "⚠️ Cycle $CYCLE: Push BLOCKED — API key in code"
  exit 1
fi

# Push
git push origin main 2>&1 || {
  echo "⚠ Push failed"
  tg_raw "⚠️ Cycle $CYCLE: git push failed — check GitHub secret scanning"
  exit 1
}
tg_raw "🚀 Cycle $CYCLE: Pushed $GHASH → Vercel deploying..."

# Clean up branches
git branch -d "feat/cycle-${CYCLE}-cc" "feat/cycle-${CYCLE}-codex" 2>/dev/null

echo "✅ Merged and pushed"

# ═══════════════════════════════════════════
# STEP 5: Wait for deploy, then VERIFY it's live
# ═══════════════════════════════════════════
echo "⏳ Waiting 90s for Vercel deploy..."
sleep 90

# ── Verify deployment actually went live ──
echo "🔍 Verifying deployment..."
LIVE_VERSION=$(curl -s "https://agentpick.dev/api/version" 2>/dev/null)
LIVE_CYCLE=$(echo "$LIVE_VERSION" | python3 -c "import sys,json; print(json.load(sys.stdin).get('version',{}).get('autopilotCycle','none'))" 2>/dev/null || echo "error")
LIVE_HASH=$(echo "$LIVE_VERSION" | python3 -c "import sys,json; print(json.load(sys.stdin).get('version',{}).get('gitHash','none'))" 2>/dev/null || echo "error")

echo "  Expected: cycle=$CYCLE hash=$GHASH"
echo "  Live: cycle=$LIVE_CYCLE hash=$LIVE_HASH"

if [ "$LIVE_CYCLE" = "$CYCLE" ] || [ "$LIVE_HASH" = "$GHASH" ]; then
  echo "  ✅ Deploy verified!"
  tg_raw "✅ Cycle $CYCLE 部署已验证上线 $GHASH"
else
  echo "  ⚠ Deploy NOT verified — may still be building"
  tg_raw "⚠️ Cycle $CYCLE: 代码已push但部署未确认 expected $GHASH got $LIVE_HASH. 等待中..."
  # Wait another 60s and retry
  sleep 60
  LIVE_VERSION=$(curl -s "https://agentpick.dev/api/version" 2>/dev/null)
  LIVE_HASH=$(echo "$LIVE_VERSION" | python3 -c "import sys,json; print(json.load(sys.stdin).get('version',{}).get('gitHash','none'))" 2>/dev/null || echo "error")
  if [ "$LIVE_HASH" = "$GHASH" ]; then
    tg_raw "✅ Cycle $CYCLE 延迟部署已确认 $GHASH"
  else
    tg_raw "❌ Cycle $CYCLE 部署失败! Live=$LIVE_HASH Expected=$GHASH"
  fi
fi

echo "🔍 Step 5: QA testing..."
tg_raw "🔍 Cycle $CYCLE: QA testing live site..."

claude --permission-mode bypassPermissions \
  -p "You are the AgentPick QA Agent. Test https://agentpick.dev thoroughly.

1. Run: python3 /Users/pwclaw/.openclaw/workspace/agentpick-router-qa.py
2. Test paid user flow: register → search → check results
3. Check all main pages load (/, /connect, /dashboard, /products/tavily)
4. Check for visual regressions
5. Test API: POST /api/v1/router/search with Bearer auth

Write results to QA_REPORT.md with:
- Score: X/Y
- P0 blockers (if any)
- P1 issues (if any)
- What looks good

End with exactly PASS or FAIL on the last line." \
  --output-format text 2>&1 | tee "$LOGDIR/qa_${CYCLE}.log" | tail -10

QA_STATUS=$(tail -1 QA_REPORT.md 2>/dev/null || echo "UNKNOWN")
SCORE=$(grep -o '[0-9]*/[0-9]*' QA_REPORT.md 2>/dev/null | head -1 || echo "?/?")

if echo "$QA_STATUS" | grep -qi "PASS"; then
  tg_raw "✅ Cycle $CYCLE 完成! QA: $SCORE PASS"
else
  tg_raw "⚠️ Cycle $CYCLE 完成. QA: $SCORE — 有issue，下轮修复"
fi

# ═══════════════════════════════════════════
# STEP 6: Immediately start next cycle (zero idle)
# ═══════════════════════════════════════════
NEXT=$((CYCLE + 1))
echo ""
echo "🔄 Cycle $CYCLE complete. Starting cycle $NEXT immediately..."
echo "================================================"

# Recursive call — continuous development
exec bash "$0" "$NEXT"
