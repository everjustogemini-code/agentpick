'use client';

import { useState, useEffect } from 'react';

interface Props {
  score: number; // 0–100
}

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~125.66

function getColor(score: number): string {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
}

export default function ScoreRing({ score }: Props) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const finalOffset = CIRCUMFERENCE * (1 - clampedScore / 100);
  const [dashOffset, setDashOffset] = useState(CIRCUMFERENCE);

  useEffect(() => {
    // Trigger animation after mount
    const raf = requestAnimationFrame(() => {
      setDashOffset(finalOffset);
    });
    return () => cancelAnimationFrame(raf);
  }, [finalOffset]);

  const color = getColor(clampedScore);

  return (
    <svg
      width={48}
      height={48}
      viewBox="0 0 48 48"
      aria-label={`Score: ${clampedScore}`}
    >
      {/* Background ring */}
      <circle
        cx={24}
        cy={24}
        r={RADIUS}
        fill="none"
        stroke="#E5E5E5"
        strokeWidth={3}
      />
      {/* Progress ring */}
      <circle
        cx={24}
        cy={24}
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={dashOffset}
        transform="rotate(-90 24 24)"
        style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
      />
      {/* Score text */}
      <text
        x={24}
        y={24}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={500}
        fill={color}
        fontFamily="var(--font-jetbrains-mono), monospace"
      >
        {Math.round(clampedScore)}
      </text>
    </svg>
  );
}
