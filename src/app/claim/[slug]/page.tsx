'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type VerifyMethod = 'dns' | 'file' | 'email';

export default function ClaimPage() {
  const { slug } = useParams<{ slug: string }>();
  const [step, setStep] = useState<'form' | 'verify' | 'done'>('form');
  const [method, setMethod] = useState<VerifyMethod>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [claimId, setClaimId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, email, name, method }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong');
      return;
    }

    setToken(data.token);
    setClaimId(data.id);
    setStep('verify');
  }

  async function handleVerify() {
    setError('');
    setLoading(true);

    const res = await fetch('/api/claim/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claimId }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Verification failed');
      return;
    }

    setStep('done');
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <header className="sticky top-0 z-50 border-b border-border-default bg-bg-page/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[840px] items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-button-primary-bg font-mono text-sm font-bold text-white">
              ⬡
            </div>
            <span className="text-[17px] font-bold tracking-tight text-text-primary">
              agentpick
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[540px] px-6 py-10">
        <h1 className="text-[28px] font-bold tracking-[-0.8px] text-text-primary">
          Claim your product
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Verify ownership of <strong>{slug}</strong> to access your maker dashboard.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary focus:border-indigo-500 focus:outline-none"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary">Work email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border-default bg-white px-3 py-2 text-sm text-text-primary focus:border-indigo-500 focus:outline-none"
                placeholder="jane@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary">Verification method</label>
              <div className="mt-2 space-y-2">
                {([
                  { value: 'email', label: 'Email verification', desc: 'We\'ll check your email domain matches the product website' },
                  { value: 'dns', label: 'DNS TXT record', desc: 'Add a TXT record to your domain' },
                  { value: 'file', label: 'File verification', desc: 'Upload a verification file to your website' },
                ] as { value: VerifyMethod; label: string; desc: string }[]).map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 ${
                      method === opt.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-border-default bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={opt.value}
                      checked={method === opt.value}
                      onChange={() => setMethod(opt.value)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{opt.label}</p>
                      <p className="text-xs text-text-muted">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Start Verification'}
            </button>
          </form>
        )}

        {step === 'verify' && (
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border border-border-default bg-white p-6">
              <h2 className="text-sm font-semibold text-text-primary">Verification Instructions</h2>

              {method === 'email' && (
                <p className="mt-3 text-sm text-text-secondary">
                  We verified your email domain matches the product website. Click below to complete.
                </p>
              )}

              {method === 'dns' && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-text-secondary">Add this TXT record to your domain:</p>
                  <code className="block rounded bg-gray-50 p-3 font-mono text-xs text-text-primary break-all">
                    agentpick-verify={token}
                  </code>
                </div>
              )}

              {method === 'file' && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-text-secondary">
                    Create this file at your website root:
                  </p>
                  <code className="block rounded bg-gray-50 p-3 font-mono text-xs text-text-primary">
                    /.well-known/agentpick-verify.txt
                  </code>
                  <p className="text-sm text-text-secondary">With this content:</p>
                  <code className="block rounded bg-gray-50 p-3 font-mono text-xs text-text-primary break-all">
                    {token}
                  </code>
                </div>
              )}
            </div>

            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Now'}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-6 text-center">
            <p className="text-lg font-semibold text-green-700">Verified!</p>
            <p className="mt-2 text-sm text-green-600">
              Your product has been claimed. Access your maker dashboard below.
            </p>
            <Link
              href={`/dashboard/${slug}`}
              className="mt-4 inline-block rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
