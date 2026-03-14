import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  updateMany: vi.fn(),
  constructEvent: vi.fn(),
  resolveRouterPlanFromStripePriceId: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    developerAccount: {
      updateMany: mocks.updateMany,
    },
  },
}));

vi.mock('@/lib/stripe', async () => {
  const actual = await vi.importActual<typeof import('@/lib/stripe')>('@/lib/stripe');

  return {
    ...actual,
    getStripeClient: () => ({
      webhooks: {
        constructEvent: mocks.constructEvent,
      },
    }),
    getStripeWebhookSecret: () => 'whsec_test',
    resolveRouterPlanFromStripePriceId: mocks.resolveRouterPlanFromStripePriceId,
  };
});

describe('stripe webhook route', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates the developer account when checkout completes without metadata account id', async () => {
    const now = new Date('2026-03-14T08:00:00.000Z');
    vi.setSystemTime(now);

    mocks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          client_reference_id: 'dev_from_client_ref',
          metadata: {
            routerPlan: 'STARTER',
          },
        },
      },
    });

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const response = await POST(
      new Request('https://agentpick.dev/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'sig_test',
        },
        body: 'payload',
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: 'dev_from_client_ref' },
      data: {
        plan: 'STARTER',
        spentThisMonth: 0,
        billingCycleStart: now,
      },
    });
  });

  it('resolves the target plan from the Stripe price id on subscription updates', async () => {
    const now = new Date('2026-03-14T09:00:00.000Z');
    vi.setSystemTime(now);
    mocks.resolveRouterPlanFromStripePriceId.mockReturnValue('PRO');
    mocks.constructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        object: {
          metadata: {
            developerAccountId: 'dev_456',
          },
          status: 'active',
          items: {
            data: [
              {
                price: {
                  id: 'price_growth_456',
                },
              },
            ],
          },
        },
      },
    });

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const response = await POST(
      new Request('https://agentpick.dev/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'sig_test',
        },
        body: 'payload',
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.resolveRouterPlanFromStripePriceId).toHaveBeenCalledWith('price_growth_456');
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: 'dev_456' },
      data: {
        plan: 'PRO',
        spentThisMonth: 0,
        billingCycleStart: now,
      },
    });
  });

  it('downgrades paused subscriptions back to free', async () => {
    const now = new Date('2026-03-14T10:00:00.000Z');
    vi.setSystemTime(now);
    mocks.constructEvent.mockReturnValue({
      type: 'customer.subscription.paused',
      data: {
        object: {
          metadata: {
            developerAccountId: 'dev_789',
          },
          status: 'paused',
          items: {
            data: [],
          },
        },
      },
    });

    const { POST } = await import('@/app/api/webhooks/stripe/route');
    const response = await POST(
      new Request('https://agentpick.dev/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': 'sig_test',
        },
        body: 'payload',
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: 'dev_789' },
      data: {
        plan: 'FREE',
        spentThisMonth: 0,
        billingCycleStart: now,
      },
    });
  });
});
