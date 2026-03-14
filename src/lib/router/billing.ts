export function getBillingPeriodStart(
  billingCycleStart: Date | string | null | undefined,
  fallback = new Date(),
): Date {
  if (billingCycleStart instanceof Date && !Number.isNaN(billingCycleStart.getTime())) {
    return billingCycleStart;
  }

  if (typeof billingCycleStart === 'string') {
    const parsed = new Date(billingCycleStart);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return fallback;
}
