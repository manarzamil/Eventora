import Link from 'next/link';
import {
  CalendarRange,
  Gauge,
  Globe2,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';
import clsx from 'clsx';
import { getAdminStats } from '@/server/services/admin-service';
import { MiniBarChart, StatTile } from '@/components/admin/stat-tile';
import { formatMoney } from '@/lib/money';
import { formatRelative } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Overview' };

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Published events"
          value={stats.totals.publishedEvents}
          sublabel={`${stats.totals.draftEvents} drafts · ${stats.totals.events} total`}
          icon={CalendarRange}
          tone="brand"
        />
        <StatTile
          label="Bookings"
          value={stats.totals.bookings}
          sublabel={`${stats.totals.upcomingSessions} upcoming sessions`}
          icon={Ticket}
        />
        <StatTile
          label="Registered users"
          value={stats.totals.users}
          icon={Users}
        />
        <StatTile
          label="Average occupancy"
          value={`${stats.occupancy.averagePercent}%`}
          sublabel={`${stats.occupancy.soldOutSessions} sessions sold out`}
          icon={Gauge}
          tone={stats.occupancy.averagePercent > 80 ? 'warn' : 'default'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Bookings over time */}
        <section className="rounded-2xl border border-mist-200 bg-white p-6">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-ink-950">Bookings, last 14 days</h2>
              <p className="mt-0.5 text-xs text-mist-500">
                Every day is shown, including days with none.
              </p>
            </div>
            <TrendingUp className="h-4 w-4 text-mist-400" aria-hidden />
          </div>
          <div className="mt-6">
            <MiniBarChart data={stats.bookingsLast14Days} label="Bookings per day, last 14 days" />
          </div>
        </section>

        {/* Revenue */}
        <section className="rounded-2xl border border-mist-200 bg-white p-6">
          <h2 className="text-base font-semibold text-ink-950">Booking value by currency</h2>
          <p className="mt-0.5 text-xs text-mist-500">
            Not converted — a total across currencies would be meaningless without a rate source.
          </p>

          {stats.revenueByCurrency.length === 0 ? (
            <p className="mt-6 text-sm text-mist-500">No bookings yet.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {stats.revenueByCurrency.map((row) => (
                <li
                  key={row.currency}
                  className="flex items-center justify-between rounded-xl bg-mist-50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-ink-900">
                    {row.currency}
                    <span className="ml-2 text-xs font-normal text-mist-500">
                      {row.bookings} {row.bookings === 1 ? 'booking' : 'bookings'}
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-ink-950">
                    {formatMoney(row.totalMinor, row.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top events */}
        <section className="rounded-2xl border border-mist-200 bg-white p-6">
          <h2 className="text-base font-semibold text-ink-950">Most booked events</h2>
          {stats.topEvents.length === 0 ? (
            <p className="mt-5 text-sm text-mist-500">No bookings to rank yet.</p>
          ) : (
            <ol className="mt-5 space-y-2.5">
              {stats.topEvents.map((event, i) => (
                <li key={event.id} className="flex items-center gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-mist-100 text-xs font-semibold text-mist-600">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink-900">
                      {event.title}
                    </span>
                    <span className="block text-xs text-mist-500">{event.city}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-ink-950">
                    {event.seats}
                    <span className="ml-1 text-xs font-normal text-mist-500">seats</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Recent bookings */}
        <section className="rounded-2xl border border-mist-200 bg-white p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-ink-950">Latest bookings</h2>
            <Link href="/admin/bookings" className="text-sm font-medium text-brand-700 hover:text-brand-800">
              View all
            </Link>
          </div>

          {stats.recentBookings.length === 0 ? (
            <p className="mt-5 text-sm text-mist-500">No bookings yet.</p>
          ) : (
            <ul className="mt-5 divide-y divide-mist-200">
              {stats.recentBookings.map((booking) => (
                <li key={booking.reference} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink-900">
                      {booking.eventTitle}
                    </span>
                    <span className="block text-xs text-mist-500">
                      {booking.guestName} · {formatRelative(booking.createdAt)}
                    </span>
                  </span>
                  <span
                    className={clsx(
                      'shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold',
                      booking.status === 'CANCELLED'
                        ? 'bg-danger-50 text-danger-700'
                        : 'bg-success-50 text-success-700',
                    )}
                  >
                    {booking.status.toLowerCase()}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-ink-950">
                    {formatMoney(booking.totalMinor, booking.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Catalogue summary */}
      <section className="rounded-2xl border border-mist-200 bg-white p-6">
        <h2 className="text-base font-semibold text-ink-950">Catalogue</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Countries', value: stats.totals.countries, href: '/admin/destinations', icon: Globe2 },
            { label: 'Cities', value: stats.totals.cities, href: '/admin/destinations', icon: Globe2 },
            { label: 'Categories', value: stats.totals.categories, href: '/admin/categories', icon: CalendarRange },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between rounded-xl bg-mist-50 px-4 py-3 transition-colors hover:bg-mist-100"
            >
              <dt className="text-sm text-mist-600">{item.label}</dt>
              <dd className="text-lg font-semibold tabular-nums text-ink-950">{item.value}</dd>
            </Link>
          ))}
        </dl>
      </section>
    </div>
  );
}
