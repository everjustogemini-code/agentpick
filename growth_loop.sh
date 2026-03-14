#!/bin/bash
# AgentPick Growth Loop — Autonomous growth agent that reviews, grows, and evolves
# Runs every 2 hours, responsible for REVENUE GROWTH

REPO="/Users/pwclaw/Desktop/code/agenthunt"
WORKSPACE="/Users/pwclaw/.openclaw/workspace"
BOT="8535747885:AAFZBbF7WsOfzKuJu_s7MxnbRXI8bO3NQDk"
CHAT="5986849183"
LOGDIR="/tmp/growth_agent"
mkdir -p "$LOGDIR"

export ANTHROPIC_API_KEY=$(python3 -c "import json; from pathlib import Path; print(json.load(open(Path.home()/'.openclaw/agents/main/agent/auth-profiles.json'))['profiles']['anthropic:default']['key'])")

tg_raw() {
  curl -s -X POST "https://api.telegram.org/bot${BOT}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{\"chat_id\": \"${CHAT}\", \"text\": \"$1\", \"parse_mode\": \"HTML\"}" > /dev/null 2>&1
}

cd "$REPO"

CYCLE=${1:-1}
echo "🌱 Growth Loop cycle $CYCLE starting at $(date)"
tg_raw "🌱 Growth Agent cycle $CYCLE starting"

# ═══════════════════════════════════════════
# PHASE 1: REVIEW — What happened since last cycle?
# ═══════════════════════════════════════════
claude --permission-mode bypassPermissions \
  -p "You are the AgentPick Growth Agent. Your ONLY job is REVENUE GROWTH.
Workspace: $(pwd)

# PHASE 1: REVIEW

Read these files and assess current state:
- GROWTH_REPORT.md (last growth report)
- STRATEGY.md (overall strategy)
- QA_REPORT.md (product quality)
- git log --oneline -20 (recent changes)

Then check LIVE metrics:
1. curl -s https://agentpick.dev/api/v1/router/health (is the API working?)
2. curl -s 'https://agentpick.dev/api/v1/agents/register' -X POST -H 'Content-Type: application/json' -d '{\"name\":\"growth-test-$(date +%s)\"}' (can new users register?)
3. Check if key pages load: curl -sI https://agentpick.dev | head -5, curl -sI https://agentpick.dev/pricing | head -5, curl -sI https://agentpick.dev/blog | head -5

Write findings to GROWTH_STATE.md:
- Working: [list what works]
- Broken: [list what's broken — these BLOCK revenue]
- Metrics: registrations, API calls, pages live
- Revenue blockers: [ordered by impact]

# PHASE 2: GROW — Take concrete growth actions

Based on your review, do 3-5 of these actions (pick the highest impact ones):

## Content (AEO/SEO):
- Check if blog posts have proper meta tags for search engines
- Search the web for 'best search API for AI agents' and 'tool routing for AI' — is AgentPick mentioned?
- If not mentioned, identify what content is missing and create it
- Update skill.md and llms.txt if they can be improved (BUT do NOT use backticks inside template literals — use single quotes or escaped backticks)

## Distribution:
- Post to Moltbook (API key: moltbook_sk_AdYBjvbWZZJ4nxt6NaYHM4kr7cSDofL4, Agent ID: f3b7afd4-2b8e-4306-9f37-bf7efbfba31c)
  - Post real benchmark data, not marketing fluff
  - Each post should link back to agentpick.dev
  - Rate limit: 2.5 min between posts, max 2 posts per cycle
  - If API fails, skip and move on

## Conversion:
- Check /pricing page loads and looks correct
- Check /checkout?plan=pro loads
- Check /connect page has clear CTA
- If any conversion page is broken, fix it

## Product:
- If you find bugs that block revenue, fix them directly
- Commit fixes with message '[growth] fix: description'

# PHASE 3: EVOLVE — Update your own strategy

Based on what you learned, update GROWTH_REPORT.md:
\`\`\`
# Growth Report — Cycle $CYCLE ($(date +%Y-%m-%d %H:%M))
## Revenue Blockers (ordered by impact):
## Actions Taken:
## Results:
## Next Cycle Priority:
## Learnings:
\`\`\`

Also update GROWTH_AGENT.md if you discovered better strategies or channels.

# RULES:
- EVERY action must be aimed at getting more registrations or revenue
- If something is broken, fix it — don't just report it
- Be fast. You have 8 minutes.
- Commit and push any changes: git add -A && git commit -m '[growth] cycle $CYCLE' && git push origin main
- After push, deploy: npx vercel --prod --yes" \
  --output-format text 2>&1 | tee "$LOGDIR/cycle_${CYCLE}.log" | tail -20

# Send summary to Telegram
SUMMARY=$(tail -30 "$LOGDIR/cycle_${CYCLE}.log" | head -20)
tg_raw "🌱 Growth cycle $CYCLE done. Check GROWTH_REPORT.md"

# ═══════════════════════════════════════════
# PHASE 4: SCHEDULE NEXT CYCLE
# ═══════════════════════════════════════════
NEXT=$((CYCLE + 1))
echo "🔄 Growth cycle $CYCLE complete. Next cycle $NEXT in 2 hours."
echo "================================================"

# Sleep 2 hours then run again
sleep 7200
exec bash "$0" "$NEXT"
