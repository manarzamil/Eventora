import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/server/api/errors';
import { clientKey, rateLimit, __resetRateLimits } from '@/server/api/rate-limit';

describe('rate limiting', () => {
  beforeEach(() => {
    __resetRateLimits();
    vi.useRealTimers();
  });

  it('allows requests up to the limit', () => {
    for (let i = 0; i < 5; i += 1) {
      expect(() => rateLimit('key', { limit: 5, windowMs: 1000 })).not.toThrow();
    }
  });

  it('rejects the request after the limit with a 429', () => {
    for (let i = 0; i < 5; i += 1) rateLimit('key', { limit: 5, windowMs: 60_000 });

    try {
      rateLimit('key', { limit: 5, windowMs: 60_000 });
      expect.unreachable('the sixth request should have been rejected');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(429);
      expect((error as ApiError).code).toBe('RATE_LIMITED');
    }
  });

  it('keeps separate buckets per key', () => {
    for (let i = 0; i < 5; i += 1) rateLimit('a', { limit: 5, windowMs: 60_000 });
    expect(() => rateLimit('b', { limit: 5, windowMs: 60_000 })).not.toThrow();
  });

  it('resets once the window has elapsed', () => {
    vi.useFakeTimers();
    for (let i = 0; i < 3; i += 1) rateLimit('key', { limit: 3, windowMs: 1000 });
    expect(() => rateLimit('key', { limit: 3, windowMs: 1000 })).toThrow();

    vi.advanceTimersByTime(1001);
    expect(() => rateLimit('key', { limit: 3, windowMs: 1000 })).not.toThrow();
    vi.useRealTimers();
  });

  it('derives the bucket from the first x-forwarded-for hop', () => {
    const request = new Request('http://localhost/api/auth/login', {
      headers: { 'x-forwarded-for': '203.0.113.7, 70.41.3.18' },
    });
    expect(clientKey(request, 'login')).toBe('login:203.0.113.7');
  });

  it('falls back to a shared bucket when no proxy header is present', () => {
    const request = new Request('http://localhost/api/auth/login');
    expect(clientKey(request, 'login')).toBe('login:unknown');
  });
});
