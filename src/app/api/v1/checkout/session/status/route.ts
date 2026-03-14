import { NextRequest } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import { apiError } from '@/types';

export const runtime = 'nodejs';

/**
 * GET /api/v1/checkout/session/status?session_id=cs_...
 * Returns the status of a Stripe Checkout Session for the return page.
 * Public endpoint — session_id is effectively a secret token.
 */
export async function GET(request: NextRequest) {
  const sessionId = new URL(request.url).searchParams.get('session_id');

  if (!sessionId) {
    return apiError('VALIDATION_ERROR', 'session_id is required.', 400);
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return Response.json({
      status: session.status,
      customerEmail: session.customer_details?.email ?? null,
    });
  } catch (error) {
    console.error('Stripe session status error:', error);
    return apiError('INTERNAL_ERROR', 'Unable to retrieve session status.', 500);
  }
}
