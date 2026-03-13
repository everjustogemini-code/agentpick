import Link from 'next/link';

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    calls: '3,000 calls/mo',
    features: ['All strategies', 'Dashboard', '4 capabilities'],
    cta: 'Start free',
    primary: true,
    disabled: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    calls: '10K calls/mo',
    features: ['All strategies', 'Dashboard', '4 capabilities', 'Priority routing'],
    cta: 'Coming soon',
    primary: false,
    disabled: true,
  },
  {
    name: 'Growth',
    price: '$99',
    period: '/mo',
    calls: '100K calls/mo',
    features: ['All strategies', 'Dashboard', '4 capabilities', 'Priority routing', 'SLA'],
    cta: 'Coming soon',
    primary: false,
    disabled: true,
  },
];

export default function PricingSection() {
  return (
    <section className="py-12">
      <h2 className="mb-8 text-[28px] font-bold tracking-[-0.5px] text-text-primary">
        Pricing
      </h2>

      <div className="grid gap-4 md:grid-cols-3">
        {TIERS.map((tier) => (
          <div key={tier.name} className="card flex flex-col p-6">
            <h3 className="mb-1 text-[18px] font-semibold text-text-primary">{tier.name}</h3>

            <div className="mb-1">
              <span className="font-mono text-[32px] font-bold tracking-tight text-text-primary">
                {tier.price}
              </span>
              {tier.period && (
                <span className="text-[14px] text-text-tertiary">{tier.period}</span>
              )}
            </div>

            <p className="mb-5 font-mono text-[13px] text-text-secondary">{tier.calls}</p>

            <ul className="mb-6 flex-1 space-y-2">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-text-secondary">
                  <span className="mt-0.5 text-success">&#10003;</span>
                  {f}
                </li>
              ))}
            </ul>

            {tier.disabled ? (
              <span className="btn-secondary cursor-not-allowed text-center opacity-60">
                {tier.cta}
              </span>
            ) : (
              <Link
                href="/dashboard/router"
                className={tier.primary ? 'btn-primary text-center' : 'btn-secondary text-center'}
              >
                {tier.cta}
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
