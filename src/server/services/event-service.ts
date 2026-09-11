import 'server-only';
import { sql, type SQL } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { notFound } from '@/server/api/errors';
import type { EventQuery } from '@/lib/validation';
import { toMinorUnits } from '@/lib/money';

/* -------------------------------------------------------------------------- */
/* Shapes returned to the UI                                                   */
/* -------------------------------------------------------------------------- */

export interface EventCard {
  id: string;
  slug: string;
  title: string;
  summary: string;
  heroImageUrl: string;
  basePriceMinor: number;
  currency: string;
  durationMinutes: number;
  minAge: number;
  tags: string[];
  isFeatured: boolean;
  category: { name: string; slug: string; icon: string };
  city: { name: string; slug: string };
  country: { name: string; slug: string; flagEmoji: string };
  venueName: string;
  nextSession: {
    id: string;
    startsAt: string;
    priceMinor: number;
    seatsLeft: number;
  } | null;
  rating: number | null;
  reviewCount: number;
}

export interface EventListResult {
  items: EventCard[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

/* -------------------------------------------------------------------------- */
/* Filter construction                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Every user-supplied value below is interpolated through Drizzle's `sql`
 * template, which emits a bound parameter ($1, $2, …) rather than string
 * concatenation. There is no path here by which a query string can become
 * executable SQL.
 */
function buildConditions(query: EventQuery, currency: string | null): SQL[] {
  const conditions: SQL[] = [sql`e.status = 'PUBLISHED'`];

  if (query.city) conditions.push(sql`ci.slug = ${query.city}`);
  if (query.country) conditions.push(sql`co.slug = ${query.country}`);

  if (query.categories && query.categories.length > 0) {
    const slugs = query.categories.map((slug) => sql`${slug}`);
    conditions.push(sql`cat.slug in (${sql.join(slugs, sql`, `)})`);
  }

  if (query.q) {
    const term = query.q;
    const like = `%${term}%`;
    conditions.push(sql`(
      to_tsvector('english', e.title || ' ' || e.summary) @@ plainto_tsquery('english', ${term})
      or e.title ilike ${like}
      or e.summary ilike ${like}
      or ci.name ilike ${like}
      or v.name ilike ${like}
      or exists (select 1 from unnest(e.tags) tag where tag ilike ${like})
    )`);
  }

  if (query.freeOnly) {
    conditions.push(sql`e.base_price_minor = 0`);
  }

  // Price bounds arrive in MAJOR units and are only meaningful once a currency
  // is pinned down by the selected city or country.
  if (currency) {
    if (query.minPrice !== undefined) {
      conditions.push(sql`e.base_price_minor >= ${toMinorUnits(query.minPrice, currency)}`);
    }
    if (query.maxPrice !== undefined) {
      conditions.push(sql`e.base_price_minor <= ${toMinorUnits(query.maxPrice, currency)}`);
    }
  }

  // An event only appears if it still has an upcoming session inside the window.
  const windowStart = query.dateFrom ? sql`greatest(now(), ${query.dateFrom}::timestamptz)` : sql`now()`;
  const windowEnd = query.dateTo ? sql`(${query.dateTo}::timestamptz + interval '1 day')` : null;

  conditions.push(sql`exists (
    select 1 from event_sessions s
    where s.event_id = e.id
      and s.starts_at >= ${windowStart}
      ${windowEnd ? sql`and s.starts_at < ${windowEnd}` : sql``}
      and s.seats_booked < s.capacity
  )`);

  return conditions;
}

function orderBy(sort: EventQuery['sort']): SQL {
  switch (sort) {
    case 'soonest':
      return sql`ns.starts_at asc nulls last`;
    case 'price-asc':
      return sql`e.base_price_minor asc, ns.starts_at asc`;
    case 'price-desc':
      return sql`e.base_price_minor desc, ns.starts_at asc`;
    case 'rating':
      return sql`rv.avg_rating desc nulls last, rv.review_count desc, ns.starts_at asc`;
    case 'recommended':
    default:
      // Featured first, then well-reviewed, then whatever is happening soonest.
      return sql`e.is_featured desc, rv.avg_rating desc nulls last, ns.starts_at asc nulls last`;
  }
}

function joinAll(parts: SQL[], separator: SQL): SQL {
  return parts.reduce((acc, part, i) => (i === 0 ? part : sql`${acc}${separator}${part}`));
}

/* -------------------------------------------------------------------------- */
/* Queries                                                                     */
/* -------------------------------------------------------------------------- */

/** Resolves the currency in play, so price filters can be converted correctly. */
async function currencyForScope(query: EventQuery): Promise<string | null> {
  if (!query.city && !query.country) return null;
  const rows = await db.execute<{ currency: string }>(sql`
    select co.currency
    from countries co
    left join cities ci on ci.country_id = co.id
    where ${query.city ? sql`ci.slug = ${query.city}` : sql`co.slug = ${query.country}`}
    limit 1
  `);
  return rows[0]?.currency ?? null;
}

type RawEventRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  hero_image_url: string;
  base_price_minor: number;
  currency: string;
  duration_minutes: number;
  min_age: number;
  tags: string[];
  is_featured: boolean;
  category_name: string;
  category_slug: string;
  category_icon: string;
  city_name: string;
  city_slug: string;
  country_name: string;
  country_slug: string;
  flag_emoji: string;
  venue_name: string;
  next_session_id: string | null;
  next_starts_at: Date | null;
  next_price_minor: number | null;
  next_seats_left: number | null;
  avg_rating: string | null;
  review_count: number;
}

function toCard(row: RawEventRow): EventCard {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    heroImageUrl: row.hero_image_url,
    basePriceMinor: Number(row.base_price_minor),
    currency: row.currency,
    durationMinutes: Number(row.duration_minutes),
    minAge: Number(row.min_age),
    tags: row.tags ?? [],
    isFeatured: row.is_featured,
    category: { name: row.category_name, slug: row.category_slug, icon: row.category_icon },
    city: { name: row.city_name, slug: row.city_slug },
    country: { name: row.country_name, slug: row.country_slug, flagEmoji: row.flag_emoji },
    venueName: row.venue_name,
    nextSession: row.next_session_id
      ? {
          id: row.next_session_id,
          startsAt: new Date(row.next_starts_at!).toISOString(),
          priceMinor: Number(row.next_price_minor),
          seatsLeft: Number(row.next_seats_left),
        }
      : null,
    rating: row.avg_rating === null ? null : Math.round(Number(row.avg_rating) * 10) / 10,
    reviewCount: Number(row.review_count),
  };
}

/**
 * The discovery query.
 *
 * Two LATERAL subqueries do the aggregate work: `ns` picks the single next
 * bookable session per event, and `rv` folds the review table down to an average
 * and a count. Doing it this way means one round trip for a page of results
 * instead of the N+1 that a naive per-card lookup would produce.
 */
export async function listEvents(query: EventQuery): Promise<EventListResult> {
  const currency = await currencyForScope(query);
  const conditions = buildConditions(query, currency);
  const where = joinAll(conditions, sql` and `);
  const offset = (query.page - 1) * query.perPage;

  const windowStart = query.dateFrom ? sql`greatest(now(), ${query.dateFrom}::timestamptz)` : sql`now()`;
  const windowEnd = query.dateTo ? sql`(${query.dateTo}::timestamptz + interval '1 day')` : null;

  const rows = await db.execute<RawEventRow>(sql`
    select
      e.id, e.slug, e.title, e.summary, e.hero_image_url, e.base_price_minor,
      e.currency, e.duration_minutes, e.min_age, e.tags, e.is_featured,
      cat.name as category_name, cat.slug as category_slug, cat.icon as category_icon,
      ci.name  as city_name,      ci.slug  as city_slug,
      co.name  as country_name,   co.slug  as country_slug, co.flag_emoji,
      v.name   as venue_name,
      ns.id as next_session_id,
      ns.starts_at as next_starts_at,
      ns.price_minor as next_price_minor,
      ns.seats_left as next_seats_left,
      rv.avg_rating, coalesce(rv.review_count, 0) as review_count
    from events e
      join categories cat on cat.id = e.category_id
      join cities     ci  on ci.id  = e.city_id
      join countries  co  on co.id  = ci.country_id
      join venues     v   on v.id   = e.venue_id
      left join lateral (
        select s.id,
               s.starts_at,
               coalesce(s.price_override_minor, e.base_price_minor) as price_minor,
               s.capacity - s.seats_booked as seats_left
        from event_sessions s
        where s.event_id = e.id
          and s.starts_at >= ${windowStart}
          ${windowEnd ? sql`and s.starts_at < ${windowEnd}` : sql``}
          and s.seats_booked < s.capacity
        order by s.starts_at asc
        limit 1
      ) ns on true
      left join lateral (
        select avg(r.rating)::numeric(3,2) as avg_rating, count(*)::int as review_count
        from reviews r where r.event_id = e.id
      ) rv on true
    where ${where}
    order by ${orderBy(query.sort)}, e.id asc
    limit ${query.perPage} offset ${offset}
  `);

  const countRows = await db.execute<{ total: number }>(sql`
    select count(*)::int as total
    from events e
      join categories cat on cat.id = e.category_id
      join cities     ci  on ci.id  = e.city_id
      join countries  co  on co.id  = ci.country_id
      join venues     v   on v.id   = e.venue_id
    where ${where}
  `);

  const total = Number(countRows[0]?.total ?? 0);

  return {
    items: rows.map(toCard),
    total,
    page: query.page,
    perPage: query.perPage,
    pageCount: Math.max(1, Math.ceil(total / query.perPage)),
  };
}

/* -------------------------------------------------------------------------- */
/* Detail                                                                      */
/* -------------------------------------------------------------------------- */

export interface EventSessionView {
  id: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  seatsBooked: number;
  seatsLeft: number;
  priceMinor: number;
}

export interface EventDetail extends EventCard {
  description: string;
  galleryUrls: string[];
  venue: { name: string; address: string; latitude: number; longitude: number };
  timezone: string;
  sessions: EventSessionView[];
  reviews: { id: string; rating: number; comment: string; author: string; createdAt: string }[];
}

export async function getEventBySlug(slug: string): Promise<EventDetail> {
  const rows = await db.execute<RawEventRow & {
    description: string;
    gallery_urls: string[];
    venue_address: string;
    venue_lat: number;
    venue_lng: number;
    timezone: string;
  }>(sql`
    select
      e.id, e.slug, e.title, e.summary, e.description, e.hero_image_url, e.gallery_urls,
      e.base_price_minor, e.currency, e.duration_minutes, e.min_age, e.tags, e.is_featured,
      cat.name as category_name, cat.slug as category_slug, cat.icon as category_icon,
      ci.name  as city_name,     ci.slug  as city_slug, ci.timezone,
      co.name  as country_name,  co.slug  as country_slug, co.flag_emoji,
      v.name   as venue_name,    v.address as venue_address,
      v.latitude as venue_lat,   v.longitude as venue_lng,
      ns.id as next_session_id, ns.starts_at as next_starts_at,
      ns.price_minor as next_price_minor, ns.seats_left as next_seats_left,
      rv.avg_rating, coalesce(rv.review_count, 0) as review_count
    from events e
      join categories cat on cat.id = e.category_id
      join cities     ci  on ci.id  = e.city_id
      join countries  co  on co.id  = ci.country_id
      join venues     v   on v.id   = e.venue_id
      left join lateral (
        select s.id, s.starts_at,
               coalesce(s.price_override_minor, e.base_price_minor) as price_minor,
               s.capacity - s.seats_booked as seats_left
        from event_sessions s
        where s.event_id = e.id and s.starts_at >= now() and s.seats_booked < s.capacity
        order by s.starts_at asc limit 1
      ) ns on true
      left join lateral (
        select avg(r.rating)::numeric(3,2) as avg_rating, count(*)::int as review_count
        from reviews r where r.event_id = e.id
      ) rv on true
    where e.slug = ${slug} and e.status = 'PUBLISHED'
    limit 1
  `);

  const row = rows[0];
  if (!row) throw notFound('That event does not exist, or is no longer published.');

  const sessionRows = await db.execute<{
    id: string;
    starts_at: Date;
    ends_at: Date;
    capacity: number;
    seats_booked: number;
    price_minor: number;
  }>(sql`
    select s.id, s.starts_at, s.ends_at, s.capacity, s.seats_booked,
           coalesce(s.price_override_minor, ${row.base_price_minor}) as price_minor
    from event_sessions s
    where s.event_id = ${row.id} and s.starts_at >= now()
    order by s.starts_at asc
    limit 60
  `);

  const reviewRows = await db.execute<{
    id: string;
    rating: number;
    comment: string;
    author: string;
    created_at: Date;
  }>(sql`
    select r.id, r.rating, r.comment, u.full_name as author, r.created_at
    from reviews r join users u on u.id = r.user_id
    where r.event_id = ${row.id}
    order by r.created_at desc
    limit 12
  `);

  return {
    ...toCard(row),
    description: row.description,
    galleryUrls: row.gallery_urls ?? [],
    venue: {
      name: row.venue_name,
      address: row.venue_address,
      latitude: Number(row.venue_lat),
      longitude: Number(row.venue_lng),
    },
    timezone: row.timezone,
    sessions: sessionRows.map((s) => ({
      id: s.id,
      startsAt: new Date(s.starts_at).toISOString(),
      endsAt: new Date(s.ends_at).toISOString(),
      capacity: Number(s.capacity),
      seatsBooked: Number(s.seats_booked),
      seatsLeft: Number(s.capacity) - Number(s.seats_booked),
      priceMinor: Number(s.price_minor),
    })),
    reviews: reviewRows.map((r) => ({
      id: r.id,
      rating: Number(r.rating),
      comment: r.comment,
      author: r.author,
      createdAt: new Date(r.created_at).toISOString(),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Supporting lookups                                                          */
/* -------------------------------------------------------------------------- */

export interface CountrySummary {
  id: string;
  name: string;
  slug: string;
  code: string;
  currency: string;
  flagEmoji: string;
  heroImageUrl: string;
  cityCount: number;
  eventCount: number;
}

export async function listCountries(): Promise<CountrySummary[]> {
  const rows = await db.execute<{
    id: string; name: string; slug: string; code: string; currency: string;
    flag_emoji: string; hero_image_url: string; city_count: number; event_count: number;
  }>(sql`
    select co.id, co.name, co.slug, co.code, co.currency, co.flag_emoji, co.hero_image_url,
           count(distinct ci.id)::int as city_count,
           count(distinct e.id) filter (where e.status = 'PUBLISHED')::int as event_count
    from countries co
      left join cities ci on ci.country_id = co.id
      left join events e  on e.city_id = ci.id
    group by co.id
    order by co.name asc
  `);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    code: r.code,
    currency: r.currency,
    flagEmoji: r.flag_emoji,
    heroImageUrl: r.hero_image_url,
    cityCount: Number(r.city_count),
    eventCount: Number(r.event_count),
  }));
}

export interface CitySummary {
  id: string;
  name: string;
  slug: string;
  blurb: string;
  heroImageUrl: string;
  timezone: string;
  eventCount: number;
  country: { name: string; slug: string; flagEmoji: string; currency: string };
}

export async function listCities(countrySlug?: string): Promise<CitySummary[]> {
  const rows = await db.execute<{
    id: string; name: string; slug: string; blurb: string; hero_image_url: string;
    timezone: string; event_count: number; country_name: string; country_slug: string;
    flag_emoji: string; currency: string;
  }>(sql`
    select ci.id, ci.name, ci.slug, ci.blurb, ci.hero_image_url, ci.timezone,
           count(e.id) filter (where e.status = 'PUBLISHED')::int as event_count,
           co.name as country_name, co.slug as country_slug, co.flag_emoji, co.currency
    from cities ci
      join countries co on co.id = ci.country_id
      left join events e on e.city_id = ci.id
    ${countrySlug ? sql`where co.slug = ${countrySlug}` : sql``}
    group by ci.id, co.id
    order by event_count desc, ci.name asc
  `);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    blurb: r.blurb,
    heroImageUrl: r.hero_image_url,
    timezone: r.timezone,
    eventCount: Number(r.event_count),
    country: {
      name: r.country_name,
      slug: r.country_slug,
      flagEmoji: r.flag_emoji,
      currency: r.currency,
    },
  }));
}

export async function getCityBySlug(countrySlug: string, citySlug: string) {
  const cities = await listCities(countrySlug);
  const city = cities.find((c) => c.slug === citySlug);
  if (!city) throw notFound('We do not cover that city yet.');
  return city;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  eventCount: number;
}

/** Category list, optionally counted within one city so filters show real numbers. */
export async function listCategories(citySlug?: string): Promise<CategorySummary[]> {
  const rows = await db.execute<{
    id: string; name: string; slug: string; icon: string; description: string; event_count: number;
  }>(sql`
    select cat.id, cat.name, cat.slug, cat.icon, cat.description,
           count(e.id)::int as event_count
    from categories cat
      left join events e on e.category_id = cat.id and e.status = 'PUBLISHED'
      ${citySlug ? sql`and e.city_id = (select id from cities where slug = ${citySlug} limit 1)` : sql``}
    group by cat.id
    order by cat.sort_order asc, cat.name asc
  `);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    icon: r.icon,
    description: r.description,
    eventCount: Number(r.event_count),
  }));
}

/** Featured events for the landing page, spread across cities. */
export async function listFeaturedEvents(limit = 8): Promise<EventCard[]> {
  const result = await listEvents({
    sort: 'recommended',
    page: 1,
    perPage: limit,
  } as EventQuery);
  return result.items.filter((e) => e.isFeatured).slice(0, limit);
}

export async function getPlatformCounts() {
  const rows = await db.execute<{ events: number; cities: number; countries: number }>(sql`
    select
      (select count(*)::int from events where status = 'PUBLISHED') as events,
      (select count(*)::int from cities) as cities,
      (select count(*)::int from countries) as countries
  `);
  return {
    events: Number(rows[0]?.events ?? 0),
    cities: Number(rows[0]?.cities ?? 0),
    countries: Number(rows[0]?.countries ?? 0),
  };
}
