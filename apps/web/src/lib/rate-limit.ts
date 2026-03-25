/**
 * Rate limiter for API routes.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * are set (recommended for production / multi-instance deployments).
 * Falls back to an in-memory Map for local development.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Types (unchanged public API)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Redis-backed limiter (production)
// ---------------------------------------------------------------------------

const useRedis =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = useRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/** Cache Ratelimit instances so we don't recreate them per request. */
const limiters = new Map<string, Ratelimit>();

function getRedisLimiter(config: RateLimitConfig): Ratelimit {
  const cacheKey = `${config.maxRequests}:${config.windowSeconds}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.fixedWindow(config.maxRequests, `${config.windowSeconds} s`),
      analytics: false,
      prefix: "rl",
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

async function checkRedisRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const limiter = getRedisLimiter(config);
  const { success, remaining, reset } = await limiter.limit(key);
  const resetIn = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
  return { allowed: success, remaining, resetIn };
}

// ---------------------------------------------------------------------------
// In-memory fallback (local dev)
// ---------------------------------------------------------------------------

type MemEntry = { count: number; resetTime: number };
const memStore = new Map<string, MemEntry>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    memStore.forEach((entry, key) => {
      if (now > entry.resetTime) memStore.delete(key);
    });
  }, 5 * 60 * 1000);
}

function checkMemRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = memStore.get(key);

  if (!entry || now > entry.resetTime) {
    memStore.set(key, {
      count: 1,
      resetTime: now + config.windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowSeconds,
    };
  }

  entry.count++;
  const resetIn = Math.ceil((entry.resetTime - now) / 1000);

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn,
  };
}

// ---------------------------------------------------------------------------
// Public API (unchanged signature — callers don't need to change)
// ---------------------------------------------------------------------------

/**
 * Check whether a request is within the rate limit.
 * Uses Redis in production, in-memory in local dev.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult | Promise<RateLimitResult> {
  if (redis) {
    return checkRedisRateLimit(key, config);
  }
  return checkMemRateLimit(key, config);
}

/**
 * Extract a rate-limit key from a request (uses IP or forwarded-for).
 */
export function getRateLimitKey(req: Request, prefix: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${prefix}:${ip}`;
}
