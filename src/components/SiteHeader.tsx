'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/live', label: 'Live', key: 'live' },
  { href: '/benchmarks', label: 'Benchmarks', key: 'benchmarks' },
  { href: '/playground', label: 'Playground', key: 'playground' },
  { href: '/rankings/top-agent-tools', label: 'Rankings', key: 'rankings' },
  { href: '/agents', label: 'Agents', key: 'agents' },
  { href: '/connect', label: 'Router', key: 'router', accent: true },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 border-b border-border"
      style={{
        background: 'rgba(250,250,250,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#0A0A0A] font-mono text-sm font-bold text-white">
            &#x2B21;
          </div>
          <span className="text-[17px] font-bold tracking-tight text-text-primary">agentpick</span>
          {/* Live pulse dot */}
          <span className="relative flex h-[7px] w-[7px]">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-70" />
            <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-green-500" />
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`relative text-[13px] font-medium transition-colors ${
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
                {/* Active bottom accent line */}
                {isActive && (
                  <span
                    className="absolute bottom-[-14px] left-0 right-0 h-[2px] rounded-full"
                    style={{ background: item.accent ? 'var(--accent)' : 'var(--text-primary)' }}
                  />
                )}
              </Link>
            );
          })}
          <Link href="/dashboard" className="btn-primary !py-1.5 !px-4 !text-[12px]">
            Dashboard
          </Link>
        </nav>

        {/* Mobile hamburger with rotation animation */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-secondary md:hidden"
          style={{ transition: 'transform 0.3s ease' }}
          aria-label="Menu"
        >
          <span
            style={{
              display: 'inline-block',
              transition: 'transform 0.3s ease',
              transform: menuOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              fontSize: '16px',
            }}
          >
            {menuOpen ? '\u2715' : '\u2630'}
          </span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-border bg-bg-primary/95 px-6 py-3 md:hidden" style={{ backdropFilter: 'blur(12px)' }}>
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
