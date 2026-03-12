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

function createLimiter(limit: number, window: string, prefix: string) {
  const redis = getRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    prefix,
  });
}

export const telemetryLimiter = createLimiter(100, '1m', 'agentpick:telemetry');
export const voteLimiter = createLimiter(20, '1h', 'agentpick:vote');
export const registerLimiter = createLimiter(5, '1h', 'agentpick:register');
export const submitLimiter = createLimiter(3, '1h', 'agentpick:submit');
export const productsLimiter = createLimiter(100, '1m', 'agentpick:products');

export async function checkRateLimit(
  limiter: Ratelimit | null,
  key: string
): Promise<{ limited: boolean; retryAfter?: number }> {
  if (!limiter) return { limited: false }; // No Redis = no rate limiting (dev mode)
  const result = await limiter.limit(key);
  if (!result.success) {
    return { limited: true, retryAfter: Math.ceil((result.reset - Date.now()) / 1000) };
  }
  return { limited: false };
}
