import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    routerCall: {
      count: vi.fn(),
    },
  },
  // withRetry is used by sdk.ts — pass the fn through directly
  withRetry: (fn: () => unknown) => fn(),
}));

import { prisma } from '@/lib/prisma';
import { checkUsageLimit } from '@/lib/router/sdk';

const mockCount = prisma.routerCall.count as ReturnType<typeof vi.fn>;

describe('Rate limit 429 path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('test_rate_limit_429 — returns allowed:false + hardCapped:true when monthCount equals monthlyLimit', async () => {
    // Free plan monthly limit = 500; seed at limit (501st call scenario)
    mockCount
      .mockResolvedValueOnce(0)   // todayCount
      .mockResolvedValueOnce(500); // monthCount = at monthly limit

    const result = await checkUsageLimit('dev-test-id', 'FREE');

    expect(result.allowed).toBe(false);
    expect(result.hardCapped).toBe(true);
    expect(result.remaining).toBe(0);
    expect(result.monthlyUsed).toBe(500);
    expect(result.monthlyLimit).toBe(500);
  });

  it('allows call when monthCount is one below monthly limit', async () => {
    mockCount
      .mockResolvedValueOnce(0)   // todayCount
      .mockResolvedValueOnce(499); // monthCount = one below limit

    const result = await checkUsageLimit('dev-test-id', 'FREE');

    expect(result.hardCapped).toBe(false);
    expect(result.monthlyUsed).toBe(499);
  });
});
