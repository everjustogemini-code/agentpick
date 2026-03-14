import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authenticateAgent: vi.fn(),
  ensureDeveloperAccount: vi.fn(),
  createCheckoutSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authenticateAgent: mocks.authenticateAgent,
}));

vi.mock('@/lib/router/sdk', () => ({
  ensureDeveloperAccount: mocks.ensureDeveloperAccount,
}));

vi.mock('@/lib/stripe', async () => {
  const actual = await vi.importActual<typeof import('@/lib/stripe')>('@/lib/stripe');

  return {
    ...actual,
    getAppBaseUrl: () => 'https://agentpick.dev',
    getStripeClient: () => ({
      checkout: {
        sessions: {
          create: mocks.createCheckoutSession,
        },
      },
    }),
    getStripePriceId: (plan: 'pro' | 'growth') =>
      plan === 'pro' ? 'price_pro_123' : 'price_growth_456',
  };
});

function createRequest(body: unknown) {
  return new Request('https://agentpick.dev/api/v1/router/upgrade', {
    method: 'POST',
    headers: {
      authorization: 'Bearer ah_live_sk_test',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('router upgrade route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateAgent.mockResolvedValue({
      id: 'agent_123',
      ownerEmail: 'builder@agentpick.dev',
    });
    mocks.ensureDeveloperAccount.mockResolvedValue({
      id: 'dev_123',
      plan: 'FREE',
    });
    mocks.createCheckoutSession.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
    });
  });

  it('creates a hosted Stripe checkout session for growth', async () => {
    const { POST } = await import('@/app/api/v1/router/upgrade/route');
    const response = await POST(createRequest({ plan: 'growth' }) as never);

    expect(response.status).toBe(200);
    expect(mocks.createCheckoutSession).toHaveBeenCalledWith({
      mode: 'subscription',
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      success_url: 'https://agentpick.dev/dashboard?upgraded=growth',
      cancel_url: 'https://agentpick.dev/pricing?checkout=cancelled&plan=growth',
      client_reference_id: 'dev_123',
      customer_email: 'builder@agentpick.dev',
      line_items: [
        {
          price: 'price_growth_456',
          quantity: 1,
        },
      ],
      metadata: {
        developerAccountId: 'dev_123',
        agentId: 'agent_123',
        requestedPlan: 'growth',
        routerPlan: 'PRO',
      },
      subscription_data: {
        metadata: {
          developerAccountId: 'dev_123',
          agentId: 'agent_123',
          requestedPlan: 'growth',
          routerPlan: 'PRO',
        },
      },
    });

    await expect(response.json()).resolves.toMatchObject({
      checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_123',
      sessionId: 'cs_test_123',
      plan: 'growth',
      planLabel: 'Growth',
      monthlyPriceUsd: 99,
      monthlyCalls: 25000,
    });
  });

  it('rejects plans outside the public upgrade catalog', async () => {
    const { POST } = await import('@/app/api/v1/router/upgrade/route');
    const response = await POST(createRequest({ plan: 'scale' }) as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'plan must be "pro" or "growth".',
      },
    });
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('blocks duplicate upgrades when the account is already on growth', async () => {
    mocks.ensureDeveloperAccount.mockResolvedValue({
      id: 'dev_123',
      plan: 'PRO',
    });

    const { POST } = await import('@/app/api/v1/router/upgrade/route');
    const response = await POST(createRequest({ plan: 'growth' }) as never);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: 'PLAN_CONFLICT',
        message: 'Growth is already active on this account.',
      },
    });
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });
});
