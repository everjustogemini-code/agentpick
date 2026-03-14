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
echo "📋 Step 1: PM producing NEXT_VERSION.md..."

claude --permission-mode bypassPermissions \
  -p "You are the AgentPick PM. Your workspace is $(pwd).

INSTRUCTIONS:
1. Read QA_REPORT.md if it exists
2. Read git log --oneline -20 for recent changes  
3. Check the live site https://agentpick.dev
4. Write NEXT_VERSION.md with exactly 3 must-have features

FOCUS FOR THIS CYCLE:
- Major UI upgrade — introduce modern design components (glassmorphism, animated cards, micro-interactions, gradient backgrounds, better typography)
- Fix any P0/P1 bugs from QA
- One new feature that increases developer adoption

The goal: ship a visually impressive version every cycle. AgentPick should look like a premium product, not a hackathon project.

Write NEXT_VERSION.md now. Be specific about UI components and design specs." \
  --output-format text 2>&1 | tee "$LOGDIR/pm_${CYCLE}.log" | tail -5

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

TASK_CLAUDE_CODE.md — The harder task (new features, complex UI components, API endpoints, database changes). Claude Code excels at multi-file architectural changes.

TASK_CODEX.md — The simpler but important task (bug fixes, component styling, test writing, documentation, copy changes). Codex excels at focused single-file changes.

RULES:
- Tasks MUST NOT touch the same files (prevent merge conflicts)
- Each task file must list EXACTLY which files to create/modify
- Include full design specs (colors, spacing, animations in CSS/Tailwind)
- Be extremely specific — the coding agent should not need to make design decisions

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

# Push
git push origin main 2>&1 || true
tg_raw "🚀 Cycle $CYCLE: Code merged and pushed. Vercel deploying..."

# Clean up branches
git branch -d "feat/cycle-${CYCLE}-cc" "feat/cycle-${CYCLE}-codex" 2>/dev/null

echo "✅ Merged and pushed"

# ═══════════════════════════════════════════
# STEP 5: Wait for deploy, then QA
# ═══════════════════════════════════════════
echo "⏳ Waiting 90s for Vercel deploy..."
sleep 90

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
