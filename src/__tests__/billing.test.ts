import { afterEach, describe, expect, it } from 'vitest';
import {
  getRouterPlanLabel,
  isPlanAtLeast,
  normalizeUpgradePlan,
} from '@/lib/router/plans';
import { getAppBaseUrl, resolveRouterPlanFromStripePriceId } from '@/lib/stripe';

const originalEnv = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  APP_URL: process.env.APP_URL,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  VERCEL_URL: process.env.VERCEL_URL,
  STRIPE_PRICE_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
  STRIPE_PRICE_GROWTH_MONTHLY: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
};

afterEach(() => {
  process.env.NEXT_PUBLIC_APP_URL = originalEnv.NEXT_PUBLIC_APP_URL;
  process.env.APP_URL = originalEnv.APP_URL;
  process.env.VERCEL_PROJECT_PRODUCTION_URL = originalEnv.VERCEL_PROJECT_PRODUCTION_URL;
  process.env.VERCEL_URL = originalEnv.VERCEL_URL;
  process.env.STRIPE_PRICE_PRO_MONTHLY = originalEnv.STRIPE_PRICE_PRO_MONTHLY;
  process.env.STRIPE_PRICE_GROWTH_MONTHLY = originalEnv.STRIPE_PRICE_GROWTH_MONTHLY;
});

describe('router billing helpers', () => {
  it('normalizes paid upgrade plans', () => {
    expect(normalizeUpgradePlan('PRO')).toBe('pro');
    expect(normalizeUpgradePlan('growth')).toBe('growth');
    expect(normalizeUpgradePlan('enterprise')).toBeNull();
  });

  it('maps internal plan codes to marketing labels', () => {
    expect(getRouterPlanLabel('FREE')).toBe('Free');
    expect(getRouterPlanLabel('STARTER')).toBe('Pro');
    expect(getRouterPlanLabel('PRO')).toBe('Growth');
  });

  it('compares plan ranks correctly', () => {
    expect(isPlanAtLeast('PRO', 'STARTER')).toBe(true);
    expect(isPlanAtLeast('STARTER', 'PRO')).toBe(false);
  });
});

describe('stripe billing helpers', () => {
  it('prefers configured app url for checkout redirects', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'agentpick.dev/';
    process.env.APP_URL = '';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = '';
    process.env.VERCEL_URL = '';

    expect(getAppBaseUrl(new Request('https://preview.agentpick.dev/api/v1/router/upgrade'))).toBe(
      'https://agentpick.dev',
    );
  });

  it('falls back to request origin when no app url is configured', () => {
    process.env.NEXT_PUBLIC_APP_URL = '';
    process.env.APP_URL = '';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = '';
    process.env.VERCEL_URL = '';

    expect(getAppBaseUrl(new Request('https://preview.agentpick.dev/api/v1/router/upgrade'))).toBe(
      'https://preview.agentpick.dev',
    );
  });

  it('resolves router plans from configured Stripe price ids', () => {
    process.env.STRIPE_PRICE_PRO_MONTHLY = 'price_pro_123';
    process.env.STRIPE_PRICE_GROWTH_MONTHLY = 'price_growth_456';

    expect(resolveRouterPlanFromStripePriceId('price_pro_123')).toBe('STARTER');
    expect(resolveRouterPlanFromStripePriceId('price_growth_456')).toBe('PRO');
    expect(resolveRouterPlanFromStripePriceId('price_unknown')).toBeNull();
  });
});
