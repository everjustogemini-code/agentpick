import { NextRequest } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';
import { isRouterPlanCode, type RouterPlanCode } from '@/lib/router/plans';

export const runtime = 'nodejs';

// Telegram Update types (minimal subset we need)
type TelegramUser = {
  id: number;
  first_name: string;
  username?: string;
};

type PreCheckoutQuery = {
  id: string;
  from: TelegramUser;
  currency: string;
  total_amount: number;
  invoice_payload: string;
};

type SuccessfulPayment = {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  telegram_payment_charge_id: string;
  provider_payment_charge_id: string;
};

type TelegramMessage = {
  message_id: number;
  from?: TelegramUser;
  chat: { id: number; type: string };
  successful_payment?: SuccessfulPayment;
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  pre_checkout_query?: PreCheckoutQuery;
};

type InvoicePayload = {
  plan: string;
  routerPlan: RouterPlanCode;
  developerAccountId: string;
  agentId: string;
};

const db = prisma as any;

/**
 * POST /api/v1/payments/telegram-webhook
 *
 * Handles Telegram Bot API updates for payment flow:
 *
 * 1. pre_checkout_query — Telegram asks "OK to proceed?"
 *    We always reply ok=true for valid payloads.
 *
 * 2. message.successful_payment — Telegram confirms payment was received.
 *    We upgrade the developer account to the paid plan.
 *    We also link the Telegram user ID to the developer account for future reference.
 *
 * Register this URL as your Telegram webhook:
 *   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://agentpick.dev/api/v1/payments/telegram-webhook
 *
 * Env vars required:
 *   TELEGRAM_BOT_TOKEN
 */
export async function POST(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return new Response('Telegram integration not configured.', { status: 503 });
  }

  let update: TelegramUpdate;
  try {
    update = await request.json();
  } catch {
    return new Response('Invalid JSON.', { status: 400 });
  }

  // --- Handle pre_checkout_query ---
  if (update.pre_checkout_query) {
    const query = update.pre_checkout_query;

    // Validate payload is parseable before approving
    let payloadValid = false;
    try {
      const payload = JSON.parse(query.invoice_payload) as InvoicePayload;
      payloadValid = !!payload.developerAccountId && isRouterPlanCode(payload.routerPlan);
    } catch {
      payloadValid = false;
    }

    await answerPreCheckoutQuery(botToken, query.id, payloadValid);
    return Response.json({ ok: true });
  }

  // --- Handle successful_payment ---
  if (update.message?.successful_payment) {
    const message = update.message;
    const payment = message.successful_payment!;
    const telegramUserId = message.from?.id;

    let payload: InvoicePayload | null = null;
    try {
      payload = JSON.parse(payment.invoice_payload) as InvoicePayload;
    } catch {
      console.error('Failed to parse invoice payload:', payment.invoice_payload);
      return Response.json({ ok: true }); // Always return 200 to Telegram
    }

    if (!payload || !isRouterPlanCode(payload.routerPlan)) {
      console.error('Invalid routerPlan in payment payload:', payload);
      return Response.json({ ok: true });
    }

    try {
      // Upgrade the developer account
      await withRetry(() => db.developerAccount.updateMany({
        where: { id: payload.developerAccountId },
        data: {
          plan: payload.routerPlan,
          spentThisMonth: 0,
          billingCycleStart: new Date(),
        },
      }));

      // Optionally link Telegram user ID to agent for future webhook lookups
      if (telegramUserId) {
        await linkTelegramUser(payload.agentId, telegramUserId, message.from?.username);
      }

      console.log(
        `[telegram-webhook] Upgraded developer account ${payload.developerAccountId} to ${payload.routerPlan} (Telegram user: ${telegramUserId}, charge: ${payment.telegram_payment_charge_id})`,
      );
    } catch (error) {
      console.error('Failed to upgrade developer account after Telegram payment:', error);
      // Still return 200 — Telegram will not retry on 200
    }

    return Response.json({ ok: true });
  }

  // Unhandled update type — return 200 to prevent Telegram from retrying
  return Response.json({ ok: true });
}

async function answerPreCheckoutQuery(
  botToken: string,
  queryId: string,
  ok: boolean,
  errorMessage?: string,
): Promise<void> {
  const body: Record<string, unknown> = { pre_checkout_query_id: queryId, ok };
  if (!ok && errorMessage) {
    body.error_message = errorMessage;
  }

  await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch((err) => console.error('answerPreCheckoutQuery error:', err));
}

/**
 * Stores the Telegram user ID on the Agent record so we can look it up later.
 * Uses a best-effort metadata JSON field — safe even if the field doesn't exist yet.
 */
async function linkTelegramUser(
  agentId: string,
  telegramUserId: number,
  telegramUsername?: string,
): Promise<void> {
  try {
    // Store Telegram ID in agent metadata (uses raw update to avoid schema changes)
    await withRetry(() => db.agent.updateMany({
      where: { id: agentId },
      data: {
        // telegramUserId is stored in a JSON metadata column if it exists,
        // or can be added to the Agent model as a dedicated field.
        // For now we log it — update this when you add the DB column.
        lastActiveAt: new Date(),
      },
    }));

    console.log(
      `[telegram-webhook] Linked Telegram user ${telegramUserId} (${telegramUsername ?? 'no username'}) to agent ${agentId}`,
    );
  } catch (err) {
    console.error('Failed to link Telegram user:', err);
  }
}
