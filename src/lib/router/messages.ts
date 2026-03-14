/**
 * CRM-through-agent: generate context-aware messages for router API responses.
 * Returns null most of the time — only surfaces on meaningful events.
 */

export interface MessageContext {
  /** True when this is the developer's very first call (totalCalls === 0 before increment) */
  isFirstCall: boolean;
  /** Whether a fallback tool was used for this response */
  fallbackUsed: boolean;
  /** The tool that ultimately served the response */
  toolUsed: string;
  /** End-to-end latency in milliseconds */
  latencyMs: number;
  /** Developer plan: FREE, STARTER, PRO, SCALE, ENTERPRISE */
  plan: string;
  /** Calls used this month (before this call) */
  monthlyUsed: number;
  /** Monthly call limit (null = unlimited) */
  monthlyLimit: number | null;
  /** Total fallbacks ever used (before this call) */
  totalFallbacks: number;
}

/**
 * Return a helpful, non-spammy message to include in meta.message.
 * Null means "nothing to say right now" — the default.
 */
export function getRouterMessage(ctx: MessageContext): string | null {
  // First call ever — aha moment
  if (ctx.isFirstCall) {
    const remaining = ctx.monthlyLimit !== null ? ctx.monthlyLimit - 1 : null;
    const remainingStr = remaining !== null
      ? 'You have ' + remaining + ' free calls remaining this month.'
      : '';
    return (
      'Welcome! AgentPick routed your first query through ' +
      ctx.toolUsed +
      ' (' +
      ctx.latencyMs +
      'ms).' +
      (remainingStr ? ' ' + remainingStr : '')
    ).trim();
  }

  // First fallback ever — demonstrate core value
  if (ctx.fallbackUsed && ctx.totalFallbacks === 0) {
    return (
      'Your primary tool was down, so AgentPick auto-switched to ' +
      ctx.toolUsed +
      ' (' +
      ctx.latencyMs +
      'ms). Zero downtime \u2014 this is why routing matters.'
    );
  }

  // Free plan usage warnings
  if (ctx.plan === 'FREE' && ctx.monthlyLimit !== null && ctx.monthlyLimit > 0) {
    const pct = ctx.monthlyUsed / ctx.monthlyLimit;
    const callsLeft = ctx.monthlyLimit - ctx.monthlyUsed;

    if (pct >= 0.9) {
      return (
        'Only ' +
        callsLeft +
        ' free call' +
        (callsLeft === 1 ? '' : 's') +
        ' left this month. Upgrade to Pro ($9/mo) for 5,000 calls: https://agentpick.dev/pricing?plan=pro'
      );
    }

    if (pct >= 0.5 && ctx.monthlyUsed % 50 === 0) {
      return (
        "You've used " +
        ctx.monthlyUsed +
        ' of ' +
        ctx.monthlyLimit +
        ' free calls. Pro plan ($9/mo) gives you 10x more: https://agentpick.dev/pricing'
      );
    }
  }

  // Paid users — almost never message them (respect the paying customer)
  return null;
}
