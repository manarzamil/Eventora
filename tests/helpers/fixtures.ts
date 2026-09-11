/**
 * Fixture builders for the integration suite.
 *
 * Each test file calls `resetDatabase()` and then creates exactly the rows it
 * needs. Sharing one large seeded world between tests couples them together —
 * a change to the demo dataset should never break an assertion about booking
 * concurrency.
 */
import { sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import {
  categories,
  cities,
  countries,
  eventSessions,
  events,
  users,
  venues,
} from '@/server/db/schema';
import { hashPassword } from '@/server/auth/password';

export async function resetDatabase(): Promise<void> {
  await db.execute(sql`
    truncate table
      reviews, favorites, bookings, event_sessions, events,
      venues, cities, countries, categories, users
    restart identity cascade
  `);
}

export async function createUser(overrides: Partial<{
  email: string;
  password: string;
  fullName: string;
  role: 'USER' | 'ADMIN';
}> = {}) {
  const email = overrides.email ?? `user-${Math.random().toString(36).slice(2, 10)}@test.local`;
  const password = overrides.password ?? 'Password!2345';
  const [row] = await db
    .insert(users)
    .values({
      email: email.toLowerCase(),
      passwordHash: await hashPassword(password),
      fullName: overrides.fullName ?? 'Test User',
      role: overrides.role ?? 'USER',
    })
    .returning({ id: users.id, email: users.email });

  return { id: row!.id, email: row!.email, password };
}

export interface WorldOptions {
  currency?: string;
  capacity?: number;
  seatsBooked?: number;
  priceMajor?: number;
  /** Hours from now until the session starts. */
  startsInHours?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  title?: string;
  categorySlug?: string;
  citySlug?: string;
  tags?: string[];
}

/** Creates a country → city → venue → category → event → session chain. */
export async function createWorld(options: WorldOptions = {}) {
  const {
    currency = 'KWD',
    capacity = 10,
    seatsBooked = 0,
    priceMajor = 12,
    startsInHours = 72,
    status = 'PUBLISHED',
    title = 'Test Experience',
    categorySlug = 'marine',
    citySlug = 'test-city',
    tags = ['boat', 'sunset'],
  } = options;

  const suffix = Math.random().toString(36).slice(2, 8);

  const [country] = await db
    .insert(countries)
    .values({
      name: `Testland ${suffix}`,
      code: suffix.slice(0, 2).toUpperCase(),
      slug: `testland-${suffix}`,
      currency,
      flagEmoji: '🏳️',
      heroImageUrl: '/covers/country__test.svg',
    })
    .returning({ id: countries.id, slug: countries.slug });

  const [city] = await db
    .insert(cities)
    .values({
      countryId: country!.id,
      name: 'Test City',
      slug: citySlug,
      timezone: 'Asia/Kuwait',
      latitude: 29.3,
      longitude: 48.0,
      heroImageUrl: '/covers/city__test.svg',
      blurb: 'A city that exists only inside the integration test suite.',
    })
    .returning({ id: cities.id, slug: cities.slug });

  const [venue] = await db
    .insert(venues)
    .values({
      cityId: city!.id,
      name: 'Test Marina',
      address: '1 Test Quay',
      latitude: 29.3,
      longitude: 48.0,
    })
    .returning({ id: venues.id });

  const [category] = await db
    .insert(categories)
    .values({
      name: `Marine ${suffix}`,
      slug: `${categorySlug}-${suffix}`,
      icon: 'Waves',
      description: 'Test category',
    })
    .returning({ id: categories.id, slug: categories.slug });

  // KWD has three minor digits; the fixture multiplies accordingly so that the
  // stored integer is genuinely in minor units for the chosen currency.
  const exponent = currency === 'KWD' ? 3 : 2;

  const [event] = await db
    .insert(events)
    .values({
      slug: `test-event-${suffix}`,
      title,
      summary: 'A summary long enough to satisfy the validation rules for events.',
      description:
        'A description long enough to satisfy the validation rules that apply to events in this application.',
      categoryId: category!.id,
      cityId: city!.id,
      venueId: venue!.id,
      heroImageUrl: '/covers/marine__test.svg',
      galleryUrls: [],
      basePriceMinor: Math.round(priceMajor * 10 ** exponent),
      currency,
      durationMinutes: 120,
      tags,
      status,
    })
    .returning({ id: events.id, slug: events.slug });

  const startsAt = new Date(Date.now() + startsInHours * 3_600_000);
  const [session] = await db
    .insert(eventSessions)
    .values({
      eventId: event!.id,
      startsAt,
      endsAt: new Date(startsAt.getTime() + 120 * 60_000),
      capacity,
      seatsBooked,
    })
    .returning({ id: eventSessions.id });

  return {
    countrySlug: country!.slug,
    citySlug: city!.slug,
    categorySlug: category!.slug,
    categoryId: category!.id,
    cityId: city!.id,
    venueId: venue!.id,
    eventId: event!.id,
    eventSlug: event!.slug,
    sessionId: session!.id,
    currency,
    capacity,
  };
}

export async function seatsBookedFor(sessionId: string): Promise<number> {
  const rows = await db.execute<{ seats_booked: number }>(
    sql`select seats_booked from event_sessions where id = ${sessionId}`,
  );
  return Number(rows[0]?.seats_booked ?? -1);
}
