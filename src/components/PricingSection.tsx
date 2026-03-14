import Link from 'next/link';
import { PRICING_CARD_PLANS } from '@/lib/router/plans';

export default function PricingSection() {
  return (
    <section className="py-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-bold tracking-[-0.5px] text-text-primary">Pricing</h2>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">
            Start free, then move to Stripe-backed plans when your router traffic grows.
          </p>
        </div>
        <Link href="/pricing" className="hidden text-sm font-medium text-accent hover:underline md:block">
          Full pricing page
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PRICING_CARD_PLANS.map((plan) => {
          const isFree = plan.slug === 'free';

          return (
            <div key={plan.slug} className="card flex flex-col p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="mb-1 text-[18px] font-semibold text-text-primary">{plan.label}</h3>
                  <p className="text-[13px] leading-5 text-text-secondary">{plan.description}</p>
                </div>
                {plan.slug === 'growth' && (
                  <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-500">
                    Scale
                  </span>
                )}
              </div>

              <div className="mb-1 mt-5">
                <span className="font-mono text-[32px] font-bold tracking-tight text-text-primary">
                  {plan.monthlyPriceUsd === 0 ? '$0' : `$${plan.monthlyPriceUsd}`}
                </span>
                {plan.monthlyPriceUsd > 0 && (
                  <span className="text-[14px] text-text-tertiary">/mo</span>
                )}
              </div>

              <p className="mb-5 font-mono text-[13px] text-text-secondary">
                {plan.monthlyCalls.toLocaleString()} calls/mo
              </p>

              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[13px] text-text-secondary">
                    <span className="mt-0.5 text-success">&#10003;</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={isFree ? '/dashboard/router' : '/pricing'}
                className={isFree ? 'btn-primary text-center' : 'btn-secondary text-center'}
              >
                {isFree ? plan.ctaLabel : 'Choose plan'}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
