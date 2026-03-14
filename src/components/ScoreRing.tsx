"use client"

import { useEffect, useRef, useState } from 'react'

interface Props {
  score: number   // 0–10
  size?: number   // default 48
}

function scoreColor(score: number) {
  if (score >= 8) return '#22c55e'   // green-500
  if (score >= 6) return '#f59e0b'   // amber-500
  return '#ef4444'                    // red-500
}

export default function ScoreRing({ score, size = 48 }: Props) {
  const clamped = Math.max(0, Math.min(10, score))
  const r = size / 2 - 4
  const circumference = 2 * Math.PI * r
  const finalOffset = circumference * (1 - clamped / 10)
  const [offset, setOffset] = useState(circumference)
  const reduced = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced.current) {
      setOffset(finalOffset)
      return
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setOffset(finalOffset))
    })
  }, [finalOffset])

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Score: ${clamped.toFixed(1)}`}>
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#1f2937" strokeWidth={4}
      />
      {/* Score arc */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={scoreColor(clamped)}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{
          transition: reduced.current ? 'none' : 'stroke-dashoffset 600ms ease-out',
          transform: 'rotate(-90deg)',
          transformOrigin: '50% 50%',
        }}
      />
      {/* Label */}
      <text
        x="50%" y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={size * 0.28}
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="500"
        fill="white"
      >
        {clamped.toFixed(1)}
      </text>
    </svg>
  )
}
