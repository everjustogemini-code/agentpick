/**
 * R5v2 Product trust levels and status helpers.
 *
 * Five trust states:
 *   SUBMITTED       → Gray: "Unverified"
 *   CLAIMED         → Blue: "Claimed ✓"
 *   SMOKE_TESTED    → Yellow: "Tested ✓"
 *   BENCHMARKED     → Green: "Benchmarked ✓ (N tests)"
 *   LIVE_TELEMETRY  → Purple: "Live data ✓ (N calls)"
 *
 * Legacy APPROVED is treated as SMOKE_TESTED for all purposes.
 * Legacy PENDING is treated as SUBMITTED.
 */

import type { ProductStatus } from '@/generated/prisma/client';

// All statuses that should be visible in browse/product pages
export const BROWSE_STATUSES: ProductStatus[] = [
  'APPROVED', 'SUBMITTED', 'CLAIMED', 'SMOKE_TESTED', 'BENCHMARKED', 'LIVE_TELEMETRY',
];

// Statuses eligible for default rankings (SUBMITTED excluded)
export const RANKING_STATUSES: ProductStatus[] = [
  'APPROVED', 'CLAIMED', 'SMOKE_TESTED', 'BENCHMARKED', 'LIVE_TELEMETRY',
];

// Statuses with full ranking weight
export const FULL_RANKING_STATUSES: ProductStatus[] = [
  'APPROVED', 'SMOKE_TESTED', 'BENCHMARKED', 'LIVE_TELEMETRY',
];

// CLAIMED gets 0.5x weight in rankings
export const HALF_WEIGHT_STATUSES: ProductStatus[] = ['CLAIMED'];

export interface StatusBadge {
  label: string;
  bg: string;
  text: string;
  border: string;
}

export function getStatusBadge(
  status: string,
  benchmarkCount?: number,
  telemetryCount?: number,
): StatusBadge {
  switch (status) {
    case 'LIVE_TELEMETRY':
      return {
        label: `Live data ✓${telemetryCount ? ` (${fmtCompact(telemetryCount)} calls)` : ''}`,
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
      };
    case 'BENCHMARKED':
      return {
        label: `Benchmarked ✓${benchmarkCount ? ` (${fmtCompact(benchmarkCount)} tests)` : ''}`,
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
      };
    case 'SMOKE_TESTED':
    case 'APPROVED':
      return {
        label: 'Tested ✓',
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
      };
    case 'CLAIMED':
      return {
        label: 'Claimed ✓',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
      };
    case 'SUBMITTED':
    case 'PENDING':
    default:
      return {
        label: 'Unverified',
        bg: 'bg-gray-50',
        text: 'text-gray-500',
        border: 'border-gray-200',
      };
  }
}

function fmtCompact(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toString();
}
