import 'server-only';
import { sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { favorites } from '@/server/db/schema';
import { notFound } from '@/server/api/errors';
import type { EventCard } from '@/server/services/event-service';

/**
 * Toggles a favourite and returns the resulting state.
 *
 * `on conflict do nothing` plus a delete makes this idempotent per direction, so
 * a double-tapped heart button cannot produce duplicate rows — the unique index
 * on (user_id, event_id) backs it up at the storage layer.
 */
export async function toggleFavorite(
  userId: string,
  eventId: string,
): Promise<{ favorited: boolean }> {
  const exists = await db.execute<{ id: string }>(sql`
    select id from events where id = ${eventId} limit 1
  `);
  if (exists.length === 0) throw notFound('That event does not exist.');

  const removed = await db.execute<{ id: string }>(sql`
    delete from favorites where user_id = ${userId} and event_id = ${eventId} returning id
  `);
  if (removed.length > 0) return { favorited: false };

  await db
    .insert(favorites)
    .values({ userId, eventId })
    .onConflictDoNothing({ target: [favorites.userId, favorites.eventId] });

  return { favorited: true };
}

/** The set of event IDs this user has favourited, for painting card hearts. */
export async function getFavoriteIds(userId: string): Promise<Set<string>> {
  const rows = await db.execute<{ event_id: string }>(sql`
    select event_id from favorites where user_id = ${userId}
  `);
  return new Set(rows.map((r) => r.event_id));
}

export async function listFavorites(userId: string): Promise<EventCard[]> {
  const rows = await db.execute<{
    id: string; slug: string; title: string; summary: string; hero_image_url: string;
    base_price_minor: number; currency: string; duration_minutes: number; min_age: number;
    tags: string[]; is_featured: boolean;
    category_name: string; category_slug: string; category_icon: string;
    city_name: string; city_slug: string;
    country_name: string; country_slug: string; flag_emoji: string;
    venue_name: string;
    next_session_id: string | null; next_starts_at: Date | null;
    next_price_minor: number | null; next_seats_left: number | null;
    avg_rating: string | null; review_count: number;
  }>(sql`
    select
      e.id, e.slug, e.title, e.summary, e.hero_image_url, e.base_price_minor, e.currency,
      e.duration_minutes, e.min_age, e.tags, e.is_featured,
      cat.name as category_name, cat.slug as category_slug, cat.icon as category_icon,
      ci.name as city_name, ci.slug as city_slug,
      co.name as country_name, co.slug as country_slug, co.flag_emoji,
      v.name as venue_name,
      ns.id as next_session_id, ns.starts_at as next_starts_at,
      ns.price_minor as next_price_minor, ns.seats_left as next_seats_left,
      rv.avg_rating, coalesce(rv.review_count, 0) as review_count
    from favorites f
      join events e       on e.id = f.event_id
      join categories cat on cat.id = e.category_id
      join cities ci      on ci.id = e.city_id
      join countries co   on co.id = ci.country_id
      join venues v       on v.id = e.venue_id
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
    where f.user_id = ${userId}
    order by f.created_at desc
  `);

  return rows.map((row) => ({
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
  }));
}
