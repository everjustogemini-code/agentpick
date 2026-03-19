'use client';

import { useState } from 'react';

type Step = 'form' | 'loading' | 'success' | 'error';

interface IssueResult {
  apiKey: string;
  plan: string;
  monthlyLimit: number;
}

export default function QuickstartWizard() {
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<IssueResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;

    setStep('loading');
    setErrorMsg('');

    try {
      // Primary endpoint
      let res = await fetch('/api/v1/quickstart/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Fallback if primary returns 404
      if (res.status === 404) {
        res = await fetch('/api/v1/agents/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'my-agent' }),
        });
        if (res.ok) {
          const data = await res.json();
          setResult({
            apiKey: data.api_key ?? data.apiKey,
            plan: 'FREE',
            monthlyLimit: 1000,
          });
          setStep('success');
          return;
        }
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error?.message ?? `Request failed (${res.status})`;
        setErrorMsg(msg);
        setStep('error');
        return;
      }

      const data: IssueResult = await res.json();
      setResult(data);
      setStep('success');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStep('error');
    }
  };

  const pipInstall = 'pip install agentpick';
  const pythonCode = result
    ? `from agentpick import AgentPick\n\nap = AgentPick(api_key="${result.apiKey}")\nresult = ap.search("NVIDIA Q4 earnings")\nprint(result["data"])`
    : '';

  return (
    <div className="mt-6">
      {/* ── Form step ── */}
      {(step === 'form' || step === 'loading') && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-[14px] text-[#94a3b8]">
            Enter your email to get a free API key instantly — no credit card required.
          </p>
          <div className="flex gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={step === 'loading'}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-[14px] text-white placeholder-white/30 outline-none focus:border-white/25 focus:ring-0 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={step === 'loading'}
              className="rounded-lg bg-white px-5 py-2.5 text-[13px] font-semibold text-[#0a0a0f] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {step === 'loading' ? 'Issuing…' : 'Get API key →'}
            </button>
          </div>
        </form>
      )}

      {/* ── Error step ── */}
      {step === 'error' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-400">
            {errorMsg}
          </div>
          <button
            onClick={() => setStep('form')}
            className="text-[13px] text-white/50 underline underline-offset-2 hover:text-white/80"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── Success step ── */}
      {step === 'success' && result && (
        <div className="space-y-6">
          {/* Key banner */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="mb-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-[12px] font-medium uppercase tracking-widest text-green-400">
                API key issued
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-black/40 px-4 py-3 font-mono text-[13px] text-white">
              <span className="truncate">{result.apiKey}</span>
              <button
                onClick={() => copy(result.apiKey, 'key')}
                className="shrink-0 rounded px-2 py-1 text-[11px] text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
              >
                {copied === 'key' ? '✓ copied' : 'copy'}
              </button>
            </div>
            <p className="mt-2 text-[12px] text-white/30">
              Plan: {result.plan} · {result.monthlyLimit.toLocaleString()} calls/month
            </p>
          </div>

          {/* Install */}
          <div>
            <p className="mb-2 text-[12px] font-medium uppercase tracking-widest text-white/40">
              1. Install
            </p>
            <div className="flex items-center justify-between rounded-lg bg-[#0a0a0f] border border-white/10 px-4 py-3 font-mono text-[13px] text-green-400">
              <span>{pipInstall}</span>
              <button
                onClick={() => copy(pipInstall, 'pip')}
                className="ml-3 shrink-0 rounded px-2 py-1 text-[11px] text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
              >
                {copied === 'pip' ? '✓ copied' : 'copy'}
              </button>
            </div>
          </div>

          {/* Code example */}
          <div>
            <p className="mb-2 text-[12px] font-medium uppercase tracking-widest text-white/40">
              2. Use it
            </p>
            <div className="relative rounded-lg bg-[#0a0a0f] border border-white/10 p-4 font-mono text-[13px] leading-relaxed">
              <button
                onClick={() => copy(pythonCode, 'code')}
                className="absolute right-3 top-3 rounded px-2 py-1 text-[11px] text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
              >
                {copied === 'code' ? '✓ copied' : 'copy'}
              </button>
              <div>
                <span className="text-blue-400">from</span>{' '}
                <span className="text-white">agentpick</span>{' '}
                <span className="text-blue-400">import</span>{' '}
                <span className="text-white">AgentPick</span>
              </div>
              <div className="h-4" />
              <div>
                <span className="text-white">ap</span>{' '}
                <span className="text-white/40">=</span>{' '}
                <span className="text-white">AgentPick</span>
                <span className="text-white/40">(</span>
                <span className="text-orange-300">api_key</span>
                <span className="text-white/40">=</span>
                <span className="text-green-400">&quot;{result.apiKey}&quot;</span>
                <span className="text-white/40">)</span>
              </div>
              <div>
                <span className="text-white">result</span>{' '}
                <span className="text-white/40">=</span>{' '}
                <span className="text-white">ap</span>
                <span className="text-white/40">.</span>
                <span className="text-blue-300">search</span>
                <span className="text-white/40">(</span>
                <span className="text-green-400">&quot;NVIDIA Q4 earnings&quot;</span>
                <span className="text-white/40">)</span>
              </div>
              <div>
                <span className="text-blue-400">print</span>
                <span className="text-white/40">(</span>
                <span className="text-white">result</span>
                <span className="text-white/40">[</span>
                <span className="text-green-400">&quot;data&quot;</span>
                <span className="text-white/40">])</span>
              </div>
            </div>
          </div>

          <p className="text-[12px] text-white/30">
            Docs &amp; full API reference at{' '}
            <a
              href="https://agentpick.dev/quickstart"
              className="underline underline-offset-2 hover:text-white/60"
            >
              agentpick.dev/quickstart
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
