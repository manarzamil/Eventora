/**
 * Seeds the database with the demo dataset in `seed-data.ts`.
 *
 * The script is idempotent by truncation: it clears every table and rebuilds
 * from scratch, so running it twice produces the same database. Schedules,
 * capacities and review distributions are generated from a deterministic PRNG
 * seeded by each event's slug, which means the demo looks organically varied
 * but is identical on every machine — a screenshot in the README matches what a
 * reviewer sees after cloning.
 *
 * ⚠️ Everything created here is clearly-labelled demonstration data. See the
 * header of `seed-data.ts`.
 */
import 'dotenv/config';
import { hash as hashPassword } from 'bcryptjs';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';

import * as schema from '@/server/db/schema';
import { COUNTRIES, CATEGORIES, DEMO_ACCOUNTS, REVIEWER_NAMES, REVIEW_COMMENTS } from '@/server/db/seed-data';
import { coverUrl, type Motif } from '@/lib/covers';
import { slugify, uniqueSlug } from '@/lib/slug';
import { toMinorUnits } from '@/lib/money';
import { createBookingReference } from '@/server/db/id';
import { zonedTimeToUtc } from '@/lib/timezone';

/* -------------------------------------------------------------------------- */
/* Deterministic PRNG                                                          */
/* -------------------------------------------------------------------------- */

function makeRng(seed: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  let state = h >>> 0 || 1;
  return {
    next(): number {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      state >>>= 0;
      return state / 0xffffffff;
    },
    int(min: number, max: number): number {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    pick<T>(items: readonly T[]): T {
      return items[Math.floor(this.next() * items.length)] as T;
    },
    chance(p: number): boolean {
      return this.next() < p;
    },
  };
}

type Rng = ReturnType<typeof makeRng>;

/* -------------------------------------------------------------------------- */
/* Scheduling rules                                                            */
/* -------------------------------------------------------------------------- */

/** Typical capacity by category — an arena is not a pottery studio. */
const CAPACITY_RANGE: Record<string, [number, number]> = {
  concerts: [220, 900],
  entertainment: [90, 400],
  sports: [24, 260],
  cultural: [14, 40],
  outdoor: [10, 28],
  marine: [8, 34],
  experiences: [10, 30],
  workshops: [8, 16],
  family: [80, 400],
  local: [60, 300],
};

/** Start-of-day hour chosen from the event's own tags. */
function startHourFor(tags: string[], rng: Rng): { hour: number; minute: number } {
  const t = tags.join(' ');
  if (t.includes('sunrise')) return { hour: 5, minute: rng.pick([15, 30, 45]) };
  if (t.includes('sunset')) return { hour: 17, minute: rng.pick([0, 15, 30]) };
  if (t.includes('nightlife') || t.includes('late')) return { hour: 22, minute: 0 };
  if (t.includes('evening') || t.includes('stargazing')) return { hour: 19, minute: rng.pick([0, 30]) };
  return { hour: rng.pick([9, 10, 11, 14, 15, 16, 18, 20]), minute: rng.pick([0, 0, 30]) };
}

/** How often the event repeats, in days. */
function cadenceFor(category: string, rng: Rng): number {
  switch (category) {
    case 'concerts':
      return rng.int(6, 12);
    case 'entertainment':
      return rng.int(3, 6);
    case 'sports':
      return rng.int(4, 9);
    case 'family':
    case 'local':
      return rng.int(2, 4);
    default:
      return rng.int(1, 3);
  }
}

/* -------------------------------------------------------------------------- */
/* Seeder                                                                      */
/* -------------------------------------------------------------------------- */

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set.');

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  console.log('→ clearing existing rows…');
  await db.execute(sql`
    truncate table
      ${schema.reviews}, ${schema.favorites}, ${schema.bookings},
      ${schema.eventSessions}, ${schema.events}, ${schema.venues},
      ${schema.cities}, ${schema.countries}, ${schema.categories}, ${schema.users}
    restart identity cascade
  `);

  /* ---------------------------------------------------------------- users */

  console.log('→ users…');
  const [adminHash, customerHash, reviewerHash] = await Promise.all([
    hashPassword(DEMO_ACCOUNTS.admin.password, 10),
    hashPassword(DEMO_ACCOUNTS.customer.password, 10),
    hashPassword('Reviewer!2345', 10),
  ]);

  const insertedUsers = await db
    .insert(schema.users)
    .values([
      {
        email: DEMO_ACCOUNTS.admin.email,
        passwordHash: adminHash!,
        fullName: DEMO_ACCOUNTS.admin.fullName,
        phone: DEMO_ACCOUNTS.admin.phone,
        role: 'ADMIN' as const,
      },
      {
        email: DEMO_ACCOUNTS.customer.email,
        passwordHash: customerHash!,
        fullName: DEMO_ACCOUNTS.customer.fullName,
        phone: DEMO_ACCOUNTS.customer.phone,
        role: 'USER' as const,
      },
      ...REVIEWER_NAMES.map((name, i) => ({
        email: `${slugify(name)}@eventora.demo`,
        passwordHash: reviewerHash!,
        fullName: name,
        phone: null,
        role: 'USER' as const,
        createdAt: new Date(Date.now() - (200 - i * 7) * 86_400_000),
      })),
    ])
    .returning({ id: schema.users.id, email: schema.users.email, role: schema.users.role });

  const adminId = insertedUsers.find((u) => u.email === DEMO_ACCOUNTS.admin.email)!.id;
  const customerId = insertedUsers.find((u) => u.email === DEMO_ACCOUNTS.customer.email)!.id;
  const reviewerIds = insertedUsers
    .filter((u) => u.id !== adminId && u.id !== customerId)
    .map((u) => u.id);

  /* ----------------------------------------------------------- categories */

  console.log('→ categories…');
  const insertedCategories = await db
    .insert(schema.categories)
    .values(
      CATEGORIES.map((c, i) => ({
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        description: c.description,
        sortOrder: i,
      })),
    )
    .returning({ id: schema.categories.id, slug: schema.categories.slug });

  const categoryIdBySlug = new Map(insertedCategories.map((c) => [c.slug, c.id]));
  const motifBySlug = new Map<string, Motif>(CATEGORIES.map((c) => [c.slug, c.motif]));

  /* ------------------------------------------------ countries → … → events */

  const takenSlugs = new Set<string>();
  let eventCount = 0;
  let sessionCount = 0;
  const allEventIds: { id: string; slug: string; currency: string }[] = [];

  for (const country of COUNTRIES) {
    console.log(`→ ${country.name}…`);

    const [insertedCountry] = await db
      .insert(schema.countries)
      .values({
        name: country.name,
        code: country.code,
        slug: country.slug,
        currency: country.currency,
        flagEmoji: country.flagEmoji,
        heroImageUrl: coverUrl('country', country.slug),
      })
      .returning({ id: schema.countries.id });

    for (const city of country.cities) {
      const [insertedCity] = await db
        .insert(schema.cities)
        .values({
          countryId: insertedCountry!.id,
          name: city.name,
          slug: city.slug,
          timezone: city.timezone,
          latitude: city.latitude,
          longitude: city.longitude,
          heroImageUrl: coverUrl('city', city.slug),
          blurb: city.blurb,
        })
        .returning({ id: schema.cities.id });

      const insertedVenues = await db
        .insert(schema.venues)
        .values(
          city.venues.map((v) => ({
            cityId: insertedCity!.id,
            name: v.name,
            address: v.address,
            latitude: v.latitude,
            longitude: v.longitude,
          })),
        )
        .returning({ id: schema.venues.id });

      for (const event of city.events) {
        const slug = uniqueSlug(slugify(`${event.title} ${city.slug}`), takenSlugs);
        const motif = motifBySlug.get(event.category) ?? 'local';
        const rng = makeRng(slug);

        const [insertedEvent] = await db
          .insert(schema.events)
          .values({
            slug,
            title: event.title,
            summary: event.summary,
            description: event.description,
            categoryId: categoryIdBySlug.get(event.category)!,
            cityId: insertedCity!.id,
            venueId: insertedVenues[event.venue]!.id,
            heroImageUrl: coverUrl(motif, slug),
            galleryUrls: [
              coverUrl(motif, `${slug}-2`),
              coverUrl(motif, `${slug}-3`),
              coverUrl(motif, `${slug}-4`),
            ],
            basePriceMinor: toMinorUnits(event.price, country.currency),
            currency: country.currency,
            durationMinutes: event.durationMinutes,
            minAge: event.minAge ?? 0,
            tags: event.tags,
            isFeatured: event.featured ?? false,
            status: 'PUBLISHED' as const,
          })
          .returning({ id: schema.events.id });

        eventCount += 1;
        allEventIds.push({ id: insertedEvent!.id, slug, currency: country.currency });

        /* ------------------------------------------------------ sessions */

        const cadence = cadenceFor(event.category, rng);
        const [capMin, capMax] = CAPACITY_RANGE[event.category] ?? [20, 80];
        const sessionRows: (typeof schema.eventSessions.$inferInsert)[] = [];

        // Start from tomorrow so nothing in the demo is already in the past.
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        for (let day = 1; day <= 75; day += cadence) {
          // A little jitter so schedules do not look mechanically regular.
          const offset = day + (rng.chance(0.25) ? 1 : 0);
          const { hour, minute } = startHourFor(event.tags, rng);

          // The chosen hour is a LOCAL wall time in the city, not a UTC one:
          // a sunset cruise starts at 17:30 in Dubai wherever you are reading
          // this from. `zonedTimeToUtc` turns that back into the stored instant.
          const calendar = new Date(today.getTime() + offset * 86_400_000);
          const startsAt = zonedTimeToUtc(
            calendar.getUTCFullYear(),
            calendar.getUTCMonth() + 1,
            calendar.getUTCDate(),
            hour,
            minute,
            city.timezone,
          );
          const endsAt = new Date(startsAt.getTime() + event.durationMinutes * 60_000);

          const capacity = rng.int(capMin, capMax);
          // Demand curve: sessions in the next fortnight fill up more.
          const pressure = offset <= 14 ? rng.next() * 0.55 + 0.45 : rng.next() * 0.6;
          const seatsBooked = Math.min(capacity, Math.floor(capacity * pressure));

          sessionRows.push({
            eventId: insertedEvent!.id,
            startsAt,
            endsAt,
            capacity,
            seatsBooked,
            priceOverrideMinor:
              rng.chance(0.14) && event.price > 0
                ? toMinorUnits(
                    Math.round(event.price * rng.pick([0.8, 0.85, 1.15, 1.25]) * 100) / 100,
                    country.currency,
                  )
                : null,
          });
        }

        if (sessionRows.length > 0) {
          await db.insert(schema.eventSessions).values(sessionRows);
          sessionCount += sessionRows.length;
        }

        /* ------------------------------------------------------- reviews */

        const reviewCount = rng.int(0, 6);
        const usedReviewers = new Set<string>();
        const reviewRows: (typeof schema.reviews.$inferInsert)[] = [];

        for (let i = 0; i < reviewCount; i += 1) {
          const reviewerId = rng.pick(reviewerIds);
          if (usedReviewers.has(reviewerId)) continue;
          usedReviewers.add(reviewerId);
          reviewRows.push({
            eventId: insertedEvent!.id,
            userId: reviewerId,
            // Skewed high, as real marketplace ratings are, but not uniformly 5.
            rating: rng.chance(0.62) ? 5 : rng.chance(0.7) ? 4 : rng.int(2, 3),
            comment: rng.pick(REVIEW_COMMENTS),
            createdAt: new Date(Date.now() - rng.int(3, 180) * 86_400_000),
          });
        }

        if (reviewRows.length > 0) {
          await db.insert(schema.reviews).values(reviewRows);
        }
      }
    }
  }

  /* ---------------------------------------------- demo bookings & favourites */

  console.log('→ demo bookings and favourites for the customer account…');

  const upcoming = await db
    .select({
      sessionId: schema.eventSessions.id,
      capacity: schema.eventSessions.capacity,
      seatsBooked: schema.eventSessions.seatsBooked,
      priceOverrideMinor: schema.eventSessions.priceOverrideMinor,
      basePriceMinor: schema.events.basePriceMinor,
      currency: schema.events.currency,
      eventId: schema.events.id,
    })
    .from(schema.eventSessions)
    .innerJoin(schema.events, sql`${schema.events.id} = ${schema.eventSessions.eventId}`)
    .where(sql`${schema.eventSessions.startsAt} > now() and ${schema.eventSessions.seatsBooked} < ${schema.eventSessions.capacity} - 4`)
    .orderBy(sql`random()`)
    .limit(5);

  for (const row of upcoming) {
    const rng = makeRng(row.sessionId);
    const quantity = rng.int(1, 3);
    const unit = row.priceOverrideMinor ?? row.basePriceMinor;
    await db.insert(schema.bookings).values({
      reference: createBookingReference(),
      userId: customerId,
      sessionId: row.sessionId,
      quantity,
      unitPriceMinor: unit,
      totalMinor: unit * quantity,
      currency: row.currency,
      status: 'CONFIRMED',
      guestName: DEMO_ACCOUNTS.customer.fullName,
      guestEmail: DEMO_ACCOUNTS.customer.email,
      guestPhone: DEMO_ACCOUNTS.customer.phone,
    });
    await db
      .update(schema.eventSessions)
      .set({ seatsBooked: sql`${schema.eventSessions.seatsBooked} + ${quantity}` })
      .where(sql`${schema.eventSessions.id} = ${row.sessionId}`);
  }

  const favouriteTargets = allEventIds
    .filter((_, i) => i % 11 === 3)
    .slice(0, 6)
    .map((e) => ({ userId: customerId, eventId: e.id }));

  if (favouriteTargets.length > 0) {
    await db.insert(schema.favorites).values(favouriteTargets);
  }

  /* ------------------------------------------------------------------ done */

  console.log('');
  console.log('✔ seed complete');
  console.log(`  countries : ${COUNTRIES.length}`);
  console.log(`  cities    : ${COUNTRIES.reduce((n, c) => n + c.cities.length, 0)}`);
  console.log(`  categories: ${CATEGORIES.length}`);
  console.log(`  events    : ${eventCount}`);
  console.log(`  sessions  : ${sessionCount}`);
  console.log('');
  console.log('  Demo accounts (DEMO DATA — do not reuse these credentials anywhere):');
  console.log(`    admin    → ${DEMO_ACCOUNTS.admin.email} / ${DEMO_ACCOUNTS.admin.password}`);
  console.log(`    customer → ${DEMO_ACCOUNTS.customer.email} / ${DEMO_ACCOUNTS.customer.password}`);
  console.log('');

  await client.end();
}

main().catch((error) => {
  console.error('✖ seed failed');
  console.error(error);
  process.exit(1);
});
