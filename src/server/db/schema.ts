/**
 * Eventora — database schema (Drizzle ORM / PostgreSQL 16)
 *
 * Design notes
 * ------------
 * 1. Money is stored as an INTEGER in the currency's minor unit (cents / fils).
 *    Floating point is never used for money anywhere in this codebase.
 * 2. Availability hangs off `eventSessions`, not `events`: one event can run
 *    many times, each occurrence with its own start time, capacity and price.
 * 3. `seatsBooked` is a denormalised counter on `eventSessions`. It is only ever
 *    mutated inside a `SERIALIZABLE` transaction together with the booking row,
 *    which is what prevents overselling under concurrency.
 *    See `src/server/services/booking-service.ts`.
 * 4. Every foreign key declares an explicit ON DELETE rule so that referential
 *    integrity is enforced by PostgreSQL rather than by application code.
 */

import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  char,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { createId } from '@/server/db/id';

/* -------------------------------------------------------------------------- */
/* Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const roleEnum = pgEnum('role', ['USER', 'ADMIN']);
export const eventStatusEnum = pgEnum('event_status', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const bookingStatusEnum = pgEnum('booking_status', ['PENDING', 'CONFIRMED', 'CANCELLED']);

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  'users',
  {
    id: varchar('id', { length: 30 }).primaryKey().$defaultFn(createId),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    fullName: varchar('full_name', { length: 120 }).notNull(),
    phone: varchar('phone', { length: 32 }),
    role: roleEnum('role').notNull().default('USER'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Case-insensitive uniqueness: e-mail addresses are stored lowercased, and
    // the index guarantees "Sara@x.com" cannot register twice.
    uniqueIndex('users_email_unique').on(sql`lower(${t.email})`),
    index('users_role_idx').on(t.role),
  ],
);

/* -------------------------------------------------------------------------- */
/* Geography                                                                  */
/* -------------------------------------------------------------------------- */

export const countries = pgTable('countries', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(createId),
  name: varchar('name', { length: 120 }).notNull().unique(),
  /** ISO 3166-1 alpha-2 */
  code: char('code', { length: 2 }).notNull().unique(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  /** ISO 4217 */
  currency: char('currency', { length: 3 }).notNull(),
  flagEmoji: varchar('flag_emoji', { length: 16 }).notNull(),
  heroImageUrl: text('hero_image_url').notNull(),
});

export const cities = pgTable(
  'cities',
  {
    id: varchar('id', { length: 30 }).primaryKey().$defaultFn(createId),
    countryId: varchar('country_id', { length: 30 })
      .notNull()
      .references(() => countries.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    slug: varchar('slug', { length: 120 }).notNull(),
    /** IANA time zone, e.g. "Asia/Kuwait" */
    timezone: varchar('timezone', { length: 64 }).notNull(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    heroImageUrl: text('hero_image_url').notNull(),
    blurb: text('blurb').notNull(),
  },
  (t) => [
    uniqueIndex('cities_country_slug_unique').on(t.countryId, t.slug),
    index('cities_country_idx').on(t.countryId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Taxonomy                                                                   */
/* -------------------------------------------------------------------------- */

export const categories = pgTable('categories', {
  id: varchar('id', { length: 30 }).primaryKey().$defaultFn(createId),
  name: varchar('name', { length: 80 }).notNull().unique(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  /** lucide-react icon name, resolved by src/components/category-icon.tsx */
  icon: varchar('icon', { length: 40 }).notNull(),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const venues = pgTable(
  'venues',
  {
    id: varchar('id', { length: 30 }).primaryKey().$defaultFn(createId),
    cityId: varchar('city_id', { length: 30 })
      .notNull()
      .references(() => cities.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 160 }).notNull(),
    address: text('address').notNull(),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
  },
  (t) => [index('venues_city_idx').on(t.cityId)],
);

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

export const events = pgTable(
  'events',
  {
    id: varchar('id', { length: 30 }).primaryKey().$defaultFn(createId),
    slug: varchar('slug', { length: 180 }).notNull().unique(),
    title: varchar('title', { length: 180 }).notNull(),
    summary: varchar('summary', { length: 320 }).notNull(),
    description: text('description').notNull(),
    categoryId: varchar('category_id', { length: 30 })
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    cityId: varchar('city_id', { length: 30 })
      .notNull()
      .references(() => cities.id, { onDelete: 'cascade' }),
    venueId: varchar('venue_id', { length: 30 })
      .notNull()
      .references(() => venues.id, { onDelete: 'restrict' }),
    heroImageUrl: text('hero_image_url').notNull(),
    galleryUrls: text('gallery_urls').array().notNull().default(sql`ARRAY[]::text[]`),
    /** Price in minor units of `currency` (e.g. 4500 = 45.000 KWD) */
    basePriceMinor: integer('base_price_minor').notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    minAge: integer('min_age').notNull().default(0),
    tags: text('tags').array().notNull().default(sql`ARRAY[]::text[]`),
    isFeatured: boolean('is_featured').notNull().default(false),
    status: eventStatusEnum('status').notNull().default('PUBLISHED'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('events_city_status_idx').on(t.cityId, t.status),
    index('events_category_idx').on(t.categoryId),
    index('events_featured_idx').on(t.status, t.isFeatured),
    // Trigram-free full-text support: a GIN index over the searchable columns.
    index('events_search_idx').using(
      'gin',
      sql`to_tsvector('english', ${t.title} || ' ' || ${t.summary})`,
    ),
  ],
);

export const eventSessions = pgTable(
  'event_sessions',
  {
    id: varchar('id', { length: 30 }).primaryKey().$defaultFn(createId),
    eventId: varchar('event_id', { length: 30 })
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    capacity: integer('capacity').notNull(),
    seatsBooked: integer('seats_booked').notNull().default(0),
    /** Overrides events.base_price_minor for this occurrence when set */
    priceOverrideMinor: integer('price_override_minor'),
  },
  (t) => [
    index('event_sessions_event_start_idx').on(t.eventId, t.startsAt),
    index('event_sessions_start_idx').on(t.startsAt),
  ],
);

/* -------------------------------------------------------------------------- */
/* Bookings & engagement                                                      */
/* -------------------------------------------------------------------------- */

export const bookings = pgTable(
  'bookings',
  {
    id: varchar('id', { length: 30 }).primaryKey().$defaultFn(createId),
    /** Human-facing reference, e.g. EVT-7K2QX4 */
    reference: varchar('reference', { length: 16 }).notNull().unique(),
    userId: varchar('user_id', { length: 30 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    sessionId: varchar('session_id', { length: 30 })
      .notNull()
      .references(() => eventSessions.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull(),
    unitPriceMinor: integer('unit_price_minor').notNull(),
    totalMinor: integer('total_minor').notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    status: bookingStatusEnum('status').notNull().default('CONFIRMED'),
    guestName: varchar('guest_name', { length: 120 }).notNull(),
    guestEmail: varchar('guest_email', { length: 255 }).notNull(),
    guestPhone: varchar('guest_phone', { length: 32 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('bookings_user_created_idx').on(t.userId, t.createdAt),
    index('bookings_session_idx').on(t.sessionId),
    index('bookings_status_idx').on(t.status),
  ],
);

export const favorites = pgTable(
  'favorites',
  {
    id: varchar('id', { length: 30 }).primaryKey().$defaultFn(createId),
    userId: varchar('user_id', { length: 30 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventId: varchar('event_id', { length: 30 })
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('favorites_user_event_unique').on(t.userId, t.eventId),
    index('favorites_user_idx').on(t.userId),
  ],
);

export const reviews = pgTable(
  'reviews',
  {
    id: varchar('id', { length: 30 }).primaryKey().$defaultFn(createId),
    eventId: varchar('event_id', { length: 30 })
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 30 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('reviews_event_user_unique').on(t.eventId, t.userId),
    index('reviews_event_idx').on(t.eventId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Relations (used by Drizzle's relational query API)                          */
/* -------------------------------------------------------------------------- */

export const countriesRelations = relations(countries, ({ many }) => ({
  cities: many(cities),
}));

export const citiesRelations = relations(cities, ({ one, many }) => ({
  country: one(countries, { fields: [cities.countryId], references: [countries.id] }),
  venues: many(venues),
  events: many(events),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  events: many(events),
}));

export const venuesRelations = relations(venues, ({ one, many }) => ({
  city: one(cities, { fields: [venues.cityId], references: [cities.id] }),
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  category: one(categories, { fields: [events.categoryId], references: [categories.id] }),
  city: one(cities, { fields: [events.cityId], references: [cities.id] }),
  venue: one(venues, { fields: [events.venueId], references: [venues.id] }),
  sessions: many(eventSessions),
  favorites: many(favorites),
  reviews: many(reviews),
}));

export const eventSessionsRelations = relations(eventSessions, ({ one, many }) => ({
  event: one(events, { fields: [eventSessions.eventId], references: [events.id] }),
  bookings: many(bookings),
}));

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  favorites: many(favorites),
  reviews: many(reviews),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  session: one(eventSessions, { fields: [bookings.sessionId], references: [eventSessions.id] }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  event: one(events, { fields: [favorites.eventId], references: [events.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  event: one(events, { fields: [reviews.eventId], references: [events.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));

/* -------------------------------------------------------------------------- */
/* Inferred row types                                                          */
/* -------------------------------------------------------------------------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Country = typeof countries.$inferSelect;
export type City = typeof cities.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventSession = typeof eventSessions.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];
export type EventStatus = (typeof eventStatusEnum.enumValues)[number];
export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];
