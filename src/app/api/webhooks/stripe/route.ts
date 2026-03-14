import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { isRouterPlanCode, type RouterPlanCode } from '@/lib/router/plans';
import {
  getDeveloperAccountIdFromCheckoutSession,
  getStripeClient,
  getStripeWebhookSecret,
  resolveRouterPlanFromStripePriceId,
} from '@/lib/stripe';

const db = prisma as any;

export const runtime = 'nodejs';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set<Stripe.Subscription.Status>(['active', 'trialing']);
const INACTIVE_SUBSCRIPTION_STATUSES = new Set<Stripe.Subscription.Status>([
  'canceled',
  'incomplete_expired',
  'paused',
  'unpaid',
]);

async function updateDeveloperPlan(developerAccountId: string, plan: RouterPlanCode) {
  await db.developerAccount.updateMany({
    where: { id: developerAccountId },
    data: {
      plan,
      spentThisMonth: 0,
      billingCycleStart: new Date(),
    },
  });
}

function getPlanFromMetadata(metadata: Stripe.Metadata | null | undefined): RouterPlanCode | null {
  const routerPlan = metadata?.routerPlan;
  return isRouterPlanCode(routerPlan) ? routerPlan : null;
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header.', { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(body, signature, getStripeWebhookSecret());
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return new Response('Invalid Stripe signature.', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const developerAccountId = getDeveloperAccountIdFromCheckoutSession(session);
        const routerPlan = getPlanFromMetadata(session.metadata);

        if (developerAccountId && routerPlan) {
          await updateDeveloperPlan(developerAccountId, routerPlan);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.resumed':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const developerAccountId = subscription.metadata?.developerAccountId;
        const routerPlan =
          getPlanFromMetadata(subscription.metadata) ??
          resolveRouterPlanFromStripePriceId(subscription.items.data[0]?.price?.id);

        if (developerAccountId && routerPlan && ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
          await updateDeveloperPlan(developerAccountId, routerPlan);
        } else if (
          developerAccountId &&
          INACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)
        ) {
          await updateDeveloperPlan(developerAccountId, 'FREE');
        }
        break;
      }

      case 'customer.subscription.paused':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const developerAccountId = subscription.metadata?.developerAccountId;

        if (developerAccountId) {
          await updateDeveloperPlan(developerAccountId, 'FREE');
        }
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error('Stripe webhook processing error:', error);
    return new Response('Webhook processing failed.', { status: 500 });
  }

  return Response.json({ received: true });
}
