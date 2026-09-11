import { beforeEach, describe, expect, it } from 'vitest';
import { getEventBySlug, listEvents } from '@/server/services/event-service';
import { getFavoriteIds, listFavorites, toggleFavorite } from '@/server/services/favorite-service';
import { eventQuerySchema } from '@/lib/validation';
import { createUser, createWorld, resetDatabase } from '../helpers/fixtures';

function query(overrides: Record<string, unknown> = {}) {
  return eventQuerySchema.parse(overrides);
}

describe('event discovery', () => {
  beforeEach(resetDatabase);

  it('returns only published events', async () => {
    await createWorld({ title: 'Published Cruise', status: 'PUBLISHED' });
    await createWorld({ title: 'Draft Cruise', status: 'DRAFT' });
    await createWorld({ title: 'Archived Cruise', status: 'ARCHIVED' });

    const result = await listEvents(query());
    expect(result.items.map((e) => e.title)).toEqual(['Published Cruise']);
  });

  it('hides events whose every session is sold out', async () => {
    await createWorld({ title: 'Available', capacity: 10, seatsBooked: 4 });
    await createWorld({ title: 'Sold Out', capacity: 10, seatsBooked: 10 });

    const result = await listEvents(query());
    expect(result.items.map((e) => e.title)).toEqual(['Available']);
  });

  it('hides events whose only session is in the past', async () => {
    await createWorld({ title: 'Upcoming', startsInHours: 48 });
    await createWorld({ title: 'Finished', startsInHours: -48 });

    const result = await listEvents(query());
    expect(result.items.map((e) => e.title)).toEqual(['Upcoming']);
  });

  it('scopes results to a city', async () => {
    const kuwait = await createWorld({ title: 'Kuwait Cruise', citySlug: 'kuwait-city' });
    await createWorld({ title: 'Dubai Cruise', citySlug: 'dubai' });

    const result = await listEvents(query({ city: kuwait.citySlug }));
    expect(result.items.map((e) => e.title)).toEqual(['Kuwait Cruise']);
  });

  it('filters by category', async () => {
    const marine = await createWorld({ title: 'Reef Dive', categorySlug: 'marine' });
    await createWorld({ title: 'Museum Tour', categorySlug: 'cultural' });

    const result = await listEvents(query({ categories: marine.categorySlug }));
    expect(result.items.map((e) => e.title)).toEqual(['Reef Dive']);
  });

  it('searches titles, tags and venue names', async () => {
    await createWorld({ title: 'Sunset Dhow Cruise', tags: ['boat'] });
    await createWorld({ title: 'Desert Stargazing', tags: ['astronomy'] });

    expect((await listEvents(query({ q: 'dhow' }))).items).toHaveLength(1);
    expect((await listEvents(query({ q: 'astronomy' }))).items).toHaveLength(1);
    // Every fixture uses "Test Marina" as its venue.
    expect((await listEvents(query({ q: 'marina' }))).items).toHaveLength(2);
  });

  it('returns nothing rather than everything for an unmatched search', async () => {
    await createWorld({ title: 'Sunset Dhow Cruise' });
    const result = await listEvents(query({ q: 'zzzzzzz-no-such-thing' }));
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('treats a search term containing SQL punctuation as text', async () => {
    await createWorld({ title: 'Sunset Dhow Cruise' });
    // Parameter binding, not escaping — this is data, and matches nothing.
    const result = await listEvents(query({ q: "'; drop table events; --" }));
    expect(result.items).toHaveLength(0);

    // Prove the table still exists afterwards.
    expect((await listEvents(query())).total).toBe(1);
  });

  it('filters by price, converting major units with the right exponent', async () => {
    const cheap = await createWorld({ title: 'Cheap', priceMajor: 5, currency: 'KWD' });
    await createWorld({
      title: 'Pricey',
      priceMajor: 50,
      currency: 'KWD',
      citySlug: cheap.citySlug,
    });

    const all = await listEvents(query({ country: cheap.countrySlug }));
    expect(all.total).toBe(1); // separate countries per fixture

    const withinBudget = await listEvents(
      query({ country: cheap.countrySlug, maxPrice: 10 }),
    );
    expect(withinBudget.items.map((e) => e.title)).toEqual(['Cheap']);
  });

  it('filters to free events only', async () => {
    await createWorld({ title: 'Free Mosque Tour', priceMajor: 0 });
    await createWorld({ title: 'Paid Cruise', priceMajor: 18 });

    const result = await listEvents(query({ freeOnly: 'true' }));
    expect(result.items.map((e) => e.title)).toEqual(['Free Mosque Tour']);
  });

  it('sorts by price in both directions', async () => {
    await createWorld({ title: 'Mid', priceMajor: 20, currency: 'GBP' });
    await createWorld({ title: 'Low', priceMajor: 5, currency: 'GBP' });
    await createWorld({ title: 'High', priceMajor: 90, currency: 'GBP' });

    const asc = await listEvents(query({ sort: 'price-asc' }));
    expect(asc.items.map((e) => e.title)).toEqual(['Low', 'Mid', 'High']);

    const desc = await listEvents(query({ sort: 'price-desc' }));
    expect(desc.items.map((e) => e.title)).toEqual(['High', 'Mid', 'Low']);
  });

  it('sorts by which session happens soonest', async () => {
    await createWorld({ title: 'Later', startsInHours: 200 });
    await createWorld({ title: 'Sooner', startsInHours: 10 });

    const result = await listEvents(query({ sort: 'soonest' }));
    expect(result.items.map((e) => e.title)).toEqual(['Sooner', 'Later']);
  });

  it('paginates and reports a stable total', async () => {
    for (let i = 0; i < 7; i += 1) {
      await createWorld({ title: `Event ${i}`, priceMajor: i + 1, currency: 'GBP' });
    }

    const first = await listEvents(query({ perPage: 3, page: 1, sort: 'price-asc' }));
    const second = await listEvents(query({ perPage: 3, page: 2, sort: 'price-asc' }));
    const third = await listEvents(query({ perPage: 3, page: 3, sort: 'price-asc' }));

    expect(first.total).toBe(7);
    expect(first.pageCount).toBe(3);
    expect(first.items).toHaveLength(3);
    expect(second.items).toHaveLength(3);
    expect(third.items).toHaveLength(1);

    // No row appears on two pages.
    const ids = [...first.items, ...second.items, ...third.items].map((e) => e.id);
    expect(new Set(ids).size).toBe(7);
  });

  it('attaches the next bookable session to each card', async () => {
    const world = await createWorld({ capacity: 10, seatsBooked: 2, startsInHours: 30 });
    const result = await listEvents(query());
    const card = result.items[0]!;

    expect(card.nextSession).not.toBeNull();
    expect(card.nextSession!.seatsLeft).toBe(8);
    expect(card.nextSession!.id).toBe(world.sessionId);
  });
});

describe('event detail', () => {
  beforeEach(resetDatabase);

  it('returns the event with its upcoming sessions', async () => {
    const world = await createWorld({ capacity: 12, seatsBooked: 3 });
    const event = await getEventBySlug(world.eventSlug);

    expect(event.slug).toBe(world.eventSlug);
    expect(event.sessions).toHaveLength(1);
    expect(event.sessions[0]!.seatsLeft).toBe(9);
    expect(event.timezone).toBe('Asia/Kuwait');
  });

  it('refuses to serve a draft event through the public reader', async () => {
    const world = await createWorld({ status: 'DRAFT' });
    await expect(getEventBySlug(world.eventSlug)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('reports an unknown slug as not found', async () => {
    await expect(getEventBySlug('no-such-event')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('favourites', () => {
  beforeEach(resetDatabase);

  it('toggles on and off', async () => {
    const user = await createUser();
    const world = await createWorld();

    expect(await toggleFavorite(user.id, world.eventId)).toEqual({ favorited: true });
    expect(await toggleFavorite(user.id, world.eventId)).toEqual({ favorited: false });
    expect(await toggleFavorite(user.id, world.eventId)).toEqual({ favorited: true });
  });

  it('never creates duplicate rows for the same pair', async () => {
    const user = await createUser();
    const world = await createWorld();

    await toggleFavorite(user.id, world.eventId);
    const ids = await getFavoriteIds(user.id);
    expect(ids.size).toBe(1);

    const list = await listFavorites(user.id);
    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe(world.eventId);
  });

  it('keeps each user’s favourites separate', async () => {
    const a = await createUser();
    const b = await createUser();
    const world = await createWorld();

    await toggleFavorite(a.id, world.eventId);
    expect((await getFavoriteIds(a.id)).size).toBe(1);
    expect((await getFavoriteIds(b.id)).size).toBe(0);
  });

  it('rejects a favourite for an event that does not exist', async () => {
    const user = await createUser();
    await expect(toggleFavorite(user.id, 'no-such-event')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
