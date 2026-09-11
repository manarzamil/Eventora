import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import { getEventBySlug } from '@/server/services/event-service';
import { getUserById } from '@/server/services/auth-service';
import { readSession } from '@/server/auth/session';
import { CheckoutForm } from '@/components/checkout-form';
import { formatDuration, formatLongDate, formatTime } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { MAX_TICKETS_PER_BOOKING } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Confirm your booking', robots: { index: false } };

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session?: string; qty?: string }>;
};

export default async function BookPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { session: sessionId, qty } = await searchParams;

  const auth = await readSession();
  if (!auth) {
    const next = `/events/${slug}/book?session=${sessionId ?? ''}&qty=${qty ?? '1'}`;
    redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  }

  let event;
  try {
    event = await getEventBySlug(slug);
  } catch {
    notFound();
  }

  const chosen = event.sessions.find((s) => s.id === sessionId);
  // A stale or hand-edited session id sends the visitor back to the listing
  // rather than showing a broken checkout.
  if (!chosen || chosen.seatsLeft <= 0) redirect(`/events/${slug}`);

  const quantity = Math.min(
    Math.max(1, Number.parseInt(qty ?? '1', 10) || 1),
    Math.min(MAX_TICKETS_PER_BOOKING, chosen.seatsLeft),
  );

  const user = await getUserById(auth.sub);
  const total = chosen.priceMinor * quantity;

  return (
    <div className="container-page py-10">
      <Link
        href={`/events/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-mist-600 transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to {event.title}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
            Confirm your booking
          </h1>
          <p className="mt-2 text-[0.9375rem] text-mist-600">
            One step. Your details are pre-filled from your account — change them if the booking is
            for someone else.
          </p>

          <div className="mt-8 rounded-2xl border border-mist-200 bg-white p-6">
            <CheckoutForm
              sessionId={chosen.id}
              quantity={quantity}
              defaults={{
                name: user.fullName,
                email: user.email,
                phone: user.phone ?? '',
              }}
            />
          </div>
        </div>

        {/* Order summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="surface-panel overflow-hidden">
            <div className="relative aspect-[16/9] bg-ink-900">
              <img src={event.heroImageUrl} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 to-transparent" />
              <h2 className="absolute inset-x-0 bottom-0 p-4 text-sm font-semibold leading-snug text-white">
                {event.title}
              </h2>
            </div>

            <dl className="space-y-3 px-5 py-5 text-sm">
              <SummaryRow icon={CalendarDays} label="Date">
                {formatLongDate(chosen.startsAt, event.timezone)}
              </SummaryRow>
              <SummaryRow icon={Clock} label="Time">
                {formatTime(chosen.startsAt, event.timezone)} local ·{' '}
                {formatDuration(event.durationMinutes)}
              </SummaryRow>
              <SummaryRow icon={MapPin} label="Venue">
                {event.venue.name}, {event.city.name}
              </SummaryRow>
              <SummaryRow icon={Users} label="Tickets">
                {quantity} × {formatMoney(chosen.priceMinor, event.currency)}
              </SummaryRow>
            </dl>

            <div className="border-t border-mist-200 px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-mist-600">Total</span>
                <span className="text-2xl font-semibold tracking-tight text-ink-950">
                  {formatMoney(total, event.currency)}
                </span>
              </div>
              <p className="mt-1 text-xs text-mist-500">
                {event.currency} · taxes and fees are not modelled in this project
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({
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
      <div>
        <dt className="text-xs uppercase tracking-wide text-mist-500">{label}</dt>
        <dd className="mt-0.5 font-medium text-ink-900">{children}</dd>
      </div>
    </div>
  );
}
