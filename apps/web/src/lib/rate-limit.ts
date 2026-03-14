/**
 * Simple in-memory rate limiter for API routes.
 * Tracks request counts per key (typically IP) within a sliding window.
 *
 * Note: This resets on server restart and is per-instance.
 * For multi-instance deployments, use Redis or Vercel KV instead.
 */

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  });
}, 5 * 60 * 1000);

type RateLimitConfig = {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds until reset
};

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    store.set(key, {
      count: 1,
      resetTime: now + config.windowSeconds * 1000,
    });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowSeconds };
  }

  entry.count++;
  const resetIn = Math.ceil((entry.resetTime - now) / 1000);

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn };
  }

  return { allowed: true, remaining: config.maxRequests - entry.count, resetIn };
}

/**
 * Extract a rate-limit key from a request (uses IP or forwarded-for).
 */
export function getRateLimitKey(req: Request, prefix: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${prefix}:${ip}`;
}
