import { beforeEach, describe, expect, it } from 'vitest';
import {
  cancelBooking,
  createBooking,
  getBookingByReference,
  listBookingsForUser,
} from '@/server/services/booking-service';
import type { ApiError } from '@/server/api/errors';
import { createUser, createWorld, resetDatabase, seatsBookedFor } from '../helpers/fixtures';

const guest = {
  guestName: 'Sara Al-Harbi',
  guestEmail: 'sara@example.com',
  guestPhone: '',
  notes: '',
};

describe('creating a booking', () => {
  beforeEach(resetDatabase);

  it('creates a confirmed booking and claims the seats', async () => {
    const user = await createUser();
    const world = await createWorld({ capacity: 10, priceMajor: 18, currency: 'KWD' });

    const booking = await createBooking(user.id, { ...guest, sessionId: world.sessionId, quantity: 3 });

    expect(booking.status).toBe('CONFIRMED');
    expect(booking.quantity).toBe(3);
    expect(booking.reference).toMatch(/^EVT-/);
    expect(await seatsBookedFor(world.sessionId)).toBe(3);
  });

  it('computes the total in minor units without floating-point error', async () => {
    const user = await createUser();
    // 12.345 KWD → 12345 fils. × 7 = 86 415 fils, exactly.
    const world = await createWorld({ capacity: 20, priceMajor: 12.345, currency: 'KWD' });

    const booking = await createBooking(user.id, { ...guest, sessionId: world.sessionId, quantity: 7 });

    expect(booking.unitPriceMinor).toBe(12_345);
    expect(booking.totalMinor).toBe(86_415);
    expect(booking.currency).toBe('KWD');
  });

  it('refuses to book more seats than remain', async () => {
    const user = await createUser();
    const world = await createWorld({ capacity: 10, seatsBooked: 8 });

    await expect(
      createBooking(user.id, { ...guest, sessionId: world.sessionId, quantity: 5 }),
    ).rejects.toMatchObject({ code: 'SOLD_OUT' });

    // Nothing was claimed by the failed attempt.
    expect(await seatsBookedFor(world.sessionId)).toBe(8);
  });

  it('reports how many seats are actually left', async () => {
    const user = await createUser();
    const world = await createWorld({ capacity: 10, seatsBooked: 8 });

    const error = (await createBooking(user.id, {
      ...guest,
      sessionId: world.sessionId,
      quantity: 5,
    }).catch((e) => e)) as ApiError;

    expect(error.message).toContain('2');
    expect(error.details).toMatchObject({ seatsLeft: 2 });
  });

  it('allows the booking that exactly fills the session', async () => {
    const user = await createUser();
    const world = await createWorld({ capacity: 10, seatsBooked: 8 });

    await createBooking(user.id, { ...guest, sessionId: world.sessionId, quantity: 2 });
    expect(await seatsBookedFor(world.sessionId)).toBe(10);
  });

  it('refuses a session that has already started', async () => {
    const user = await createUser();
    const world = await createWorld({ startsInHours: -2 });

    await expect(
      createBooking(user.id, { ...guest, sessionId: world.sessionId, quantity: 1 }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('refuses an event that is not published', async () => {
    const user = await createUser();
    const world = await createWorld({ status: 'DRAFT' });

    await expect(
      createBooking(user.id, { ...guest, sessionId: world.sessionId, quantity: 1 }),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('reports a non-existent session as not found', async () => {
    const user = await createUser();
    await expect(
      createBooking(user.id, { ...guest, sessionId: 'does-not-exist', quantity: 1 }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('concurrency', () => {
  beforeEach(resetDatabase);

  it('never oversells a session under simultaneous demand', async () => {
    // The regression this guards: read seats_booked, decide in JavaScript, then
    // UPDATE. Ten parallel requests would all read 5 and all decide 1 is fine.
    const world = await createWorld({ capacity: 5 });
    const users = await Promise.all(Array.from({ length: 10 }, () => createUser()));

    const results = await Promise.allSettled(
      users.map((user) =>
        createBooking(user.id, { ...guest, sessionId: world.sessionId, quantity: 1 }),
      ),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    expect(succeeded).toBe(5);
    expect(failed).toBe(5);
    expect(await seatsBookedFor(world.sessionId)).toBe(5);
  });

  it('never oversells with multi-seat orders either', async () => {
    const world = await createWorld({ capacity: 7 });
    const users = await Promise.all(Array.from({ length: 6 }, () => createUser()));

    await Promise.allSettled(
      users.map((user) =>
        createBooking(user.id, { ...guest, sessionId: world.sessionId, quantity: 3 }),
      ),
    );

    const seats = await seatsBookedFor(world.sessionId);
    expect(seats).toBeLessThanOrEqual(7);
    expect(seats % 3).toBe(0);
  });
});

describe('reading a booking', () => {
  beforeEach(resetDatabase);

  it('returns the booking to its owner', async () => {
    const user = await createUser();
    const world = await createWorld();
    const created = await createBooking(user.id, {
      ...guest,
      sessionId: world.sessionId,
      quantity: 1,
    });

    const found = await getBookingByReference(created.reference, user.id, false);
    expect(found.id).toBe(created.id);
  });

  it('hides another account’s booking behind a not-found', async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const world = await createWorld();
    const created = await createBooking(owner.id, {
      ...guest,
      sessionId: world.sessionId,
      quantity: 1,
    });

    // Deliberately NOT_FOUND rather than FORBIDDEN: confirming the reference
    // exists would leak that a booking with that code was made.
    await expect(
      getBookingByReference(created.reference, stranger.id, false),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('lets an administrator read any booking', async () => {
    const owner = await createUser();
    const admin = await createUser({ role: 'ADMIN' });
    const world = await createWorld();
    const created = await createBooking(owner.id, {
      ...guest,
      sessionId: world.sessionId,
      quantity: 1,
    });

    await expect(
      getBookingByReference(created.reference, admin.id, true),
    ).resolves.toMatchObject({ id: created.id });
  });

  it('lists a user’s bookings and nobody else’s', async () => {
    const a = await createUser();
    const b = await createUser();
    const world = await createWorld({ capacity: 20 });

    await createBooking(a.id, { ...guest, sessionId: world.sessionId, quantity: 1 });
    await createBooking(b.id, { ...guest, sessionId: world.sessionId, quantity: 2 });

    const forA = await listBookingsForUser(a.id);
    expect(forA).toHaveLength(1);
    expect(forA[0]!.quantity).toBe(1);
  });
});

describe('cancellation', () => {
  beforeEach(resetDatabase);

  it('returns the seats to inventory', async () => {
    const user = await createUser();
    const world = await createWorld({ capacity: 10, startsInHours: 72 });
    const booking = await createBooking(user.id, {
      ...guest,
      sessionId: world.sessionId,
      quantity: 4,
    });

    expect(await seatsBookedFor(world.sessionId)).toBe(4);

    const cancelled = await cancelBooking(booking.id, user.id, false);
    expect(cancelled.status).toBe('CANCELLED');
    expect(await seatsBookedFor(world.sessionId)).toBe(0);
  });

  it('refuses inside the 24-hour window', async () => {
    const user = await createUser();
    const world = await createWorld({ startsInHours: 6 });
    const booking = await createBooking(user.id, {
      ...guest,
      sessionId: world.sessionId,
      quantity: 1,
    });

    await expect(cancelBooking(booking.id, user.id, false)).rejects.toMatchObject({
      code: 'CONFLICT',
    });
    expect(await seatsBookedFor(world.sessionId)).toBe(1);
  });

  it('lets an administrator override the window', async () => {
    const user = await createUser();
    const admin = await createUser({ role: 'ADMIN' });
    const world = await createWorld({ startsInHours: 6 });
    const booking = await createBooking(user.id, {
      ...guest,
      sessionId: world.sessionId,
      quantity: 1,
    });

    await expect(cancelBooking(booking.id, admin.id, true)).resolves.toMatchObject({
      status: 'CANCELLED',
    });
  });

  it('refuses to cancel somebody else’s booking', async () => {
    const owner = await createUser();
    const stranger = await createUser();
    const world = await createWorld();
    const booking = await createBooking(owner.id, {
      ...guest,
      sessionId: world.sessionId,
      quantity: 1,
    });

    await expect(cancelBooking(booking.id, stranger.id, false)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('refuses to cancel twice, so seats cannot be returned twice', async () => {
    const user = await createUser();
    const world = await createWorld({ capacity: 10 });
    const booking = await createBooking(user.id, {
      ...guest,
      sessionId: world.sessionId,
      quantity: 3,
    });

    await cancelBooking(booking.id, user.id, false);
    await expect(cancelBooking(booking.id, user.id, false)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
    expect(await seatsBookedFor(world.sessionId)).toBe(0);
  });

  it('frees the seat for somebody else to take', async () => {
    const first = await createUser();
    const second = await createUser();
    const world = await createWorld({ capacity: 1 });

    const booking = await createBooking(first.id, {
      ...guest,
      sessionId: world.sessionId,
      quantity: 1,
    });

    await expect(
      createBooking(second.id, { ...guest, sessionId: world.sessionId, quantity: 1 }),
    ).rejects.toMatchObject({ code: 'SOLD_OUT' });

    await cancelBooking(booking.id, first.id, false);

    await expect(
      createBooking(second.id, { ...guest, sessionId: world.sessionId, quantity: 1 }),
    ).resolves.toMatchObject({ status: 'CONFIRMED' });
  });
});
