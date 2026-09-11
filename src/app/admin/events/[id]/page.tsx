import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import {
  getAdminEvent,
  listEventSessions,
  listVenues,
} from '@/server/services/admin-service';
import { listCategories, listCities } from '@/server/services/event-service';
import { EventForm } from '@/components/admin/event-form';
import { SessionManager } from '@/components/admin/session-manager';
import { ApiActionButton } from '@/components/admin/api-action-button';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Edit event' };

export default async function AdminEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let event;
  try {
    event = await getAdminEvent(id);
  } catch {
    notFound();
  }

  const [categories, cities, venues, sessions] = await Promise.all([
    listCategories(),
    listCities(),
    listVenues(),
    listEventSessions(id),
  ]);

  const city = cities.find((c) => c.id === event.cityId);
  const liveBookings = sessions.reduce((n, s) => n + s.bookingCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-mist-600 transition-colors hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to events
          </Link>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-ink-950">{event.title}</h2>
          <p className="mt-0.5 text-sm text-mist-600">
            {city?.name} · {sessions.length} dates · {liveBookings} active bookings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {event.status === 'PUBLISHED' && (
            <Link
              href={`/events/${event.slug}`}
              target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-mist-300 px-3.5 text-sm font-medium text-ink-800 transition-colors hover:bg-mist-100"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              View live
            </Link>
          )}
          <ApiActionButton
            endpoint={`/api/admin/events/${id}`}
            method="DELETE"
            label="Delete event"
            variant="ghost"
            confirmLabel="Delete"
            confirmMessage={
              liveBookings > 0
                ? 'This event has bookings — it will be archived instead of deleted.'
                : 'Delete permanently? Its dates go with it.'
            }
            redirectTo="/admin/events"
          />
        </div>
      </div>

      <section className="rounded-2xl border border-mist-200 bg-white p-6">
        <h3 className="text-base font-semibold text-ink-950">Dates and capacity</h3>
        <p className="mt-0.5 text-sm text-mist-600">
          Each date is bookable independently, with its own capacity and optional price.
        </p>
        <div className="mt-5">
          <SessionManager
            eventId={id}
            currency={event.currency}
            timezone={city?.timezone ?? 'UTC'}
            sessions={sessions}
          />
        </div>
      </section>

      <div className="max-w-3xl">
        <EventForm
          mode="edit"
          eventId={id}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          cities={cities.map((c) => ({
            id: c.id,
            name: `${c.name} — ${c.country.name}`,
            currency: c.country.currency,
          }))}
          venues={venues.map((v) => ({ id: v.id, name: v.name, cityId: v.cityId }))}
          defaults={{
            title: event.title,
            summary: event.summary,
            description: event.description,
            categoryId: event.categoryId,
            cityId: event.cityId,
            venueId: event.venueId,
            price: event.price,
            durationMinutes: event.durationMinutes,
            minAge: event.minAge,
            tags: event.tags,
            isFeatured: event.isFeatured,
            status: event.status,
          }}
        />
      </div>
    </div>
  );
}
