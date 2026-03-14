import Stripe from 'stripe';
import { UPGRADE_PLAN_CONFIG, type RouterPlanCode, type UpgradePlanSlug } from '@/lib/router/plans';

let stripeClient: Stripe | null = null;
const STRIPE_PRICE_PLAN_ENV_MAP: Array<{
  envKey: 'STRIPE_PRICE_PRO_MONTHLY' | 'STRIPE_PRICE_GROWTH_MONTHLY' | 'STRIPE_PRICE_SCALE_MONTHLY';
  routerPlan: RouterPlanCode;
}> = [
  { envKey: 'STRIPE_PRICE_PRO_MONTHLY', routerPlan: 'STARTER' },
  { envKey: 'STRIPE_PRICE_GROWTH_MONTHLY', routerPlan: 'PRO' },
  { envKey: 'STRIPE_PRICE_SCALE_MONTHLY', routerPlan: 'SCALE' },
];

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

function normalizeBaseUrl(url: string): string {
  const withProtocol =
    url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  return withProtocol.replace(/\/$/, '');
}

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getRequiredEnv('STRIPE_SECRET_KEY'), {
      appInfo: {
        name: 'AgentPick',
        version: '0.1.0',
      },
      httpClient: Stripe.createFetchHttpClient(),
    });
  }

  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  return getRequiredEnv('STRIPE_WEBHOOK_SECRET');
}

export function getStripePriceId(plan: UpgradePlanSlug): string {
  return getRequiredEnv(UPGRADE_PLAN_CONFIG[plan].priceEnvKey);
}

export function resolveRouterPlanFromStripePriceId(
  priceId: string | null | undefined,
): RouterPlanCode | null {
  if (!priceId) return null;

  for (const mapping of STRIPE_PRICE_PLAN_ENV_MAP) {
    const configuredPriceId = process.env[mapping.envKey];
    if (configuredPriceId && configuredPriceId === priceId) {
      return mapping.routerPlan;
    }
  }

  return null;
}

export function buildStripeCheckoutMetadata(input: {
  developerAccountId: string;
  agentId: string;
  plan: UpgradePlanSlug;
}) {
  const config = UPGRADE_PLAN_CONFIG[input.plan];

  return {
    developerAccountId: input.developerAccountId,
    agentId: input.agentId,
    requestedPlan: input.plan,
    routerPlan: config.routerPlan,
  };
}

export function getDeveloperAccountIdFromCheckoutSession(
  session: Pick<Stripe.Checkout.Session, 'client_reference_id' | 'metadata'>,
): string | null {
  const metadataId = session.metadata?.developerAccountId?.trim();
  if (metadataId) {
    return metadataId;
  }

  const clientReferenceId = session.client_reference_id?.trim();
  return clientReferenceId || null;
}

export function getAppBaseUrl(request?: Request): string {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (envUrl) {
    return normalizeBaseUrl(envUrl);
  }

  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }

  return 'http://localhost:3000';
}
