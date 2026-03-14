#!/bin/bash
# AgentPick Growth Loop — Autonomous growth agent that reviews, grows, and evolves
# Runs every 2 hours, responsible for REVENUE GROWTH

REPO="/Users/pwclaw/Desktop/code/agenthunt"
WORKSPACE="/Users/pwclaw/.openclaw/workspace"
BOT="8535747885:AAFZBbF7WsOfzKuJu_s7MxnbRXI8bO3NQDk"
CHAT="5986849183"
LOGDIR="/tmp/growth_agent"
METRICS_FILE="$LOGDIR/metrics_last.json"
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
# METRICS SNAPSHOT — Fetch & compare with last cycle
# ═══════════════════════════════════════════
echo "📊 Fetching growth metrics..."
METRICS_JSON=$(curl -s https://agentpick.dev/api/v1/admin/growth-metrics 2>/dev/null)
METRICS_STATUS=$?

if [ $METRICS_STATUS -eq 0 ] && [ -n "$METRICS_JSON" ] && echo "$METRICS_JSON" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
  echo "$METRICS_JSON" > "$LOGDIR/metrics_cycle_${CYCLE}.json"

  # Extract key numbers for logging
  TOTAL_AGENTS=$(echo "$METRICS_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['acquisition']['totalAgents'])" 2>/dev/null || echo "?")
  AGENTS_WEEK=$(echo "$METRICS_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['acquisition']['agentsThisWeek'])" 2>/dev/null || echo "?")
  CALLS_TODAY=$(echo "$METRICS_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['acquisition']['routerCallsToday'])" 2>/dev/null || echo "?")
  PAID=$(echo "$METRICS_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['conversion']['paidAccounts'])" 2>/dev/null || echo "?")
  CONVERSION=$(echo "$METRICS_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['conversion']['conversionRate'])" 2>/dev/null || echo "?")

  echo "📈 Metrics — Agents: $TOTAL_AGENTS total, $AGENTS_WEEK this week | Calls today: $CALLS_TODAY | Paid: $PAID ($CONVERSION% conversion)"
  echo "Cycle $CYCLE metrics: agents=$TOTAL_AGENTS agents_week=$AGENTS_WEEK calls_today=$CALLS_TODAY paid=$PAID" >> "$LOGDIR/metrics_history.log"

  # Stall detection: compare with last cycle
  STALLED=false
  if [ -f "$METRICS_FILE" ]; then
    PREV_AGENTS=$(python3 -c "import json; d=json.load(open('$METRICS_FILE')); print(d['acquisition']['totalAgents'])" 2>/dev/null || echo "0")
    PREV_CALLS=$(python3 -c "import json; d=json.load(open('$METRICS_FILE')); print(d['acquisition']['routerCallsToday'])" 2>/dev/null || echo "0")

    if [ "$TOTAL_AGENTS" = "$PREV_AGENTS" ] && [ "$CALLS_TODAY" = "0" ] && [ "$PREV_CALLS" = "0" ]; then
      STALLED=true
      echo "⚠️  STALLED: No new agents or calls since last cycle. Need new strategy."
      tg_raw "⚠️ Growth Agent cycle $CYCLE: STALLED — no new agents or calls. Triggering strategy review."
    fi
  fi

  # Save current metrics as last
  cp "$LOGDIR/metrics_cycle_${CYCLE}.json" "$METRICS_FILE"
else
  echo "⚠️  Could not fetch metrics from https://agentpick.dev/api/v1/admin/growth-metrics"
  STALLED=false
  TOTAL_AGENTS="unknown"
  AGENTS_WEEK="unknown"
  CALLS_TODAY="unknown"
  PAID="unknown"
  CONVERSION="unknown"
fi

# ═══════════════════════════════════════════
# PHASE 1: REVIEW — What happened since last cycle?
# ═══════════════════════════════════════════

# Build AEO section — post scores after checking
AEO_INSTRUCTIONS='## AEO Search Visibility Check:
For each of these queries, search the web and check if agentpick.dev appears in results:
1. "best search API for AI agents"
2. "tool routing for AI agents"
3. "AI agent API benchmark"

For each query:
- Search using a web search tool or curl a search API
- Score: 0 = not in top 20, 50 = found on page 2 (positions 11-20), 100 = top 3
- After checking, POST the score:
  curl -s -X POST https://agentpick.dev/api/v1/admin/growth-metrics/aeo-score \
    -H "Content-Type: application/json" \
    -d '"'"'{"query": "QUERY_HERE", "score": SCORE, "notes": "NOTES_HERE"}'"'"'
- Do this for ALL 3 queries'

STALL_INSTRUCTIONS=""
if [ "$STALLED" = "true" ]; then
  STALL_INSTRUCTIONS='
## ⚠️ STALL ALERT — HIGHEST PRIORITY
The metrics show ZERO new agents and ZERO API calls since last cycle.
This is an emergency. Before doing anything else:
1. Identify why no one is registering (check /connect, /pricing, /api/v1/agents/register)
2. Check if there are any error pages or broken flows
3. Brainstorm 3 new distribution channels not yet tried
4. Write these as immediate action items at the top of GROWTH_REPORT.md
5. Execute the most promising one now'
fi

claude --permission-mode bypassPermissions \
  -p "You are the AgentPick Growth Agent. Your ONLY job is REVENUE GROWTH.
Workspace: $(pwd)

# CURRENT METRICS (Cycle $CYCLE)
- Total Agents: $TOTAL_AGENTS
- Agents This Week: $AGENTS_WEEK
- Router Calls Today: $CALLS_TODAY
- Paid Accounts: $PAID ($CONVERSION% conversion)
$STALL_INSTRUCTIONS

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
$AEO_INSTRUCTIONS
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
## Metrics Snapshot:
- Total Agents: $TOTAL_AGENTS | This Week: $AGENTS_WEEK | Calls Today: $CALLS_TODAY | Paid: $PAID
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
tg_raw "🌱 Growth cycle $CYCLE done. Agents: $TOTAL_AGENTS (+$AGENTS_WEEK/wk) | Calls today: $CALLS_TODAY | Paid: $PAID. Check GROWTH_REPORT.md"

# ═══════════════════════════════════════════
# PHASE 4: SCHEDULE NEXT CYCLE
# ═══════════════════════════════════════════
NEXT=$((CYCLE + 1))
echo "🔄 Growth cycle $CYCLE complete. Next cycle $NEXT in 2 hours."
echo "================================================"

# Sleep 2 hours then run again
sleep 7200
exec bash "$0" "$NEXT"
