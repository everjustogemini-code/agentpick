'use client';
import { useEffect, useRef, useState } from 'react';
import AnimatedCounter from '@/components/AnimatedCounter';

interface Props {
  value: number;
  suffix?: string;
  duration?: number;
}

export default function OnceAnimatedCounter({ value, suffix = '', duration }: Props) {
  const alreadyDone = typeof window !== 'undefined' && !!sessionStorage.getItem('ap_stats_animated');
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (alreadyDone) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setShouldAnimate(true);
        sessionStorage.setItem('ap_stats_animated', '1');
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [alreadyDone]);

  return (
    <span ref={ref}>
      {(shouldAnimate || alreadyDone)
        ? <><AnimatedCounter value={value} duration={duration} />{suffix}</>
        : <>{value.toLocaleString()}{suffix}</>}
    </span>
  );
}
