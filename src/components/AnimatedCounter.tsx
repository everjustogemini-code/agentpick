'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  decimals?: number;
}

function easeOut(t: number): number {
  // cubic-bezier(0.25, 1, 0.5, 1) approximation
  return 1 - Math.pow(1 - t, 3);
}

function format(n: number, decimals: number): string {
  if (decimals === 0) return String(Math.round(n));
  return n.toFixed(decimals);
}

export default function AnimatedCounter({ value, decimals = 0 }: Props) {
  const [displayed, setDisplayed] = useState(format(0, decimals));
  const hasAnimated = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  // SSR-safe initial render shows 0
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplayed(format(value, decimals));
      hasAnimated.current = true;
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          observer.disconnect();

          const duration = 1200;
          const start = performance.now();

          function step(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOut(progress);
            const current = easedProgress * value;
            setDisplayed(format(current, decimals));
            if (progress < 1) {
              requestAnimationFrame(step);
            }
          }

          requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, decimals]);

  return <span ref={ref}>{displayed}</span>;
}
