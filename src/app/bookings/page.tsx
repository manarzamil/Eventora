import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CalendarX2, ChevronRight, MapPin, Ticket } from 'lucide-react';
import clsx from 'clsx';
import { listBookingsForUser } from '@/server/services/booking-service';
import { readSession } from '@/server/auth/session';
import { ButtonLink } from '@/components/ui/button';
import { formatLongDate, formatRelative, formatTime } from '@/lib/format';
import { formatMoney } from '@/lib/money';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'My bookings', robots: { index: false } };

export default async function BookingsPage() {
  const session = await readSession();
  if (!session) redirect('/sign-in?next=/bookings');

  const bookings = await listBookingsForUser(session.sub);
  const now = Date.now();

  const upcoming = bookings.filter(
    (b) => b.status !== 'CANCELLED' && new Date(b.session.startsAt).getTime() > now,
  );
  const past = bookings.filter(
    (b) => b.status !== 'CANCELLED' && new Date(b.session.startsAt).getTime() <= now,
  );
  const cancelled = bookings.filter((b) => b.status === 'CANCELLED');

  return (
    <div className="container-page max-w-4xl py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-950">My bookings</h1>
        <p className="mt-2 text-[0.9375rem] text-mist-600">
          {bookings.length === 0
            ? 'Nothing booked yet.'
            : `${upcoming.length} upcoming · ${past.length} past · ${cancelled.length} cancelled`}
        </p>
      </header>

      {bookings.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-mist-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-mist-100 text-mist-500">
            <CalendarX2 className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-ink-950">No bookings yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-mist-600">
            Pick a city and find something to do this week — everything you book will show up here.
          </p>
          <ButtonLink href="/destinations" className="mt-5">
            Browse destinations
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {upcoming.length > 0 && <Group title="Upcoming" bookings={upcoming} />}
          {past.length > 0 && <Group title="Past" bookings={past} muted />}
          {cancelled.length > 0 && <Group title="Cancelled" bookings={cancelled} muted />}
        </div>
      )}
    </div>
  );
}

function Group({
  title,
  bookings,
  muted,
}: {
  title: string;
  bookings: Awaited<ReturnType<typeof listBookingsForUser>>;
  muted?: boolean;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-mist-500">{title}</h2>
      <ul className="mt-3 space-y-3">
        {bookings.map((booking) => (
          <li key={booking.id}>
            <Link
              href={`/bookings/${booking.reference}`}
              className={clsx(
                'group flex items-center gap-4 rounded-2xl border border-mist-200 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-lift',
                muted && 'opacity-80',
              )}
            >
              <img
                src={booking.event.heroImageUrl}
                alt=""
                loading="lazy"
                className={clsx(
                  'hidden h-20 w-28 shrink-0 rounded-xl object-cover sm:block',
                  booking.status === 'CANCELLED' && 'grayscale',
                )}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[0.6875rem] font-semibold tracking-wide text-mist-500">
                    {booking.reference}
                  </span>
                  {booking.status === 'CANCELLED' && (
                    <span className="rounded-full bg-danger-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-danger-700">
                      Cancelled
                    </span>
                  )}
                </div>

                <h3 className="mt-1 truncate text-[0.9375rem] font-semibold text-ink-950 group-hover:text-brand-700">
                  {booking.event.title}
                </h3>

                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mist-600">
                  <span>
                    {formatLongDate(booking.session.startsAt, booking.city.timezone)} ·{' '}
                    {formatTime(booking.session.startsAt, booking.city.timezone)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden />
                    {booking.city.name}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Ticket className="h-3 w-3" aria-hidden />
                    {booking.quantity}
                  </span>
                </p>
              </div>

              <div className="hidden shrink-0 text-right sm:block">
                <p className="text-sm font-semibold text-ink-950">
                  {formatMoney(booking.totalMinor, booking.currency)}
                </p>
                {booking.status !== 'CANCELLED' &&
                  new Date(booking.session.startsAt).getTime() > Date.now() && (
                    <p className="mt-0.5 text-xs text-mist-500">
                      {formatRelative(booking.session.startsAt)}
                    </p>
                  )}
              </div>

              <ChevronRight
                className="h-5 w-5 shrink-0 text-mist-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
