import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 — AgentPick',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-page px-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-button-primary-bg font-mono text-lg font-bold text-white">
        ⬡
      </div>
      <h1 className="mt-6 text-[28px] font-bold tracking-[-0.5px] text-text-primary">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-button-primary-bg px-5 py-2.5 text-sm font-semibold text-button-primary-text"
      >
        Back to AgentPick
      </Link>
    </div>
  );
}
