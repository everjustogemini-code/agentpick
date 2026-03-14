export type RouterPlanCode = 'FREE' | 'STARTER' | 'PRO' | 'SCALE' | 'ENTERPRISE';
export type UpgradePlanSlug = 'pro' | 'growth' | 'scale';

type UpgradePlanConfig = {
  slug: UpgradePlanSlug;
  label: string;
  routerPlan: RouterPlanCode;
  monthlyPriceUsd: number;
  monthlyCalls: number;
  dailyCalls: number;
  description: string;
  priceEnvKey: 'STRIPE_PRICE_PRO_MONTHLY' | 'STRIPE_PRICE_GROWTH_MONTHLY' | 'STRIPE_PRICE_SCALE_MONTHLY';
  overagePerCall: number | null;
};

export const ROUTER_PLAN_DAILY_LIMITS: Record<RouterPlanCode, number> = {
  FREE: 100,
  STARTER: 1000,
  PRO: 5000,
  SCALE: 20000,
  ENTERPRISE: 1_000_000,
};

export const ROUTER_PLAN_MONTHLY_LIMITS: Record<RouterPlanCode, number | null> = {
  FREE: 500,
  STARTER: 5000,
  PRO: 25000,
  SCALE: 100000,
  ENTERPRISE: 1_000_000,
};

export const ROUTER_PLAN_OVERAGE_PER_CALL: Record<RouterPlanCode, number | null> = {
  FREE: null,
  STARTER: 0.002,
  PRO: 0.001,
  SCALE: 0.0008,
  ENTERPRISE: null,
};

export const ROUTER_PLAN_LABELS: Record<RouterPlanCode, string> = {
  FREE: 'Free',
  STARTER: 'Pro',
  PRO: 'Growth',
  SCALE: 'Scale',
  ENTERPRISE: 'Enterprise',
};

export const ROUTER_PLAN_SLUGS: Record<RouterPlanCode, string> = {
  FREE: 'free',
  STARTER: 'pro',
  PRO: 'growth',
  SCALE: 'scale',
  ENTERPRISE: 'enterprise',
};

const ROUTER_PLAN_RANK: Record<RouterPlanCode, number> = {
  FREE: 0,
  STARTER: 1,
  PRO: 2,
  SCALE: 3,
  ENTERPRISE: 4,
};

export const UPGRADE_PLAN_CONFIG: Record<UpgradePlanSlug, UpgradePlanConfig> = {
  pro: {
    slug: 'pro',
    label: 'Pro',
    routerPlan: 'STARTER',
    monthlyPriceUsd: 9,
    monthlyCalls: 5000,
    dailyCalls: 1000,
    description: 'For solo builders routing real production traffic.',
    priceEnvKey: 'STRIPE_PRICE_PRO_MONTHLY',
    overagePerCall: 0.002,
  },
  growth: {
    slug: 'growth',
    label: 'Growth',
    routerPlan: 'PRO',
    monthlyPriceUsd: 29,
    monthlyCalls: 25000,
    dailyCalls: 5000,
    description: 'For teams that need headroom before they hit scale pain.',
    priceEnvKey: 'STRIPE_PRICE_GROWTH_MONTHLY',
    overagePerCall: 0.001,
  },
  scale: {
    slug: 'scale',
    label: 'Scale',
    routerPlan: 'SCALE',
    monthlyPriceUsd: 79,
    monthlyCalls: 100000,
    dailyCalls: 20000,
    description: 'For high-volume agents and multi-team deployments.',
    priceEnvKey: 'STRIPE_PRICE_SCALE_MONTHLY',
    overagePerCall: 0.0008,
  },
};

export const PRICING_CARD_PLANS = [
  {
    slug: 'free',
    label: 'Free',
    routerPlan: 'FREE' as RouterPlanCode,
    monthlyPriceUsd: 0,
    monthlyCalls: 500,
    dailyCalls: 100,
    description: 'Try the router with one key and the full dashboard.',
    overagePerCall: null as number | null,
    features: [
      '500 calls/mo · hard cap',
      '100 calls per day',
      'Bring your own tool API keys',
      'AI routing plus auto-fallback',
      'Usage dashboard and call history',
    ],
    ctaLabel: 'Start free',
  },
  {
    slug: 'pro',
    label: 'Pro',
    routerPlan: UPGRADE_PLAN_CONFIG.pro.routerPlan,
    monthlyPriceUsd: UPGRADE_PLAN_CONFIG.pro.monthlyPriceUsd,
    monthlyCalls: UPGRADE_PLAN_CONFIG.pro.monthlyCalls,
    dailyCalls: UPGRADE_PLAN_CONFIG.pro.dailyCalls,
    description: UPGRADE_PLAN_CONFIG.pro.description,
    overagePerCall: UPGRADE_PLAN_CONFIG.pro.overagePerCall,
    features: [
      '5,000 included calls/mo',
      'then $0.002/call overage',
      '1,000 calls per day',
      'Saved keys plus higher traffic limits',
      'Built for production workloads',
    ],
    ctaLabel: 'Upgrade to Pro',
  },
  {
    slug: 'growth',
    label: 'Growth',
    routerPlan: UPGRADE_PLAN_CONFIG.growth.routerPlan,
    monthlyPriceUsd: UPGRADE_PLAN_CONFIG.growth.monthlyPriceUsd,
    monthlyCalls: UPGRADE_PLAN_CONFIG.growth.monthlyCalls,
    dailyCalls: UPGRADE_PLAN_CONFIG.growth.dailyCalls,
    description: UPGRADE_PLAN_CONFIG.growth.description,
    overagePerCall: UPGRADE_PLAN_CONFIG.growth.overagePerCall,
    features: [
      '25,000 included calls/mo',
      'then $0.001/call overage',
      '5,000 calls per day',
      'Saved keys plus higher traffic limits',
      'Headroom for multi-agent traffic',
    ],
    ctaLabel: 'Upgrade to Growth',
  },
  {
    slug: 'scale',
    label: 'Scale',
    routerPlan: UPGRADE_PLAN_CONFIG.scale.routerPlan,
    monthlyPriceUsd: UPGRADE_PLAN_CONFIG.scale.monthlyPriceUsd,
    monthlyCalls: UPGRADE_PLAN_CONFIG.scale.monthlyCalls,
    dailyCalls: UPGRADE_PLAN_CONFIG.scale.dailyCalls,
    description: UPGRADE_PLAN_CONFIG.scale.description,
    overagePerCall: UPGRADE_PLAN_CONFIG.scale.overagePerCall,
    features: [
      '100,000 included calls/mo',
      'then $0.0008/call overage',
      '20,000 calls per day',
      'Best per-call rate for high volume',
      'Multi-team agent deployments',
    ],
    ctaLabel: 'Upgrade to Scale',
  },
] as const;

export function isRouterPlanCode(value: unknown): value is RouterPlanCode {
  return (
    value === 'FREE' ||
    value === 'STARTER' ||
    value === 'PRO' ||
    value === 'SCALE' ||
    value === 'ENTERPRISE'
  );
}

export function normalizeUpgradePlan(value: unknown): UpgradePlanSlug | null {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'pro' || normalized === 'growth' || normalized === 'scale'
    ? normalized
    : null;
}

export function getRouterPlanLabel(plan: string): string {
  return isRouterPlanCode(plan) ? ROUTER_PLAN_LABELS[plan] : plan;
}

export function getRouterPlanSlug(plan: string): string {
  return isRouterPlanCode(plan) ? ROUTER_PLAN_SLUGS[plan] : plan.toLowerCase();
}

export function isPlanAtLeast(currentPlan: string, targetPlan: RouterPlanCode): boolean {
  if (!isRouterPlanCode(currentPlan)) return false;
  return ROUTER_PLAN_RANK[currentPlan] >= ROUTER_PLAN_RANK[targetPlan];
}
