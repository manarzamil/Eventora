import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Phone,
  Ticket,
  Users,
  XCircle,
} from 'lucide-react';
import { getBookingByReference, CANCELLATION_WINDOW_HOURS } from '@/server/services/booking-service';
import { readSession } from '@/server/auth/session';
import { CancelBookingButton } from '@/components/cancel-booking-button';
import { ButtonLink } from '@/components/ui/button';
import { formatDuration, formatLongDate, formatRelative, formatTime } from '@/lib/format';
import { formatMoney } from '@/lib/money';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Booking confirmation', robots: { index: false } };

type Props = {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ new?: string }>;
};

export default async function BookingConfirmationPage({ params, searchParams }: Props) {
  const { reference } = await params;
  const { new: isNew } = await searchParams;
  const session = await readSession();
  if (!session) notFound();

  let booking;
  try {
    booking = await getBookingByReference(reference, session.sub, session.role === 'ADMIN');
  } catch {
    notFound();
  }

  const cancelled = booking.status === 'CANCELLED';
  const hoursUntil = (new Date(booking.session.startsAt).getTime() - Date.now()) / 3_600_000;
  const started = hoursUntil <= 0;
  const insideWindow = hoursUntil < CANCELLATION_WINDOW_HOURS;

  return (
    <div className="container-page max-w-3xl py-10">
      {isNew && !cancelled && (
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-success-500/25 bg-success-50 p-5">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success-700" aria-hidden />
          <div>
            <h1 className="text-lg font-semibold text-success-700">You’re booked.</h1>
            <p className="mt-1 text-sm leading-relaxed text-success-700/90">
              Keep the reference below. In a production deployment a confirmation e-mail would be on
              its way to {booking.guestEmail}.
            </p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-soft">
        {/* Ticket header */}
        <div className="surface-deep relative px-6 py-7 text-white sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-ink-300">Booking reference</p>
              <p className="mt-1.5 font-mono text-2xl font-semibold tracking-[0.08em] text-white">
                {booking.reference}
              </p>
            </div>
            <span
              className={
                cancelled
                  ? 'inline-flex items-center gap-1.5 rounded-full bg-danger-500/20 px-3 py-1.5 text-xs font-semibold text-danger-100 ring-1 ring-inset ring-danger-500/40'
                  : 'inline-flex items-center gap-1.5 rounded-full bg-success-500/20 px-3 py-1.5 text-xs font-semibold text-success-50 ring-1 ring-inset ring-success-500/40'
              }
            >
              {cancelled ? (
                <XCircle className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              )}
              {cancelled ? 'Cancelled' : 'Confirmed'}
            </span>
          </div>
        </div>

        {/* Event */}
        <div className="flex gap-5 border-b border-mist-200 p-6 sm:p-8">
          <img
            src={booking.event.heroImageUrl}
            alt=""
            className="hidden h-24 w-36 shrink-0 rounded-xl object-cover sm:block"
          />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
              {booking.event.category}
            </p>
            <h2 className="mt-1 text-xl font-semibold leading-snug text-ink-950">
              <Link href={`/events/${booking.event.slug}`} className="hover:text-brand-700">
                {booking.event.title}
              </Link>
            </h2>
            <p className="mt-1.5 text-sm text-mist-600">
              {booking.venue.name} · {booking.city.name}, {booking.country.name}
            </p>
          </div>
        </div>

        {/* Details */}
        <dl className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
          <Row icon={CalendarDays} label="Date">
            {formatLongDate(booking.session.startsAt, booking.city.timezone)}
            {!started && (
              <span className="mt-0.5 block text-xs font-normal text-mist-500">
                {formatRelative(booking.session.startsAt)}
              </span>
            )}
          </Row>
          <Row icon={Clock} label="Time">
            {formatTime(booking.session.startsAt, booking.city.timezone)} –{' '}
            {formatTime(booking.session.endsAt, booking.city.timezone)}
            <span className="mt-0.5 block text-xs font-normal text-mist-500">
              {booking.city.name} local time · {formatDuration(booking.event.durationMinutes)}
            </span>
          </Row>
          <Row icon={MapPin} label="Address">
            {booking.venue.address}
          </Row>
          <Row icon={Users} label="Guests">
            {booking.quantity} {booking.quantity === 1 ? 'person' : 'people'}
          </Row>
          <Row icon={Mail} label="Lead guest">
            {booking.guestName}
            <span className="mt-0.5 block text-xs font-normal text-mist-500">
              {booking.guestEmail}
            </span>
          </Row>
          {booking.guestPhone && (
            <Row icon={Phone} label="Phone">
              {booking.guestPhone}
            </Row>
          )}
          {booking.notes && (
            <div className="sm:col-span-2">
              <Row icon={Ticket} label="Notes for the organiser">
                {booking.notes}
              </Row>
            </div>
          )}
        </dl>

        {/* Total */}
        <div className="border-t border-mist-200 bg-mist-50 px-6 py-5 sm:px-8">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-mist-600">
              {booking.quantity} × {formatMoney(booking.unitPriceMinor, booking.currency)}
            </span>
            <span className="text-2xl font-semibold tracking-tight text-ink-950">
              {formatMoney(booking.totalMinor, booking.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/bookings" variant="secondary">
            All my bookings
          </ButtonLink>
          <ButtonLink href={`/destinations/${booking.country.slug}/${booking.city.slug}`}>
            More in {booking.city.name}
          </ButtonLink>
        </div>

        {!cancelled && (
          <CancelBookingButton
            reference={booking.reference}
            disabled={started || insideWindow}
            disabledReason={
              started
                ? 'This session has already taken place.'
                : `Cancellation closed — less than ${CANCELLATION_WINDOW_HOURS} hours to go.`
            }
          />
        )}
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-wide text-mist-500">{label}</dt>
        <dd className="mt-1 text-sm font-medium text-ink-900">{children}</dd>
      </div>
    </div>
  );
}
