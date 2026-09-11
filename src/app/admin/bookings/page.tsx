import Link from 'next/link';
import clsx from 'clsx';
import { listAllBookings } from '@/server/services/admin-service';
import { AdminBookingFilters } from '@/components/admin/admin-booking-filters';
import { formatMoney } from '@/lib/money';
import { formatDate, formatRelative, formatTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Bookings' };

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-success-50 text-success-700',
  PENDING: 'bg-warn-50 text-warn-700',
  CANCELLED: 'bg-danger-50 text-danger-700',
};

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const bookings = await listAllBookings({
    q: typeof params.q === 'string' ? params.q : undefined,
    status: typeof params.status === 'string' ? params.status : undefined,
  });

  const totalSeats = bookings
    .filter((b) => b.status !== 'CANCELLED')
    .reduce((n, b) => n + b.quantity, 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-ink-950">Bookings</h2>
        <p className="mt-0.5 text-sm text-mist-600">
          {bookings.length} shown · {totalSeats} seats on active bookings · newest first, capped at
          200
        </p>
      </div>

      <AdminBookingFilters />

      <div className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[54rem] text-left text-sm">
            <thead className="border-b border-mist-200 bg-mist-50 text-xs uppercase tracking-wide text-mist-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Reference</th>
                <th scope="col" className="px-5 py-3 font-semibold">Event</th>
                <th scope="col" className="px-5 py-3 font-semibold">Guest</th>
                <th scope="col" className="px-5 py-3 font-semibold">Session</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Seats</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Total</th>
                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Booked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist-200">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-mist-500">
                    No bookings match those filters.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="transition-colors hover:bg-mist-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/bookings/${booking.reference}`}
                        className="font-mono text-xs font-semibold text-brand-700 hover:text-brand-800"
                      >
                        {booking.reference}
                      </Link>
                    </td>
                    <td className="max-w-[16rem] px-5 py-3">
                      <span className="block truncate font-medium text-ink-900">
                        {booking.eventTitle}
                      </span>
                      <span className="block text-xs text-mist-500">{booking.cityName}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="block text-ink-900">{booking.guestName}</span>
                      <span className="block text-xs text-mist-500">{booking.guestEmail}</span>
                    </td>
                    <td className="px-5 py-3 text-mist-700">
                      {formatDate(booking.startsAt)}
                      <span className="block text-xs text-mist-500">
                        {formatTime(booking.startsAt)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-mist-700">
                      {booking.quantity}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium text-ink-900">
                      {formatMoney(booking.totalMinor, booking.currency)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={clsx(
                          'rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold',
                          STATUS_STYLES[booking.status] ?? 'bg-mist-200 text-mist-700',
                        )}
                      >
                        {booking.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-mist-500">
                      {formatRelative(booking.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
