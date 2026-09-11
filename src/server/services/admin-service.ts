import 'server-only';
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
import { badRequest, conflict, notFound } from '@/server/api/errors';
import { slugify } from '@/lib/slug';
import { fromMinorUnits, toMinorUnits } from '@/lib/money';
import { coverUrl, isMotif, type Motif } from '@/lib/covers';
import type {
  AdminCategoryInput,
  AdminCityInput,
  AdminCountryInput,
  AdminEventInput,
  AdminSessionInput,
  AdminVenueInput,
} from '@/lib/validation';

/* -------------------------------------------------------------------------- */
/* Dashboard statistics                                                        */
/* -------------------------------------------------------------------------- */

export interface AdminStats {
  totals: {
    events: number;
    publishedEvents: number;
    draftEvents: number;
    cities: number;
    countries: number;
    categories: number;
    users: number;
    bookings: number;
    upcomingSessions: number;
  };
  revenueByCurrency: { currency: string; totalMinor: number; bookings: number }[];
  bookingsLast14Days: { day: string; bookings: number }[];
  topEvents: { id: string; title: string; city: string; bookings: number; seats: number }[];
  occupancy: { averagePercent: number; soldOutSessions: number };
  recentBookings: {
    reference: string;
    guestName: string;
    eventTitle: string;
    quantity: number;
    totalMinor: number;
    currency: string;
    status: string;
    createdAt: string;
  }[];
}

export async function getAdminStats(): Promise<AdminStats> {
  const [totals] = await db.execute<{
    events: number; published_events: number; draft_events: number; cities: number;
    countries: number; categories: number; users: number; bookings: number;
    upcoming_sessions: number;
  }>(sql`
    select
      (select count(*)::int from events) as events,
      (select count(*)::int from events where status = 'PUBLISHED') as published_events,
      (select count(*)::int from events where status = 'DRAFT') as draft_events,
      (select count(*)::int from cities) as cities,
      (select count(*)::int from countries) as countries,
      (select count(*)::int from categories) as categories,
      (select count(*)::int from users) as users,
      (select count(*)::int from bookings) as bookings,
      (select count(*)::int from event_sessions where starts_at > now()) as upcoming_sessions
  `);

  const revenue = await db.execute<{ currency: string; total_minor: number; bookings: number }>(sql`
    select currency, sum(total_minor)::bigint as total_minor, count(*)::int as bookings
    from bookings where status <> 'CANCELLED'
    group by currency order by total_minor desc
  `);

  // generate_series guarantees a row for every day, including days with no
  // bookings — otherwise the chart would silently compress its own x-axis.
  const daily = await db.execute<{ day: string; bookings: number }>(sql`
    select to_char(d.day, 'YYYY-MM-DD') as day,
           count(b.id)::int as bookings
    from generate_series(current_date - interval '13 days', current_date, interval '1 day') as d(day)
      left join bookings b on b.created_at::date = d.day::date
    group by d.day order by d.day asc
  `);

  const topEvents = await db.execute<{
    id: string; title: string; city: string; bookings: number; seats: number;
  }>(sql`
    select e.id, e.title, ci.name as city,
           count(b.id)::int as bookings,
           coalesce(sum(b.quantity), 0)::int as seats
    from events e
      join cities ci on ci.id = e.city_id
      left join event_sessions s on s.event_id = e.id
      left join bookings b on b.session_id = s.id and b.status <> 'CANCELLED'
    group by e.id, ci.name
    having count(b.id) > 0
    order by seats desc
    limit 8
  `);

  const [occupancy] = await db.execute<{ average_percent: string | null; sold_out: number }>(sql`
    select
      avg(case when capacity > 0 then seats_booked::numeric * 100 / capacity end)::numeric(5,2)
        as average_percent,
      count(*) filter (where seats_booked >= capacity)::int as sold_out
    from event_sessions where starts_at > now()
  `);

  const recent = await db.execute<{
    reference: string; guest_name: string; event_title: string; quantity: number;
    total_minor: number; currency: string; status: string; created_at: Date;
  }>(sql`
    select b.reference, b.guest_name, e.title as event_title, b.quantity,
           b.total_minor, b.currency, b.status, b.created_at
    from bookings b
      join event_sessions s on s.id = b.session_id
      join events e on e.id = s.event_id
    order by b.created_at desc
    limit 10
  `);

  return {
    totals: {
      events: Number(totals?.events ?? 0),
      publishedEvents: Number(totals?.published_events ?? 0),
      draftEvents: Number(totals?.draft_events ?? 0),
      cities: Number(totals?.cities ?? 0),
      countries: Number(totals?.countries ?? 0),
      categories: Number(totals?.categories ?? 0),
      users: Number(totals?.users ?? 0),
      bookings: Number(totals?.bookings ?? 0),
      upcomingSessions: Number(totals?.upcoming_sessions ?? 0),
    },
    revenueByCurrency: revenue.map((r) => ({
      currency: r.currency,
      totalMinor: Number(r.total_minor),
      bookings: Number(r.bookings),
    })),
    bookingsLast14Days: daily.map((d) => ({ day: d.day, bookings: Number(d.bookings) })),
    topEvents: topEvents.map((e) => ({
      id: e.id,
      title: e.title,
      city: e.city,
      bookings: Number(e.bookings),
      seats: Number(e.seats),
    })),
    occupancy: {
      averagePercent: Math.round(Number(occupancy?.average_percent ?? 0)),
      soldOutSessions: Number(occupancy?.sold_out ?? 0),
    },
    recentBookings: recent.map((r) => ({
      reference: r.reference,
      guestName: r.guest_name,
      eventTitle: r.event_title,
      quantity: Number(r.quantity),
      totalMinor: Number(r.total_minor),
      currency: r.currency,
      status: r.status,
      createdAt: new Date(r.created_at).toISOString(),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Events                                                                      */
/* -------------------------------------------------------------------------- */

export interface AdminEventRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  isFeatured: boolean;
  basePriceMinor: number;
  currency: string;
  category: string;
  city: string;
  country: string;
  sessionCount: number;
  bookedSeats: number;
  updatedAt: string;
}

export async function listAdminEvents(opts: {
  q?: string;
  status?: string;
  cityId?: string;
  page?: number;
  perPage?: number;
}): Promise<{ items: AdminEventRow[]; total: number; page: number; pageCount: number }> {
  const page = opts.page ?? 1;
  const perPage = opts.perPage ?? 20;
  const filters = [sql`true`];
  if (opts.q) filters.push(sql`e.title ilike ${`%${opts.q}%`}`);
  if (opts.status) filters.push(sql`e.status = ${opts.status}`);
  if (opts.cityId) filters.push(sql`e.city_id = ${opts.cityId}`);
  const where = filters.reduce((a, f, i) => (i === 0 ? f : sql`${a} and ${f}`));

  const rows = await db.execute<{
    id: string; slug: string; title: string; status: string; is_featured: boolean;
    base_price_minor: number; currency: string; category: string; city: string;
    country: string; session_count: number; booked_seats: number; updated_at: Date;
  }>(sql`
    select e.id, e.slug, e.title, e.status, e.is_featured, e.base_price_minor, e.currency,
           cat.name as category, ci.name as city, co.name as country,
           (select count(*)::int from event_sessions s where s.event_id = e.id) as session_count,
           (select coalesce(sum(s.seats_booked), 0)::int from event_sessions s where s.event_id = e.id)
             as booked_seats,
           e.updated_at
    from events e
      join categories cat on cat.id = e.category_id
      join cities ci on ci.id = e.city_id
      join countries co on co.id = ci.country_id
    where ${where}
    order by e.updated_at desc
    limit ${perPage} offset ${(page - 1) * perPage}
  `);

  const [count] = await db.execute<{ total: number }>(sql`
    select count(*)::int as total from events e
      join categories cat on cat.id = e.category_id
      join cities ci on ci.id = e.city_id
      join countries co on co.id = ci.country_id
    where ${where}
  `);

  const total = Number(count?.total ?? 0);
  return {
    items: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      status: r.status,
      isFeatured: r.is_featured,
      basePriceMinor: Number(r.base_price_minor),
      currency: r.currency,
      category: r.category,
      city: r.city,
      country: r.country,
      sessionCount: Number(r.session_count),
      bookedSeats: Number(r.booked_seats),
      updatedAt: new Date(r.updated_at).toISOString(),
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

export interface AdminEventDetail {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  categoryId: string;
  cityId: string;
  venueId: string;
  price: number;
  currency: string;
  durationMinutes: number;
  minAge: number;
  tags: string[];
  isFeatured: boolean;
  status: string;
}

/** Single event for the edit form — unlike the public reader, any status. */
export async function getAdminEvent(id: string): Promise<AdminEventDetail> {
  const [row] = await db.execute<{
    id: string; slug: string; title: string; summary: string; description: string;
    category_id: string; city_id: string; venue_id: string; base_price_minor: number;
    currency: string; duration_minutes: number; min_age: number; tags: string[];
    is_featured: boolean; status: string;
  }>(sql`
    select id, slug, title, summary, description, category_id, city_id, venue_id,
           base_price_minor, currency, duration_minutes, min_age, tags, is_featured, status
    from events where id = ${id} limit 1
  `);

  if (!row) throw notFound('That event does not exist.');

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description,
    categoryId: row.category_id,
    cityId: row.city_id,
    venueId: row.venue_id,
    price: fromMinorUnits(Number(row.base_price_minor), row.currency),
    currency: row.currency,
    durationMinutes: Number(row.duration_minutes),
    minAge: Number(row.min_age),
    tags: row.tags ?? [],
    isFeatured: row.is_featured,
    status: row.status,
  };
}

async function resolveEventContext(input: AdminEventInput) {
  const [city] = await db.execute<{ id: string; currency: string; country_id: string }>(sql`
    select ci.id, co.currency, co.id as country_id
    from cities ci join countries co on co.id = ci.country_id
    where ci.id = ${input.cityId} limit 1
  `);
  if (!city) throw badRequest('That city does not exist.');

  const [venue] = await db.execute<{ id: string }>(sql`
    select id from venues where id = ${input.venueId} and city_id = ${input.cityId} limit 1
  `);
  if (!venue) throw badRequest('That venue is not in the selected city.');

  const [category] = await db.execute<{ id: string; slug: string }>(sql`
    select id, slug from categories where id = ${input.categoryId} limit 1
  `);
  if (!category) throw badRequest('That category does not exist.');

  const motif: Motif = isMotif(category.slug) ? category.slug : 'local';
  return { currency: city.currency, motif };
}

export async function createEvent(input: AdminEventInput) {
  const { currency, motif } = await resolveEventContext(input);
  const base = slugify(input.title);
  const slug = await uniqueEventSlug(base);

  const [row] = await db
    .insert(events)
    .values({
      slug,
      title: input.title,
      summary: input.summary,
      description: input.description,
      categoryId: input.categoryId,
      cityId: input.cityId,
      venueId: input.venueId,
      heroImageUrl: coverUrl(motif, slug),
      galleryUrls: [coverUrl(motif, `${slug}-2`), coverUrl(motif, `${slug}-3`)],
      basePriceMinor: toMinorUnits(input.price, currency),
      currency,
      durationMinutes: input.durationMinutes,
      minAge: input.minAge,
      tags: input.tags,
      isFeatured: input.isFeatured,
      status: input.status,
    })
    .returning({ id: events.id, slug: events.slug });

  return row!;
}

async function uniqueEventSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base || 'event';
  let n = 2;
  for (;;) {
    const rows = await db.execute<{ id: string }>(sql`
      select id from events where slug = ${slug}
        ${excludeId ? sql`and id <> ${excludeId}` : sql``}
      limit 1
    `);
    if (rows.length === 0) return slug;
    slug = `${base}-${n}`;
    n += 1;
  }
}

export async function updateEvent(id: string, input: AdminEventInput) {
  const [existing] = await db.execute<{ id: string; slug: string; title: string }>(sql`
    select id, slug, title from events where id = ${id} limit 1
  `);
  if (!existing) throw notFound('That event does not exist.');

  const { currency, motif } = await resolveEventContext(input);
  // Only re-slug when the title actually changed, so existing links keep working
  // for as long as possible.
  const slug =
    existing.title === input.title
      ? existing.slug
      : await uniqueEventSlug(slugify(input.title), id);

  await db
    .update(events)
    .set({
      slug,
      title: input.title,
      summary: input.summary,
      description: input.description,
      categoryId: input.categoryId,
      cityId: input.cityId,
      venueId: input.venueId,
      heroImageUrl: coverUrl(motif, slug),
      basePriceMinor: toMinorUnits(input.price, currency),
      currency,
      durationMinutes: input.durationMinutes,
      minAge: input.minAge,
      tags: input.tags,
      isFeatured: input.isFeatured,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(sql`${events.id} = ${id}`);

  return { id, slug };
}

/**
 * Deleting an event cascades to its sessions and therefore to bookings, so an
 * event with paying customers attached is archived instead. Destroying booking
 * history to tidy a list is not an acceptable admin action.
 */
export async function deleteEvent(id: string): Promise<{ deleted: boolean; archived: boolean }> {
  const [counts] = await db.execute<{ bookings: number }>(sql`
    select count(b.id)::int as bookings
    from event_sessions s left join bookings b on b.session_id = s.id
    where s.event_id = ${id}
  `);

  if (Number(counts?.bookings ?? 0) > 0) {
    await db
      .update(events)
      .set({ status: 'ARCHIVED', isFeatured: false, updatedAt: new Date() })
      .where(sql`${events.id} = ${id}`);
    return { deleted: false, archived: true };
  }

  const removed = await db.execute<{ id: string }>(sql`
    delete from events where id = ${id} returning id
  `);
  if (removed.length === 0) throw notFound('That event does not exist.');
  return { deleted: true, archived: false };
}

/* -------------------------------------------------------------------------- */
/* Sessions                                                                    */
/* -------------------------------------------------------------------------- */

export async function listEventSessions(eventId: string) {
  const rows = await db.execute<{
    id: string; starts_at: Date; ends_at: Date; capacity: number;
    seats_booked: number; price_override_minor: number | null; booking_count: number;
  }>(sql`
    select s.id, s.starts_at, s.ends_at, s.capacity, s.seats_booked, s.price_override_minor,
           (select count(*)::int from bookings b where b.session_id = s.id and b.status <> 'CANCELLED')
             as booking_count
    from event_sessions s where s.event_id = ${eventId}
    order by s.starts_at asc
  `);
  return rows.map((r) => ({
    id: r.id,
    startsAt: new Date(r.starts_at).toISOString(),
    endsAt: new Date(r.ends_at).toISOString(),
    capacity: Number(r.capacity),
    seatsBooked: Number(r.seats_booked),
    priceOverrideMinor: r.price_override_minor === null ? null : Number(r.price_override_minor),
    bookingCount: Number(r.booking_count),
  }));
}

export async function createEventSession(eventId: string, input: AdminSessionInput) {
  const [event] = await db.execute<{ id: string; duration_minutes: number; currency: string }>(sql`
    select id, duration_minutes, currency from events where id = ${eventId} limit 1
  `);
  if (!event) throw notFound('That event does not exist.');

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(startsAt.getTime() + Number(event.duration_minutes) * 60_000);

  const [row] = await db
    .insert(eventSessions)
    .values({
      eventId,
      startsAt,
      endsAt,
      capacity: input.capacity,
      priceOverrideMinor:
        input.priceOverride === null || input.priceOverride === undefined
          ? null
          : toMinorUnits(input.priceOverride, event.currency),
    })
    .returning({ id: eventSessions.id });

  return row!;
}

export async function deleteEventSession(sessionId: string) {
  const [counts] = await db.execute<{ bookings: number }>(sql`
    select count(*)::int as bookings from bookings
    where session_id = ${sessionId} and status <> 'CANCELLED'
  `);
  if (Number(counts?.bookings ?? 0) > 0) {
    throw conflict('That date has active bookings. Cancel them before removing it.');
  }
  const removed = await db.execute<{ id: string }>(sql`
    delete from event_sessions where id = ${sessionId} returning id
  `);
  if (removed.length === 0) throw notFound('That date does not exist.');
}

/* -------------------------------------------------------------------------- */
/* Geography & taxonomy                                                        */
/* -------------------------------------------------------------------------- */

export async function createCountry(input: AdminCountryInput) {
  const slug = slugify(input.name);
  try {
    const [row] = await db
      .insert(countries)
      .values({
        name: input.name,
        code: input.code,
        slug,
        currency: input.currency,
        flagEmoji: input.flagEmoji,
        heroImageUrl: coverUrl('country', slug),
      })
      .returning({ id: countries.id, slug: countries.slug });
    return row!;
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === '23505') {
      throw conflict('A country with that name or code already exists.');
    }
    throw error;
  }
}

export async function deleteCountry(id: string) {
  const [counts] = await db.execute<{ events: number }>(sql`
    select count(e.id)::int as events from cities ci
      left join events e on e.city_id = ci.id
    where ci.country_id = ${id}
  `);
  if (Number(counts?.events ?? 0) > 0) {
    throw conflict('Remove or move this country’s events before deleting it.');
  }
  await db.execute(sql`delete from countries where id = ${id}`);
}

export async function createCity(input: AdminCityInput) {
  const slug = slugify(input.name);
  try {
    const [row] = await db
      .insert(cities)
      .values({
        countryId: input.countryId,
        name: input.name,
        slug,
        timezone: input.timezone,
        latitude: input.latitude,
        longitude: input.longitude,
        heroImageUrl: coverUrl('city', slug),
        blurb: input.blurb,
      })
      .returning({ id: cities.id, slug: cities.slug });
    return row!;
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === '23505') {
      throw conflict('That country already has a city with this name.');
    }
    throw error;
  }
}

export async function deleteCity(id: string) {
  const [counts] = await db.execute<{ events: number }>(sql`
    select count(*)::int as events from events where city_id = ${id}
  `);
  if (Number(counts?.events ?? 0) > 0) {
    throw conflict('Remove this city’s events before deleting it.');
  }
  await db.execute(sql`delete from cities where id = ${id}`);
}

export async function createCategory(input: AdminCategoryInput) {
  const slug = slugify(input.name);
  try {
    const [row] = await db
      .insert(categories)
      .values({
        name: input.name,
        slug,
        icon: input.icon,
        description: input.description,
        sortOrder: input.sortOrder,
      })
      .returning({ id: categories.id, slug: categories.slug });
    return row!;
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === '23505') {
      throw conflict('A category with that name already exists.');
    }
    throw error;
  }
}

export async function updateCategory(id: string, input: AdminCategoryInput) {
  await db
    .update(categories)
    .set({
      name: input.name,
      icon: input.icon,
      description: input.description,
      sortOrder: input.sortOrder,
    })
    .where(sql`${categories.id} = ${id}`);
  return { id };
}

export async function deleteCategory(id: string) {
  const [counts] = await db.execute<{ events: number }>(sql`
    select count(*)::int as events from events where category_id = ${id}
  `);
  if (Number(counts?.events ?? 0) > 0) {
    throw conflict('Move this category’s events elsewhere before deleting it.');
  }
  await db.execute(sql`delete from categories where id = ${id}`);
}

export async function createVenue(input: AdminVenueInput) {
  const [row] = await db
    .insert(venues)
    .values({
      cityId: input.cityId,
      name: input.name,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
    })
    .returning({ id: venues.id });
  return row!;
}

export async function listVenues(cityId?: string) {
  const rows = await db.execute<{
    id: string; name: string; address: string; city_id: string; city_name: string;
  }>(sql`
    select v.id, v.name, v.address, v.city_id, ci.name as city_name
    from venues v join cities ci on ci.id = v.city_id
    ${cityId ? sql`where v.city_id = ${cityId}` : sql``}
    order by ci.name asc, v.name asc
  `);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address,
    cityId: r.city_id,
    cityName: r.city_name,
  }));
}

/* -------------------------------------------------------------------------- */
/* Users & bookings                                                            */
/* -------------------------------------------------------------------------- */

export async function listUsers(q?: string) {
  const rows = await db.execute<{
    id: string; email: string; full_name: string; phone: string | null; role: string;
    created_at: Date; booking_count: number;
  }>(sql`
    select u.id, u.email, u.full_name, u.phone, u.role, u.created_at,
           (select count(*)::int from bookings b where b.user_id = u.id) as booking_count
    from users u
    ${q ? sql`where u.full_name ilike ${`%${q}%`} or u.email ilike ${`%${q}%`}` : sql``}
    order by u.created_at desc
    limit 200
  `);
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    phone: r.phone,
    role: r.role,
    createdAt: new Date(r.created_at).toISOString(),
    bookingCount: Number(r.booking_count),
  }));
}

/**
 * Role changes are guarded so the last administrator cannot demote themselves
 * and lock everyone out of the dashboard.
 */
export async function setUserRole(id: string, role: 'USER' | 'ADMIN', actingUserId: string) {
  if (role === 'USER') {
    const [count] = await db.execute<{ admins: number }>(sql`
      select count(*)::int as admins from users where role = 'ADMIN'
    `);
    const [target] = await db.execute<{ role: string }>(sql`
      select role from users where id = ${id} limit 1
    `);
    if (!target) throw notFound('That account does not exist.');
    if (target.role === 'ADMIN' && Number(count?.admins ?? 0) <= 1) {
      throw conflict('This is the only administrator account. Promote someone else first.');
    }
    if (id === actingUserId) {
      throw badRequest('You cannot remove your own administrator access.');
    }
  }
  await db.update(users).set({ role, updatedAt: new Date() }).where(sql`${users.id} = ${id}`);
  return { id, role };
}

export async function listAllBookings(opts: { q?: string; status?: string } = {}) {
  const filters = [sql`true`];
  if (opts.q) {
    filters.push(
      sql`(b.reference ilike ${`%${opts.q}%`} or b.guest_name ilike ${`%${opts.q}%`}
           or b.guest_email ilike ${`%${opts.q}%`} or e.title ilike ${`%${opts.q}%`})`,
    );
  }
  if (opts.status) filters.push(sql`b.status = ${opts.status}`);
  const where = filters.reduce((a, f, i) => (i === 0 ? f : sql`${a} and ${f}`));

  const rows = await db.execute<{
    id: string; reference: string; guest_name: string; guest_email: string;
    quantity: number; total_minor: number; currency: string; status: string;
    created_at: Date; starts_at: Date; event_title: string; city_name: string;
  }>(sql`
    select b.id, b.reference, b.guest_name, b.guest_email, b.quantity, b.total_minor,
           b.currency, b.status, b.created_at, s.starts_at, e.title as event_title,
           ci.name as city_name
    from bookings b
      join event_sessions s on s.id = b.session_id
      join events e on e.id = s.event_id
      join cities ci on ci.id = e.city_id
    where ${where}
    order by b.created_at desc
    limit 200
  `);

  return rows.map((r) => ({
    id: r.id,
    reference: r.reference,
    guestName: r.guest_name,
    guestEmail: r.guest_email,
    quantity: Number(r.quantity),
    totalMinor: Number(r.total_minor),
    currency: r.currency,
    status: r.status,
    createdAt: new Date(r.created_at).toISOString(),
    startsAt: new Date(r.starts_at).toISOString(),
    eventTitle: r.event_title,
    cityName: r.city_name,
  }));
}
