#!/bin/bash
# AgentPick Autopilot — Orchestration Loop
# Runs: PM → Orchestrator → Claude Code/Codex → Merge → QA → repeat

set -e
REPO="/Users/pwclaw/Desktop/code/agenthunt"
WORKSPACE="/Users/pwclaw/.openclaw/workspace"
CODEX="/opt/homebrew/bin/codex"
BOT="8535747885:AAFZBbF7WsOfzKuJu_s7MxnbRXI8bO3NQDk"
CHAT="5986849183"

# Load API keys
export ANTHROPIC_API_KEY=$(python3 -c "import json; from pathlib import Path; print(json.load(open(Path.home()/'.openclaw/agents/main/agent/auth-profiles.json'))['profiles']['anthropic:default']['key'])")
export OPENAI_API_KEY=$(python3 -c "import json; from pathlib import Path; print(json.load(open(Path.home()/'.openclaw/agents/main/agent/auth-profiles.json'))['profiles']['openai:default']['key'])")

tg() {
  curl -s -X POST "https://api.telegram.org/bot${BOT}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{\"chat_id\": \"${CHAT}\", \"text\": \"$1\"}" > /dev/null 2>&1
}

cd "$REPO"

echo "🚀 AgentPick Autopilot starting..."
tg "🚀 AgentPick Autopilot 启动"

# ═══════════════════════════════════════════
# STEP 1: PM Agent — produce next version spec
# ═══════════════════════════════════════════
echo "📋 Step 1: PM Agent producing NEXT_VERSION.md..."
tg "📋 PM Agent 正在分析当前版本并产出下一版需求..."

claude --print --permission-mode bypassPermissions \
  --model claude-opus-4-6 \
  -p "You are the AgentPick PM Agent. Read PM_AGENT.md for your instructions.

Current context:
- Read QA_REPORT.md if it exists for current bugs
- Check git log --oneline -20 for recent changes
- The site is https://agentpick.dev

Analyze the current state and write NEXT_VERSION.md with 2-3 concrete features for the next iteration.
Focus on the most impactful changes that can be done in 2-4 hours.

Write the output to NEXT_VERSION.md in the repo root." \
  2>&1 | tail -20

if [ ! -f NEXT_VERSION.md ]; then
  echo "❌ PM failed to produce NEXT_VERSION.md"
  tg "❌ PM Agent 失败，没有产出 NEXT_VERSION.md"
  exit 1
fi

tg "✅ PM Agent 完成: $(head -3 NEXT_VERSION.md)"

# ═══════════════════════════════════════════
# STEP 2: Orchestrator — break into tasks
# ═══════════════════════════════════════════
echo "🏗️ Step 2: Orchestrator breaking into tasks..."

RAW_TASKS=$(claude --print --permission-mode bypassPermissions \
  --model claude-opus-4-6 \
  -p "You are the AgentPick Orchestrator. Read ORCHESTRATOR.md and NEXT_VERSION.md.

Break the NEXT_VERSION.md requirements into concrete coding tasks.
For each task, specify:
1. Branch name (feat/xxx)
2. Files to modify
3. Exact implementation spec (what to code)
4. Assign to: claude-code or codex

IMPORTANT: Output ONLY a JSON array, no markdown fences, no explanation:
[{\"branch\": \"feat/xxx\", \"files\": [\"path/to/file\"], \"spec\": \"detailed spec\", \"agent\": \"claude-code\"}]" 2>&1)

# Extract JSON from response (handle markdown fences, extra text)
TASKS=$(echo "$RAW_TASKS" | python3 -c "
import sys, json, re
text = sys.stdin.read()
# Try to find JSON array in the text
m = re.search(r'\[[\s\S]*\]', text)
if m:
    try:
        tasks = json.loads(m.group())
        print(json.dumps(tasks))
    except:
        # Fallback: single task from NEXT_VERSION.md
        print(json.dumps([{
            'branch': 'feat/next-version',
            'files': [],
            'spec': 'Implement the requirements in NEXT_VERSION.md. Read NEXT_VERSION.md first, then implement all Must Have features.',
            'agent': 'claude-code'
        }]))
else:
    print(json.dumps([{
        'branch': 'feat/next-version',
        'files': [],
        'spec': 'Implement the requirements in NEXT_VERSION.md. Read NEXT_VERSION.md first, then implement all Must Have features.',
        'agent': 'claude-code'
    }]))
" 2>/dev/null)

echo "$TASKS" > /tmp/autopilot_tasks.json
TASK_COUNT=$(echo "$TASKS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
tg "🏗️ Orchestrator 拆解了 ${TASK_COUNT} 个任务"

# ═══════════════════════════════════════════
# STEP 3: Execute tasks (Claude Code + Codex)
# ═══════════════════════════════════════════
echo "⚡ Step 3: Executing ${TASK_COUNT} tasks..."

cat /tmp/autopilot_tasks.json | python3 -c "
import sys, json, subprocess, os

tasks = json.load(sys.stdin)
repo = '$REPO'
codex = '$CODEX'

for i, task in enumerate(tasks):
    branch = task.get('branch', f'feat/task-{i}')
    spec = task.get('spec', '')
    agent = task.get('agent', 'claude-code')
    files = ', '.join(task.get('files', []))
    
    print(f'\\n--- Task {i+1}/{len(tasks)}: {branch} ({agent}) ---')
    
    # Create branch
    subprocess.run(['git', 'checkout', 'main'], cwd=repo, capture_output=True)
    subprocess.run(['git', 'pull', '--ff-only'], cwd=repo, capture_output=True)
    subprocess.run(['git', 'checkout', '-b', branch], cwd=repo, capture_output=True)
    
    prompt = f'Implement this task in the AgentPick codebase:\\n\\n{spec}\\n\\nFiles to modify: {files}\\n\\nMake the changes directly. Do not ask for confirmation. Commit when done with message: [{branch}] {spec[:60]}'
    
    if agent == 'codex':
        # Use Codex CLI
        result = subprocess.run(
            [codex, 'exec', '-a', 'full-auto', '--quiet', prompt],
            cwd=repo, capture_output=True, text=True, timeout=600
        )
        print(f'  Codex exit: {result.returncode}')
    else:
        # Use Claude Code
        result = subprocess.run(
            ['claude', '--print', '--permission-mode', 'bypassPermissions',
             '-p', prompt],
            cwd=repo, capture_output=True, text=True, timeout=600
        )
        print(f'  Claude Code exit: {result.returncode}')
    
    # Check if there are changes
    status = subprocess.run(['git', 'status', '--porcelain'], cwd=repo, capture_output=True, text=True)
    if status.stdout.strip():
        subprocess.run(['git', 'add', '-A'], cwd=repo, capture_output=True)
        subprocess.run(['git', 'commit', '-m', f'[{branch}] {spec[:80]}'], cwd=repo, capture_output=True)
        print(f'  ✅ Committed changes')
    else:
        print(f'  ⚠ No changes detected')
    
    # Merge back to main
    subprocess.run(['git', 'checkout', 'main'], cwd=repo, capture_output=True)
    merge = subprocess.run(['git', 'merge', '--no-ff', branch, '-m', f'Merge {branch}'], 
                          cwd=repo, capture_output=True, text=True)
    if merge.returncode == 0:
        print(f'  ✅ Merged to main')
    else:
        print(f'  ❌ Merge conflict: {merge.stderr[:100]}')
        subprocess.run(['git', 'merge', '--abort'], cwd=repo, capture_output=True)
" 2>&1

tg "⚡ 代码任务执行完毕，推送中..."

# Push to trigger Vercel deploy
git push origin main 2>&1 || true

tg "🚀 已推送到 main，Vercel 正在部署..."

# Wait for Vercel deploy
echo "⏳ Waiting 60s for Vercel deploy..."
sleep 60

# ═══════════════════════════════════════════
# STEP 4: QA Agent — test the deployment
# ═══════════════════════════════════════════
echo "🔍 Step 4: QA Agent testing..."
tg "🔍 QA Agent 开始测试..."

QA_RESULT=$(claude --print --permission-mode bypassPermissions \
  --model claude-opus-4-6 \
  -p "You are the AgentPick QA Agent. Read QA_AGENT.md for your instructions.

Run comprehensive tests on https://agentpick.dev:
1. Run: python3 /Users/pwclaw/.openclaw/workspace/agentpick-router-qa.py
2. Test the paid user flow (register → search → dashboard)
3. Check for P0 blockers

Write results to QA_REPORT.md.
At the end, output either PASS or FAIL on a single line." 2>&1)

echo "$QA_RESULT" | tail -5

if echo "$QA_RESULT" | grep -q "PASS"; then
  tg "✅ QA 通过！循环完成。PM Agent 将在下一轮产出新需求。"
  echo "✅ Cycle complete — QA PASSED"
else
  tg "❌ QA 未通过。Bug 已记录在 QA_REPORT.md，Orchestrator 将在下一轮修复。"
  echo "⚠ Cycle complete — QA FAILED (bugs logged)"
fi

echo "🏁 Autopilot cycle complete at $(date)"
tg "🏁 Autopilot 循环完成: $(date '+%H:%M')"
