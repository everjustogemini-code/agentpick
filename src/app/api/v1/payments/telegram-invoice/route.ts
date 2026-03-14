import { NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth';
import { ensureDeveloperAccount } from '@/lib/router/sdk';
import { UPGRADE_PLAN_CONFIG, normalizeUpgradePlan } from '@/lib/router/plans';
import { apiError } from '@/types';

export const runtime = 'nodejs';

/**
 * POST /api/v1/payments/telegram-invoice
 *
 * Sends a Telegram invoice to the specified chat so a user can subscribe to
 * AgentPick Pro or Growth without leaving Telegram.
 *
 * Telegram natively supports Stripe as a payment provider — the user pays
 * inside the Telegram UI and the bot receives a successful_payment update.
 *
 * Body:
 *   {
 *     plan: "pro" | "growth" | "scale",
 *     telegram_chat_id: string,   // e.g. "123456789" or "-100…" for groups
 *     agent_api_key: string       // AgentPick developer API key
 *   }
 *
 * Returns: { ok: true, message_id: number }
 *
 * Env vars required:
 *   TELEGRAM_BOT_TOKEN            — AgentPick's Telegram bot token
 *   STRIPE_TELEGRAM_PROVIDER_TOKEN — Stripe provider token for Telegram Payments
 */
export async function POST(request: NextRequest) {
  // Allow both Bearer header auth AND body-level agent_api_key for flexibility
  const agent = await authenticateAgent(request);
  if (!agent) return apiError('UNAUTHORIZED', 'Invalid or missing API key.', 401);

  const account = await ensureDeveloperAccount(agent.id);

  let body: { plan?: unknown; telegram_chat_id?: unknown; agent_api_key?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  const plan = normalizeUpgradePlan(body.plan);
  if (!plan) {
    return apiError('VALIDATION_ERROR', 'plan must be "pro" or "growth".', 400);
  }

  const chatId = String(body.telegram_chat_id ?? '').trim();
  if (!chatId) {
    return apiError('VALIDATION_ERROR', 'telegram_chat_id is required.', 400);
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const providerToken = process.env.STRIPE_TELEGRAM_PROVIDER_TOKEN;

  if (!botToken || !providerToken) {
    return apiError(
      'INTERNAL_ERROR',
      'Telegram payment integration is not configured on this server.',
      503,
    );
  }

  const planConfig = UPGRADE_PLAN_CONFIG[plan];

  // Telegram invoice payload
  // Prices are in the smallest currency unit (USD cents)
  const invoicePayload = {
    chat_id: chatId,
    title: `AgentPick ${planConfig.label}`,
    description: `${planConfig.description} — ${planConfig.monthlyCalls.toLocaleString()} calls/month, $${planConfig.monthlyPriceUsd}/month.`,
    payload: JSON.stringify({
      plan,
      routerPlan: planConfig.routerPlan,
      developerAccountId: account.id,
      agentId: agent.id,
    }),
    provider_token: providerToken,
    currency: 'USD',
    prices: [
      {
        label: `AgentPick ${planConfig.label} (monthly)`,
        amount: planConfig.monthlyPriceUsd * 100, // cents
      },
    ],
    // Optional: photo makes the invoice more attractive
    // photo_url: 'https://agentpick.dev/og-image.png',
    need_email: true,
    send_email_to_provider: true,
    is_flexible: false,
    start_parameter: `upgrade-${plan}`,
  };

  try {
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendInvoice`;
    const tgResponse = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoicePayload),
    });

    const tgData = await tgResponse.json();

    if (!tgData.ok) {
      console.error('Telegram sendInvoice error:', tgData);
      return apiError(
        'INTERNAL_ERROR',
        `Telegram API error: ${tgData.description ?? 'Unknown error'}`,
        500,
      );
    }

    return Response.json({
      ok: true,
      message_id: tgData.result?.message_id,
      plan,
      planLabel: planConfig.label,
      chatId,
    });
  } catch (error) {
    console.error('Telegram invoice send error:', error);
    return apiError('INTERNAL_ERROR', 'Failed to send Telegram invoice.', 500);
  }
}
