import { afterEach, describe, expect, it } from 'vitest';
import { getBillingPeriodStart } from '@/lib/router/billing';
import {
  getRouterPlanLabel,
  isPlanAtLeast,
  normalizeUpgradePlan,
} from '@/lib/router/plans';
import {
  buildStripeCheckoutMetadata,
  getAppBaseUrl,
  getDeveloperAccountIdFromCheckoutSession,
  resolveRouterPlanFromStripePriceId,
} from '@/lib/stripe';

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
  it('builds checkout metadata with the mapped router plan', () => {
    expect(
      buildStripeCheckoutMetadata({
        developerAccountId: 'dev_123',
        agentId: 'agent_123',
        plan: 'pro',
      }),
    ).toEqual({
      developerAccountId: 'dev_123',
      agentId: 'agent_123',
      requestedPlan: 'pro',
      routerPlan: 'STARTER',
    });
  });

  it('prefers metadata over client reference id when resolving checkout account ids', () => {
    expect(
      getDeveloperAccountIdFromCheckoutSession({
        client_reference_id: 'dev_client_ref',
        metadata: {
          developerAccountId: 'dev_metadata',
        },
      } as never),
    ).toBe('dev_metadata');

    expect(
      getDeveloperAccountIdFromCheckoutSession({
        client_reference_id: 'dev_client_ref',
        metadata: {},
      } as never),
    ).toBe('dev_client_ref');
  });

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

describe('router billing period helpers', () => {
  it('returns a valid billing period start when a stored date exists', () => {
    const billingCycleStart = new Date('2026-03-10T12:30:00.000Z');
    expect(getBillingPeriodStart(billingCycleStart)).toEqual(billingCycleStart);
  });

  it('falls back to the provided date when the stored billing date is missing', () => {
    const fallback = new Date('2026-03-14T00:00:00.000Z');
    expect(getBillingPeriodStart(null, fallback)).toEqual(fallback);
    expect(getBillingPeriodStart('not-a-date', fallback)).toEqual(fallback);
  });
});
