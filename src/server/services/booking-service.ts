import 'server-only';
import { sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { bookings, eventSessions } from '@/server/db/schema';
import { createBookingReference } from '@/server/db/id';
import { badRequest, conflict, forbidden, notFound, soldOut } from '@/server/api/errors';
import type { CreateBookingInput } from '@/lib/validation';

export interface BookingView {
  id: string;
  reference: string;
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
  currency: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  notes: string | null;
  createdAt: string;
  session: { id: string; startsAt: string; endsAt: string };
  event: {
    id: string;
    slug: string;
    title: string;
    heroImageUrl: string;
    durationMinutes: number;
    category: string;
  };
  venue: { name: string; address: string };
  city: { name: string; slug: string; timezone: string };
  country: { name: string; slug: string };
}

const BOOKING_SELECT = sql`
  select
    b.id, b.user_id, b.reference, b.quantity, b.unit_price_minor, b.total_minor, b.currency,
    b.status, b.guest_name, b.guest_email, b.guest_phone, b.notes, b.created_at,
    s.id as session_id, s.starts_at, s.ends_at,
    e.id as event_id, e.slug as event_slug, e.title as event_title,
    e.hero_image_url, e.duration_minutes,
    cat.name as category_name,
    v.name as venue_name, v.address as venue_address,
    ci.name as city_name, ci.slug as city_slug, ci.timezone,
    co.name as country_name, co.slug as country_slug
  from bookings b
    join event_sessions s on s.id = b.session_id
    join events e         on e.id = s.event_id
    join categories cat   on cat.id = e.category_id
    join venues v         on v.id = e.venue_id
    join cities ci        on ci.id = e.city_id
    join countries co     on co.id = ci.country_id
`;

type RawBookingRow = {
  id: string; user_id: string; reference: string; quantity: number; unit_price_minor: number;
  total_minor: number; currency: string; status: BookingView['status'];
  guest_name: string; guest_email: string; guest_phone: string | null;
  notes: string | null; created_at: Date;
  session_id: string; starts_at: Date; ends_at: Date;
  event_id: string; event_slug: string; event_title: string;
  hero_image_url: string; duration_minutes: number; category_name: string;
  venue_name: string; venue_address: string;
  city_name: string; city_slug: string; timezone: string;
  country_name: string; country_slug: string;
}

function toBookingView(r: RawBookingRow): BookingView {
  return {
    id: r.id,
    reference: r.reference,
    quantity: Number(r.quantity),
    unitPriceMinor: Number(r.unit_price_minor),
    totalMinor: Number(r.total_minor),
    currency: r.currency,
    status: r.status,
    guestName: r.guest_name,
    guestEmail: r.guest_email,
    guestPhone: r.guest_phone,
    notes: r.notes,
    createdAt: new Date(r.created_at).toISOString(),
    session: {
      id: r.session_id,
      startsAt: new Date(r.starts_at).toISOString(),
      endsAt: new Date(r.ends_at).toISOString(),
    },
    event: {
      id: r.event_id,
      slug: r.event_slug,
      title: r.event_title,
      heroImageUrl: r.hero_image_url,
      durationMinutes: Number(r.duration_minutes),
      category: r.category_name,
    },
    venue: { name: r.venue_name, address: r.venue_address },
    city: { name: r.city_name, slug: r.city_slug, timezone: r.timezone },
    country: { name: r.country_name, slug: r.country_slug },
  };
}

/* -------------------------------------------------------------------------- */
/* Create                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Creates a booking, or fails without side effects.
 *
 * The interesting part is how seats are claimed. The naive implementation —
 * `SELECT seats_booked` then `UPDATE`, having checked the number in JavaScript —
 * has a time-of-check-to-time-of-use race: two requests can both read 8 seats
 * left, both decide 6 is fine, and the session ends up 4 seats oversold. The
 * database, not the application, has to arbitrate.
 *
 * So the seat claim is a single conditional UPDATE with the capacity test in its
 * WHERE clause. PostgreSQL takes a row-level lock for the duration of the
 * statement and re-evaluates the predicate against the committed row, so the
 * second concurrent request sees the first one's increment and matches zero
 * rows — which is reported to the caller as SOLD_OUT. The insert of the booking
 * row and the seat claim share one transaction, so neither can exist alone.
 */
export async function createBooking(
  userId: string,
  input: CreateBookingInput,
): Promise<BookingView> {
  return db.transaction(async (tx) => {
    // Read the session for its price and start time. This read is only used for
    // pricing and validity — the capacity decision is made by the UPDATE below.
    const sessionRows = await tx.execute<{
      id: string;
      starts_at: Date;
      capacity: number;
      seats_booked: number;
      price_minor: number;
      currency: string;
      min_age: number;
      status: string;
    }>(sql`
      select s.id, s.starts_at, s.capacity, s.seats_booked,
             coalesce(s.price_override_minor, e.base_price_minor) as price_minor,
             e.currency, e.min_age, e.status
      from event_sessions s
        join events e on e.id = s.event_id
      where s.id = ${input.sessionId}
      limit 1
    `);

    const session = sessionRows[0];
    if (!session) throw notFound('That date is no longer available.');
    if (session.status !== 'PUBLISHED') {
      throw conflict('This event is not currently open for booking.');
    }
    if (new Date(session.starts_at).getTime() <= Date.now()) {
      throw conflict('That session has already started.');
    }

    const seatsLeft = Number(session.capacity) - Number(session.seats_booked);
    if (seatsLeft < input.quantity) {
      throw soldOut(
        seatsLeft <= 0
          ? 'This date has sold out.'
          : `Only ${seatsLeft} ${seatsLeft === 1 ? 'ticket is' : 'tickets are'} left for this date.`,
        { seatsLeft },
      );
    }

    // The atomic claim. Matching zero rows means someone else got there first.
    const claimed = await tx.execute<{ id: string }>(sql`
      update event_sessions
      set seats_booked = seats_booked + ${input.quantity}
      where id = ${input.sessionId}
        and seats_booked + ${input.quantity} <= capacity
      returning id
    `);

    if (claimed.length === 0) {
      throw soldOut('Those tickets were taken while you were checking out. Try another date.');
    }

    const unitPrice = Number(session.price_minor);
    const [row] = await tx
      .insert(bookings)
      .values({
        reference: createBookingReference(),
        userId,
        sessionId: input.sessionId,
        quantity: input.quantity,
        unitPriceMinor: unitPrice,
        totalMinor: unitPrice * input.quantity,
        currency: session.currency,
        status: 'CONFIRMED',
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone ? input.guestPhone : null,
        notes: input.notes ? input.notes : null,
      })
      .returning({ id: bookings.id });

    const created = await tx.execute<RawBookingRow>(sql`${BOOKING_SELECT} where b.id = ${row!.id}`);
    return toBookingView(created[0]!);
  });
}

/* -------------------------------------------------------------------------- */
/* Read                                                                        */
/* -------------------------------------------------------------------------- */

export async function listBookingsForUser(userId: string): Promise<BookingView[]> {
  const rows = await db.execute<RawBookingRow>(sql`
    ${BOOKING_SELECT} where b.user_id = ${userId} order by s.starts_at desc
  `);
  return rows.map(toBookingView);
}

export async function getBookingByReference(
  reference: string,
  requesterId: string,
  isAdmin: boolean,
): Promise<BookingView> {
  const rows = await db.execute<RawBookingRow>(sql`
    ${BOOKING_SELECT} where b.reference = ${reference} limit 1
  `);
  const row = rows[0];
  if (!row) throw notFound('We could not find a booking with that reference.');

  if (!isAdmin && row.user_id !== requesterId) {
    // Deliberately the same message as "not found": confirming that a reference
    // exists but belongs to somebody else is an information leak.
    throw notFound('We could not find a booking with that reference.');
  }
  return toBookingView(row);
}

/* -------------------------------------------------------------------------- */
/* Cancel                                                                      */
/* -------------------------------------------------------------------------- */

/** Cancellation window: seats are returned to inventory up to 24 h before. */
export const CANCELLATION_WINDOW_HOURS = 24;

export async function cancelBooking(
  bookingId: string,
  requesterId: string,
  isAdmin: boolean,
): Promise<BookingView> {
  return db.transaction(async (tx) => {
    const rows = await tx.execute<{
      id: string; user_id: string; quantity: number; status: BookingView['status'];
      session_id: string; starts_at: Date; reference: string;
    }>(sql`
      select b.id, b.user_id, b.quantity, b.status, b.session_id, s.starts_at, b.reference
      from bookings b join event_sessions s on s.id = b.session_id
      where b.id = ${bookingId}
      limit 1
    `);

    const booking = rows[0];
    if (!booking) throw notFound('That booking does not exist.');
    if (!isAdmin && booking.user_id !== requesterId) {
      throw forbidden('That booking belongs to another account.');
    }
    if (booking.status === 'CANCELLED') {
      throw badRequest('That booking has already been cancelled.');
    }

    const hoursUntil = (new Date(booking.starts_at).getTime() - Date.now()) / 3_600_000;
    if (!isAdmin && hoursUntil < CANCELLATION_WINDOW_HOURS) {
      throw conflict(
        `Bookings can only be cancelled more than ${CANCELLATION_WINDOW_HOURS} hours before the start time.`,
      );
    }

    await tx
      .update(bookings)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(sql`${bookings.id} = ${bookingId}`);

    // Return the seats to inventory, never letting the counter go below zero.
    await tx
      .update(eventSessions)
      .set({ seatsBooked: sql`greatest(0, ${eventSessions.seatsBooked} - ${booking.quantity})` })
      .where(sql`${eventSessions.id} = ${booking.session_id}`);

    const updated = await tx.execute<RawBookingRow>(sql`${BOOKING_SELECT} where b.id = ${bookingId}`);
    return toBookingView(updated[0]!);
  });
}
