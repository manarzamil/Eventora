import { beforeEach, describe, expect, it } from 'vitest';
import {
  createEvent,
  createEventSession,
  deleteCategory,
  deleteEvent,
  deleteEventSession,
  getAdminEvent,
  getAdminStats,
  listAdminEvents,
  setUserRole,
  updateEvent,
} from '@/server/services/admin-service';
import { createBooking } from '@/server/services/booking-service';
import { getEventBySlug } from '@/server/services/event-service';
import { createUser, createWorld, resetDatabase } from '../helpers/fixtures';

const guest = { guestName: 'Sara', guestEmail: 'sara@example.com', guestPhone: '', notes: '' };

function eventInput(world: Awaited<ReturnType<typeof createWorld>>, overrides = {}) {
  return {
    title: 'Newly Created Experience',
    summary: 'A summary that is comfortably longer than the twenty-character minimum.',
    description:
      'A description that is comfortably longer than the forty-character minimum imposed by the schema.',
    categoryId: world.categoryId,
    cityId: world.cityId,
    venueId: world.venueId,
    price: 25,
    durationMinutes: 120,
    minAge: 0,
    tags: ['test'],
    isFeatured: false,
    status: 'PUBLISHED' as const,
    ...overrides,
  };
}

describe('event administration', () => {
  beforeEach(resetDatabase);

  it('creates an event with a slug derived from its title', async () => {
    const world = await createWorld();
    const created = await createEvent(eventInput(world));
    expect(created.slug).toBe('newly-created-experience');
  });

  it('disambiguates a duplicate slug rather than failing', async () => {
    const world = await createWorld();
    const first = await createEvent(eventInput(world));
    const second = await createEvent(eventInput(world));

    expect(first.slug).toBe('newly-created-experience');
    expect(second.slug).toBe('newly-created-experience-2');
  });

  it('stores the price in the minor units of the city’s currency', async () => {
    const world = await createWorld({ currency: 'KWD' });
    const created = await createEvent(eventInput(world, { price: 12.5 }));
    const event = await getAdminEvent(created.id);

    // 12.5 KWD is 12 500 fils; reading it back must give 12.5, not 12.5/100.
    expect(event.price).toBeCloseTo(12.5, 5);
    expect(event.currency).toBe('KWD');
  });

  it('refuses a venue that belongs to another city', async () => {
    const a = await createWorld();
    const b = await createWorld();

    await expect(
      createEvent(eventInput(a, { venueId: b.venueId })),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('keeps the slug stable when the title has not changed', async () => {
    const world = await createWorld();
    const created = await createEvent(eventInput(world));
    const updated = await updateEvent(created.id, eventInput(world, { price: 30 }));
    expect(updated.slug).toBe(created.slug);
  });

  it('re-slugs when the title changes', async () => {
    const world = await createWorld();
    const created = await createEvent(eventInput(world));
    const updated = await updateEvent(created.id, eventInput(world, { title: 'A Different Name' }));
    expect(updated.slug).toBe('a-different-name');
  });

  it('takes an event off the site when it is moved to DRAFT', async () => {
    const world = await createWorld();
    const created = await createEvent(eventInput(world));
    await createEventSession(created.id, {
      startsAt: new Date(Date.now() + 86_400_000).toISOString(),
      capacity: 10,
    });

    await expect(getEventBySlug(created.slug)).resolves.toBeTruthy();

    await updateEvent(created.id, eventInput(world, { status: 'DRAFT' }));
    await expect(getEventBySlug(created.slug)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('deletes an event that has no bookings', async () => {
    const world = await createWorld();
    const created = await createEvent(eventInput(world));

    const result = await deleteEvent(created.id);
    expect(result).toEqual({ deleted: true, archived: false });
    await expect(getAdminEvent(created.id)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('archives rather than deletes an event with bookings, preserving history', async () => {
    const user = await createUser();
    const world = await createWorld({ capacity: 10 });
    await createBooking(user.id, { ...guest, sessionId: world.sessionId, quantity: 1 });

    const result = await deleteEvent(world.eventId);
    expect(result).toEqual({ deleted: false, archived: true });

    const event = await getAdminEvent(world.eventId);
    expect(event.status).toBe('ARCHIVED');
    expect(event.isFeatured).toBe(false);
  });

  it('lists and filters events for the dashboard', async () => {
    const world = await createWorld({ title: 'Sunset Dhow Cruise' });
    await createEvent(eventInput(world, { title: 'Desert Stargazing' }));

    const all = await listAdminEvents({});
    expect(all.total).toBe(2);

    const searched = await listAdminEvents({ q: 'dhow' });
    expect(searched.items.map((e) => e.title)).toEqual(['Sunset Dhow Cruise']);
  });
});

describe('session administration', () => {
  beforeEach(resetDatabase);

  it('derives the end time from the event duration', async () => {
    const world = await createWorld();
    const startsAt = new Date(Date.now() + 86_400_000);
    const created = await createEventSession(world.eventId, {
      startsAt: startsAt.toISOString(),
      capacity: 20,
    });

    const event = await getEventBySlug(world.eventSlug);
    const session = event.sessions.find((s) => s.id === created.id)!;
    const durationMs =
      new Date(session.endsAt).getTime() - new Date(session.startsAt).getTime();
    expect(durationMs).toBe(120 * 60_000);
  });

  it('removes a session with no bookings', async () => {
    const world = await createWorld();
    await expect(deleteEventSession(world.sessionId)).resolves.toBeUndefined();
  });

  it('refuses to remove a session with active bookings', async () => {
    const user = await createUser();
    const world = await createWorld({ capacity: 5 });
    await createBooking(user.id, { ...guest, sessionId: world.sessionId, quantity: 1 });

    await expect(deleteEventSession(world.sessionId)).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});

describe('taxonomy guards', () => {
  beforeEach(resetDatabase);

  it('refuses to delete a category that still has events', async () => {
    const world = await createWorld();
    await expect(deleteCategory(world.categoryId)).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});

describe('role management', () => {
  beforeEach(resetDatabase);

  it('promotes a user to administrator', async () => {
    const admin = await createUser({ role: 'ADMIN' });
    const user = await createUser();

    const result = await setUserRole(user.id, 'ADMIN', admin.id);
    expect(result.role).toBe('ADMIN');
  });

  it('refuses to demote the last remaining administrator', async () => {
    const onlyAdmin = await createUser({ role: 'ADMIN' });
    const other = await createUser({ role: 'ADMIN' });

    // Demote one — fine, one administrator remains.
    await setUserRole(other.id, 'USER', onlyAdmin.id);

    // Demoting the last one would lock everybody out of the dashboard.
    const someoneElse = await createUser();
    await expect(setUserRole(onlyAdmin.id, 'USER', someoneElse.id)).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });

  it('refuses to let an administrator remove their own access', async () => {
    await createUser({ role: 'ADMIN' });
    const self = await createUser({ role: 'ADMIN' });

    await expect(setUserRole(self.id, 'USER', self.id)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
  });
});

describe('dashboard statistics', () => {
  beforeEach(resetDatabase);

  it('counts events, users and bookings', async () => {
    const user = await createUser();
    const world = await createWorld({ capacity: 10, priceMajor: 18, currency: 'KWD' });
    await createBooking(user.id, { ...guest, sessionId: world.sessionId, quantity: 2 });

    const stats = await getAdminStats();
    expect(stats.totals.publishedEvents).toBe(1);
    expect(stats.totals.bookings).toBe(1);
    expect(stats.totals.users).toBe(1);
    expect(stats.revenueByCurrency).toEqual([
      { currency: 'KWD', totalMinor: 36_000, bookings: 1 },
    ]);
  });

  it('returns a row for every one of the last fourteen days', async () => {
    const stats = await getAdminStats();
    expect(stats.bookingsLast14Days).toHaveLength(14);
  });

  it('excludes cancelled bookings from the revenue total', async () => {
    const user = await createUser();
    const world = await createWorld({ capacity: 10, priceMajor: 10, currency: 'GBP' });
    const booking = await createBooking(user.id, {
      ...guest,
      sessionId: world.sessionId,
      quantity: 1,
    });

    const { cancelBooking } = await import('@/server/services/booking-service');
    await cancelBooking(booking.id, user.id, true);

    const stats = await getAdminStats();
    expect(stats.revenueByCurrency).toEqual([]);
  });
});
