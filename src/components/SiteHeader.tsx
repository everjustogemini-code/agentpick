'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/live', label: 'Live', key: 'live' },
  { href: '/benchmarks', label: 'Benchmarks', key: 'benchmarks' },
  { href: '/rankings/top-agent-tools', label: 'Rankings', key: 'rankings' },
  { href: '/agents', label: 'Agents', key: 'agents' },
  { href: '/connect', label: 'Router', key: 'router', accent: true },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg-primary/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#0A0A0A] font-mono text-sm font-bold text-white">
            &#x2B21;
          </div>
          <span className="text-[17px] font-bold tracking-tight text-text-primary">agentpick</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`text-[13px] font-medium transition-colors ${
                  item.accent
                    ? isActive
                      ? 'text-accent'
                      : 'text-accent/70 hover:text-accent'
                    : isActive
                      ? 'text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link href="/dashboard" className="btn-primary !py-1.5 !px-4 !text-[12px]">
            Dashboard
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-secondary md:hidden"
          aria-label="Menu"
        >
          {menuOpen ? '\u2715' : '\u2630'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-border bg-bg-primary px-6 py-3 md:hidden">
          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-3 py-2 text-[13px] font-medium ${
                    isActive ? 'bg-bg-secondary text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="btn-primary mt-2 text-center"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
