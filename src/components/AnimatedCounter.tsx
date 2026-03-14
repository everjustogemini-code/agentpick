"use client"

import { useEffect, useRef, useState } from 'react'

interface Props {
  value: number
  decimals?: number
  duration?: number
}

export default function AnimatedCounter({ value, decimals = 0, duration = 1200 }: Props) {
  const [display, setDisplay] = useState(decimals === 1 ? '0.0' : '0')
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          observer.disconnect()

          // Check prefers-reduced-motion
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setDisplay(decimals === 1 ? value.toFixed(1) : Math.round(value).toLocaleString())
            return
          }

          const start = performance.now()
          function tick(now: number) {
            const elapsed = now - start
            const t = Math.min(elapsed / duration, 1)
            // ease-out cubic
            const progress = 1 - Math.pow(1 - t, 3)
            const current = value * progress
            setDisplay(
              decimals === 1
                ? current.toFixed(1)
                : Math.round(current).toLocaleString()
            )
            if (t < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value, decimals, duration])

  return (
    <span ref={ref} style={{ display: 'inline-block', minWidth: 'max-content' }}>
      <span aria-hidden>{display}</span>
      {/* Hidden clone prevents layout shift */}
      <span className="sr-only">{decimals === 1 ? value.toFixed(1) : Math.round(value).toLocaleString()}</span>
    </span>
  )
}
