'use client';

import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    calls: '3,000 calls/mo',
    features: ['All strategies', 'Dashboard', '4 capabilities'],
    cta: 'Start free',
    href: '/dashboard/router',
    primary: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    calls: '10K calls/mo',
    features: ['All strategies', 'Dashboard', '4 capabilities', 'Priority routing'],
    cta: 'Coming soon',
    href: '#',
    primary: true,
    disabled: true,
  },
  {
    name: 'Growth',
    price: '$99',
    period: '/mo',
    calls: '100K calls/mo',
    features: ['All strategies', 'Dashboard', '4 capabilities', 'Priority routing', 'SLA'],
    cta: 'Coming soon',
    href: '#',
    primary: false,
    disabled: true,
  },
];

export default function PricingPageClient() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-20">
      <h1 className="mb-4 text-center text-[36px] font-bold tracking-tight text-white">
        Pricing
      </h1>
      <p className="mb-12 text-center text-[16px] text-gray-400">
        Start free. Upgrade when you need more calls.
      </p>
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-xl border p-8 ${
              plan.primary
                ? 'border-[#00D4AA]/40 bg-[#00D4AA]/5'
                : 'border-gray-800 bg-[#0d0d14]'
            }`}
          >
            <h3 className="mb-2 text-[20px] font-semibold text-white">{plan.name}</h3>
            <div className="mb-1">
              <span className="font-mono text-[40px] font-bold text-white">{plan.price}</span>
              {plan.period && (
                <span className="text-[16px] text-gray-500">{plan.period}</span>
              )}
            </div>
            <p className="mb-6 font-mono text-[14px] text-gray-400">{plan.calls}</p>
            <ul className="mb-8 flex-1 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[14px] text-gray-300">
                  <span className="text-[#00D4AA]">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            {plan.disabled ? (
              <span className="rounded-lg border border-gray-700 bg-transparent px-6 py-3 text-center text-[14px] font-medium text-gray-500 opacity-60">
                {plan.cta}
              </span>
            ) : (
              <Link
                href={plan.href}
                className="rounded-lg bg-white px-6 py-3 text-center text-[14px] font-semibold text-black transition-opacity hover:opacity-90"
              >
                {plan.cta}
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
