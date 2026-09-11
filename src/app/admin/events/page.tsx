import Link from 'next/link';
import clsx from 'clsx';
import { Plus, Star } from 'lucide-react';
import { listAdminEvents } from '@/server/services/admin-service';
import { listCities } from '@/server/services/event-service';
import { ButtonLink } from '@/components/ui/button';
import { AdminEventFilters } from '@/components/admin/admin-event-filters';
import { Pagination } from '@/components/pagination';
import { formatMoneyCompact } from '@/lib/money';
import { formatRelative } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Events' };

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: 'bg-success-50 text-success-700',
  DRAFT: 'bg-warn-50 text-warn-700',
  ARCHIVED: 'bg-mist-200 text-mist-700',
};

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;

  const [result, cities] = await Promise.all([
    listAdminEvents({
      q: typeof params.q === 'string' ? params.q : undefined,
      status: typeof params.status === 'string' ? params.status : undefined,
      cityId: typeof params.cityId === 'string' ? params.cityId : undefined,
      page,
      perPage: 20,
    }),
    listCities(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink-950">Events</h2>
          <p className="mt-0.5 text-sm text-mist-600">
            {result.total} {result.total === 1 ? 'event' : 'events'} in the catalogue
          </p>
        </div>
        <ButtonLink href="/admin/events/new">
          <Plus className="h-4 w-4" aria-hidden />
          New event
        </ButtonLink>
      </div>

      <AdminEventFilters cities={cities.map((c) => ({ id: c.id, name: c.name }))} />

      <div className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-mist-200 bg-mist-50 text-xs uppercase tracking-wide text-mist-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Event</th>
                <th scope="col" className="px-5 py-3 font-semibold">Location</th>
                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Price</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Dates</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Seats sold</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist-200">
              {result.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-mist-500">
                    No events match those filters.
                  </td>
                </tr>
              ) : (
                result.items.map((event) => (
                  <tr key={event.id} className="transition-colors hover:bg-mist-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="font-medium text-ink-950 hover:text-brand-700"
                      >
                        {event.title}
                      </Link>
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-mist-500">
                        {event.category}
                        {event.isFeatured && (
                          <Star className="h-3 w-3 fill-warn-500 text-warn-500" aria-label="Featured" />
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-mist-700">
                      {event.city}
                      <span className="block text-xs text-mist-500">{event.country}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={clsx(
                          'rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold',
                          STATUS_STYLES[event.status] ?? 'bg-mist-200 text-mist-700',
                        )}
                      >
                        {event.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink-900">
                      {formatMoneyCompact(event.basePriceMinor, event.currency)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-mist-700">
                      {event.sessionCount}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-mist-700">
                      {event.bookedSeats}
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-mist-500">
                      {formatRelative(event.updatedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        basePath="/admin/events"
        searchParams={params}
      />
    </div>
  );
}
