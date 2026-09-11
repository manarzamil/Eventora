import { describe, expect, it } from 'vitest';
import {
  adminEventSchema,
  createBookingSchema,
  eventQuerySchema,
  loginSchema,
  registerSchema,
  MAX_TICKETS_PER_BOOKING,
} from '@/lib/validation';

describe('registration', () => {
  it('normalises the e-mail address to lower case', () => {
    const result = registerSchema.parse({
      fullName: 'Sara Al-Harbi',
      email: '  Sara@Example.COM ',
      password: 'correct-horse-9',
      phone: '',
    });
    expect(result.email).toBe('sara@example.com');
  });

  it('rejects a password that is too short', () => {
    const result = registerSchema.safeParse({
      fullName: 'Sara',
      email: 'sara@example.com',
      password: 'short1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a long password with no number or symbol', () => {
    const result = registerSchema.safeParse({
      fullName: 'Sara',
      email: 'sara@example.com',
      password: 'aaaaaaaaaaaa',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a long password with a symbol instead of a digit', () => {
    const result = registerSchema.safeParse({
      fullName: 'Sara Ahmed',
      email: 'sara@example.com',
      password: 'correct-horse-battery',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a phone number containing letters', () => {
    const result = registerSchema.safeParse({
      fullName: 'Sara Ahmed',
      email: 'sara@example.com',
      password: 'correct-horse-9',
      phone: '+965 CALL ME',
    });
    expect(result.success).toBe(false);
  });
});

describe('login', () => {
  it('does not apply the password policy, so old passwords still work', () => {
    // Enforcing the *new* policy on a login form would lock out accounts made
    // before it, and would hint at which passwords are valid.
    const result = loginSchema.safeParse({ email: 'a@b.com', password: 'x' });
    expect(result.success).toBe(true);
  });

  it('still requires a non-empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('booking input', () => {
  const base = {
    sessionId: 'abc123',
    guestName: 'Sara Ahmed',
    guestEmail: 'sara@example.com',
  };

  it('accepts a sensible order', () => {
    expect(createBookingSchema.safeParse({ ...base, quantity: 2 }).success).toBe(true);
  });

  it('rejects zero and negative quantities', () => {
    expect(createBookingSchema.safeParse({ ...base, quantity: 0 }).success).toBe(false);
    expect(createBookingSchema.safeParse({ ...base, quantity: -3 }).success).toBe(false);
  });

  it('rejects a fractional quantity', () => {
    expect(createBookingSchema.safeParse({ ...base, quantity: 1.5 }).success).toBe(false);
  });

  it('caps the quantity at the per-booking limit', () => {
    expect(
      createBookingSchema.safeParse({ ...base, quantity: MAX_TICKETS_PER_BOOKING }).success,
    ).toBe(true);
    expect(
      createBookingSchema.safeParse({ ...base, quantity: MAX_TICKETS_PER_BOOKING + 1 }).success,
    ).toBe(false);
  });

  it('coerces a quantity that arrived as a string from a form', () => {
    const result = createBookingSchema.parse({ ...base, quantity: '3' });
    expect(result.quantity).toBe(3);
  });
});

describe('discovery query', () => {
  it('applies defaults when nothing is supplied', () => {
    const result = eventQuerySchema.parse({});
    expect(result.sort).toBe('recommended');
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(12);
  });

  it('splits a comma-separated category list', () => {
    const result = eventQuerySchema.parse({ categories: 'marine,outdoor,cultural' });
    expect(result.categories).toEqual(['marine', 'outdoor', 'cultural']);
  });

  it('rejects an unknown sort key rather than silently ignoring it', () => {
    expect(eventQuerySchema.safeParse({ sort: 'cheapest-ever' }).success).toBe(false);
  });

  it('refuses an absurd page size, so the API cannot be used to dump the table', () => {
    expect(eventQuerySchema.safeParse({ perPage: 10_000 }).success).toBe(false);
  });

  it('accepts a plain YYYY-MM-DD date as well as a full timestamp', () => {
    expect(eventQuerySchema.safeParse({ dateFrom: '2026-10-01' }).success).toBe(true);
    expect(eventQuerySchema.safeParse({ dateFrom: '2026-10-01T00:00:00.000Z' }).success).toBe(true);
    expect(eventQuerySchema.safeParse({ dateFrom: 'next tuesday' }).success).toBe(false);
  });
});

describe('admin event input', () => {
  const valid = {
    title: 'Sunset Dhow Cruise',
    summary: 'Two and a half hours on a restored wooden dhow around the bay.',
    description:
      'A longer description that comfortably exceeds the minimum length required by the schema for an event.',
    categoryId: 'cat1',
    cityId: 'city1',
    venueId: 'venue1',
    price: 18,
    durationMinutes: 150,
  };

  it('accepts a complete event', () => {
    expect(adminEventSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a negative price', () => {
    expect(adminEventSchema.safeParse({ ...valid, price: -5 }).success).toBe(false);
  });

  it('accepts a free event', () => {
    expect(adminEventSchema.safeParse({ ...valid, price: 0 }).success).toBe(true);
  });

  it('rejects a duration under fifteen minutes', () => {
    expect(adminEventSchema.safeParse({ ...valid, durationMinutes: 5 }).success).toBe(false);
  });

  it('defaults a new event to DRAFT rather than publishing it', () => {
    const result = adminEventSchema.parse(valid);
    expect(result.status).toBe('DRAFT');
    expect(result.isFeatured).toBe(false);
  });

  it('parses comma-separated tags into an array', () => {
    const result = adminEventSchema.parse({ ...valid, tags: 'sunset, boat, family' });
    expect(result.tags).toEqual(['sunset', ' boat', ' family'].map((t) => t.trim()));
  });
});
