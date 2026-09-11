import 'server-only';
import { ApiError } from '@/server/api/errors';

/**
 * A fixed-window rate limiter held in process memory.
 *
 * This is deliberately the simple version, and its limitation is worth stating
 * plainly: it counts per server instance, so behind several replicas the
 * effective limit multiplies by the replica count. It is enough to blunt
 * credential stuffing against a single-instance deployment, and the interface
 * is narrow enough that swapping the store for Redis is a change to this file
 * alone. See "Limitations" in the README.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

/** Opportunistic sweep so the map cannot grow without bound. */
function sweep(now: number) {
  if (windows.size < 5_000) return;
  for (const [key, win] of windows) {
    if (win.resetAt <= now) windows.delete(key);
  }
}

export interface RateLimitOptions {
  /** Requests permitted per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export function rateLimit(key: string, { limit, windowMs }: RateLimitOptions): void {
  const now = Date.now();
  sweep(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  existing.count += 1;
  if (existing.count > limit) {
    const seconds = Math.ceil((existing.resetAt - now) / 1000);
    throw new ApiError('RATE_LIMITED', `Too many attempts. Try again in ${seconds} seconds.`, {
      retryAfterSeconds: seconds,
    });
  }
}

/**
 * Best-effort client identifier.
 *
 * `x-forwarded-for` is only trustworthy behind a proxy that overwrites it; the
 * deployment notes in the README say to configure that. Absent a proxy the
 * fallback bucket is shared, which fails closed (stricter) rather than open.
 */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  return `${scope}:${ip}`;
}

/** Test helper — resets all windows. */
export function __resetRateLimits(): void {
  windows.clear();
}
