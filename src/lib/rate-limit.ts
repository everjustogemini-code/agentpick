import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }
  return new Redis({ url, token });
}

export function createLimiter(limit: number, window: string, prefix: string) {
  const redis = getRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    prefix,
  });
}

export const telemetryLimiter = createLimiter(200, '1m', 'agentpick:telemetry');
export const voteLimiter = createLimiter(10, '1m', 'agentpick:vote');
export const registerLimiter = createLimiter(50, '1h', 'agentpick:register');
export const submitLimiterAuth = createLimiter(50, '1h', 'agentpick:submit:auth');
export const submitLimiterAnon = createLimiter(5, '1h', 'agentpick:submit:anon');
export const productsLimiter = createLimiter(100, '1m', 'agentpick:products');
export const routerSdkLimiter = createLimiter(500, '1m', 'agentpick:router-sdk');
export const leaderboardLimiter = createLimiter(60, '1m', 'agentpick:leaderboard');

// In-memory sliding-window rate limiter (resets on server restart — acceptable for demo keys)
const _memSlidingStore = new Map<string, number[]>()

export function checkInMemoryRateLimit(
  ip: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSecs: number } {
  const now = Date.now()
  const cutoff = now - windowMs
  const hits = (_memSlidingStore.get(ip) ?? []).filter(t => t > cutoff)
  if (hits.length >= limit) {
    const retryAfterSecs = Math.ceil((hits[0] + windowMs - now) / 1000)
    return { allowed: false, retryAfterSecs }
  }
  hits.push(now)
  _memSlidingStore.set(ip, hits)
  return { allowed: true, retryAfterSecs: 0 }
}

export async function checkRateLimit(
  limiter: Ratelimit | null,
  key: string
): Promise<{ limited: boolean; retryAfter?: number }> {
  if (!limiter) return { limited: false }; // No Redis = no rate limiting (dev mode)
  const result = await limiter.limit(key);
  if (!result.success) {
    return { limited: true, retryAfter: Math.min(Math.ceil((result.reset - Date.now()) / 1000), 60) };
  }
  return { limited: false };
}
