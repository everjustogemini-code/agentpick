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

export async function POST(request: NextRequest) {
  try {
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

    const successUrl = `${getAppBaseUrl(request)}/pricing?checkout=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${getAppBaseUrl(request)}/pricing?checkout=cancelled&plan=${plan}`;

    try {
      const stripe = getStripeClient();
      const metadata = buildStripeCheckoutMetadata({
        developerAccountId: account.id,
        agentId: agent.id,
        plan,
      });

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        billing_address_collection: 'auto',
        allow_promotion_codes: true,
        success_url: successUrl,
        cancel_url: cancelUrl,
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

      if (!session.url) {
        return apiError('INTERNAL_ERROR', 'Stripe did not return a checkout URL.', 500);
      }

      return Response.json({
        checkoutUrl: session.url,
        sessionId: session.id,
        plan,
        planLabel: targetPlan.label,
        monthlyPriceUsd: targetPlan.monthlyPriceUsd,
        monthlyCalls: targetPlan.monthlyCalls,
      });
    } catch (stripeErr) {
      console.error('Stripe checkout session error:', stripeErr);
      const message =
        stripeErr instanceof Error && stripeErr.message.includes('STRIPE_')
          ? 'Stripe billing is not configured yet.'
          : 'Unable to create a Stripe checkout session.';

      return apiError('INTERNAL_ERROR', message, 500);
    }
  } catch (err) {
    const reqId = request.headers.get('x-request-id') ?? 'unknown';
    console.error(`[${reqId}] POST /api/v1/router/upgrade error:`, err);
    return apiError('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }
}
