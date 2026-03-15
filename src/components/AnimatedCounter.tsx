"use client"

import { useEffect, useState } from 'react'

interface Props {
  value: number
  decimals?: number
  duration?: number
}

export default function AnimatedCounter({ value, decimals = 0, duration = 1200 }: Props) {
  const formatted = decimals === 1 ? value.toFixed(1) : Math.round(value).toLocaleString()
  const [display, setDisplay] = useState(formatted)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(formatted)
      return
    }

    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
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
  }, [value, decimals, duration, formatted])

  return <span>{display}</span>
}
