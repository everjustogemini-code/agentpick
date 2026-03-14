import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { ensureDeveloperAccount } from '@/lib/router/sdk';
import {
  UPGRADE_PLAN_CONFIG,
  getRouterPlanLabel,
  isPlanAtLeast,
  normalizeUpgradePlan,
} from '@/lib/router/plans';
import {
  buildStripeCheckoutMetadata,
  getAppBaseUrl,
  getStripeClient,
  getStripePriceId,
} from '@/lib/stripe';
import { apiError } from '@/types';

export const runtime = 'nodejs';

/**
 * POST /api/v1/checkout/session
 * Creates a Stripe Checkout Session with ui_mode='embedded'.
 * Returns clientSecret for use with <EmbeddedCheckout />.
 *
 * Body: { plan: "pro" | "growth" | "scale" }
 * Auth: Bearer <agentpick_api_key>
 */
export async function POST(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  const account = await ensureDeveloperAccount(agent.id);

  let body: { plan?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  const plan = normalizeUpgradePlan(body.plan);
  if (!plan) {
    return apiError('VALIDATION_ERROR', 'plan must be "pro", "growth", or "scale".', 400);
  }

  const targetPlan = UPGRADE_PLAN_CONFIG[plan];
  if (isPlanAtLeast(account.plan, targetPlan.routerPlan)) {
    return apiError(
      'PLAN_CONFLICT',
      `${getRouterPlanLabel(account.plan)} is already active on this account.`,
      409,
      { details: { currentPlan: account.plan } },
    );
  }

  const baseUrl = getAppBaseUrl(request);
  const returnUrl = `${baseUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`;

  try {
    const stripe = getStripeClient();
    const metadata = buildStripeCheckoutMetadata({
      developerAccountId: account.id,
      agentId: agent.id,
      plan,
    });

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'subscription',
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      return_url: returnUrl,
      client_reference_id: account.id,
      customer_email: agent.ownerEmail ?? undefined,
      line_items: [
        {
          price: getStripePriceId(plan),
          quantity: 1,
        },
      ],
      metadata,
      subscription_data: {
        metadata,
      },
    });

    if (!session.client_secret) {
      return apiError('INTERNAL_ERROR', 'Stripe did not return a client secret.', 500);
    }

    return Response.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
      plan,
      planLabel: targetPlan.label,
      monthlyPriceUsd: targetPlan.monthlyPriceUsd,
    });
  } catch (error) {
    console.error('Stripe embedded checkout session error:', error);
    const message =
      error instanceof Error
        ? `Checkout error: ${error.message}`
        : 'Unable to create a Stripe checkout session.';

    return apiError('INTERNAL_ERROR', message, 500);
  }
}
