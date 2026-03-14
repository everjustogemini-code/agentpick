export type RouterPlanCode = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
export type UpgradePlanSlug = 'pro' | 'growth';

type UpgradePlanConfig = {
  slug: UpgradePlanSlug;
  label: string;
  routerPlan: RouterPlanCode;
  monthlyPriceUsd: number;
  monthlyCalls: number;
  dailyCalls: number;
  description: string;
  priceEnvKey: 'STRIPE_PRICE_PRO_MONTHLY' | 'STRIPE_PRICE_GROWTH_MONTHLY';
};

export const ROUTER_PLAN_DAILY_LIMITS: Record<RouterPlanCode, number> = {
  FREE: 100,
  STARTER: 1000,
  PRO: 10000,
  ENTERPRISE: 1_000_000,
};

export const ROUTER_PLAN_MONTHLY_LIMITS: Record<RouterPlanCode, number | null> = {
  FREE: 3000,
  STARTER: 10000,
  PRO: 100000,
  ENTERPRISE: 1_000_000,
};

export const ROUTER_PLAN_LABELS: Record<RouterPlanCode, string> = {
  FREE: 'Free',
  STARTER: 'Pro',
  PRO: 'Growth',
  ENTERPRISE: 'Enterprise',
};

export const ROUTER_PLAN_SLUGS: Record<RouterPlanCode, string> = {
  FREE: 'free',
  STARTER: 'pro',
  PRO: 'growth',
  ENTERPRISE: 'enterprise',
};

const ROUTER_PLAN_RANK: Record<RouterPlanCode, number> = {
  FREE: 0,
  STARTER: 1,
  PRO: 2,
  ENTERPRISE: 3,
};

export const UPGRADE_PLAN_CONFIG: Record<UpgradePlanSlug, UpgradePlanConfig> = {
  pro: {
    slug: 'pro',
    label: 'Pro',
    routerPlan: 'STARTER',
    monthlyPriceUsd: 29,
    monthlyCalls: 10000,
    dailyCalls: 1000,
    description: 'For solo builders routing real production traffic.',
    priceEnvKey: 'STRIPE_PRICE_PRO_MONTHLY',
  },
  growth: {
    slug: 'growth',
    label: 'Growth',
    routerPlan: 'PRO',
    monthlyPriceUsd: 99,
    monthlyCalls: 100000,
    dailyCalls: 10000,
    description: 'For teams that need headroom before they hit scale pain.',
    priceEnvKey: 'STRIPE_PRICE_GROWTH_MONTHLY',
  },
};

export const PRICING_CARD_PLANS = [
  {
    slug: 'free',
    label: 'Free',
    routerPlan: 'FREE' as RouterPlanCode,
    monthlyPriceUsd: 0,
    monthlyCalls: 3000,
    dailyCalls: 100,
    description: 'Try the router with one key and the full dashboard.',
    features: [
      '3,000 routed calls each month',
      '100 calls per day',
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
    features: [
      '10,000 routed calls each month',
      '1,000 calls per day',
      'Bring your own tool API keys',
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
    features: [
      '100,000 routed calls each month',
      '10,000 calls per day',
      'Bring your own tool API keys',
      'Headroom for multi-agent traffic',
    ],
    ctaLabel: 'Upgrade to Growth',
  },
] as const;

export function isRouterPlanCode(value: unknown): value is RouterPlanCode {
  return value === 'FREE' || value === 'STARTER' || value === 'PRO' || value === 'ENTERPRISE';
}

export function normalizeUpgradePlan(value: unknown): UpgradePlanSlug | null {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'pro' || normalized === 'growth' ? normalized : null;
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
