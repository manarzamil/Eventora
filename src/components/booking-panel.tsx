'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { CalendarDays, Info, Minus, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime, availabilityLabel } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { MAX_TICKETS_PER_BOOKING } from '@/lib/validation';
import type { EventSessionView } from '@/server/services/event-service';

/**
 * Date, time and quantity selection.
 *
 * Sessions are grouped by calendar day in the event's own time zone so the
 * picker reads like a calendar rather than a flat list of 60 timestamps. The
 * quantity stepper is capped by both the per-booking limit and the seats
 * actually left on the chosen session, so an impossible order cannot be
 * assembled in the first place — the server re-checks regardless.
 */
export function BookingPanel({
  slug,
  currency,
  timezone,
  sessions,
  minAge,
}: {
  slug: string;
  currency: string;
  timezone: string;
  sessions: EventSessionView[];
  minAge: number;
}) {
  const router = useRouter();
  const bookable = useMemo(() => sessions.filter((s) => s.seatsLeft > 0), [sessions]);
  const [sessionId, setSessionId] = useState(bookable[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);

  const selected = bookable.find((s) => s.id === sessionId) ?? null;

  const days = useMemo(() => {
    const map = new Map<string, EventSessionView[]>();
    for (const session of bookable) {
      const key = formatDate(session.startsAt, timezone);
      const list = map.get(key);
      if (list) list.push(session);
      else map.set(key, [session]);
    }
    return [...map.entries()].slice(0, 8);
  }, [bookable, timezone]);

  const maxQuantity = Math.min(MAX_TICKETS_PER_BOOKING, selected?.seatsLeft ?? 1);
  const clampedQuantity = Math.min(quantity, Math.max(1, maxQuantity));
  const total = selected ? selected.priceMinor * clampedQuantity : 0;

  if (bookable.length === 0) {
    return (
      <div className="surface-panel p-6">
        <h2 className="text-base font-semibold text-ink-950">No dates available</h2>
        <p className="mt-2 text-sm leading-relaxed text-mist-600">
          Every upcoming session for this listing is fully booked. Save it to your favourites and
          we will keep it on your list for when new dates open.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-panel overflow-hidden">
      <div className="border-b border-mist-200 px-6 py-5">
        <p className="text-xs uppercase tracking-wider text-mist-500">From</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight text-ink-950">
            {formatMoney(Math.min(...bookable.map((s) => s.priceMinor)), currency)}
          </span>
          <span className="text-sm text-mist-600">per person</span>
        </p>
      </div>

      <div className="space-y-5 px-6 py-5">
        {/* Date */}
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-950">
            <CalendarDays className="h-4 w-4 text-brand-600" aria-hidden />
            Choose a date
          </h3>

          <div className="mt-3 space-y-3">
            {days.map(([day, daySessions]) => (
              <div key={day}>
                <p className="text-xs font-medium text-mist-600">{day}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {daySessions.map((session) => {
                    const active = session.id === sessionId;
                    const availability = availabilityLabel(session.seatsLeft);
                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => {
                          setSessionId(session.id);
                          setQuantity((q) => Math.min(q, session.seatsLeft));
                        }}
                        aria-pressed={active}
                        className={clsx(
                          'rounded-lg border px-3 py-2 text-left text-sm transition-all',
                          active
                            ? 'border-brand-600 bg-brand-50 text-brand-800 ring-2 ring-brand-100'
                            : 'border-mist-300 text-ink-800 hover:border-mist-400 hover:bg-mist-50',
                        )}
                      >
                        <span className="block font-semibold">
                          {formatTime(session.startsAt, timezone)}
                        </span>
                        <span
                          className={clsx(
                            'block text-[0.6875rem]',
                            availability.tone === 'low' ? 'text-warn-700' : 'text-mist-500',
                          )}
                        >
                          {availability.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {sessions.length > bookable.length && (
            <p className="mt-3 text-xs text-mist-500">
              {sessions.length - bookable.length} further{' '}
              {sessions.length - bookable.length === 1 ? 'date is' : 'dates are'} sold out.
            </p>
          )}
        </div>

        {/* Quantity */}
        <div className="border-t border-mist-200 pt-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-950">
            <Users className="h-4 w-4 text-brand-600" aria-hidden />
            How many people?
          </h3>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-mist-300">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={clampedQuantity <= 1}
                aria-label="Fewer tickets"
                className="grid h-10 w-10 place-items-center rounded-l-xl text-ink-800 transition-colors hover:bg-mist-100 disabled:text-mist-300"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <span
                className="w-10 text-center text-sm font-semibold text-ink-950"
                aria-live="polite"
              >
                {clampedQuantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={clampedQuantity >= maxQuantity}
                aria-label="More tickets"
                className="grid h-10 w-10 place-items-center rounded-r-xl text-ink-800 transition-colors hover:bg-mist-100 disabled:text-mist-300"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <p className="text-xs text-mist-500">
              Up to {maxQuantity} on this date
              {minAge > 0 && ` · minimum age ${minAge}`}
            </p>
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-mist-200 pt-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-mist-600">
              {formatMoney(selected?.priceMinor ?? 0, currency)} × {clampedQuantity}
            </span>
            <span className="text-xl font-semibold text-ink-950">
              {formatMoney(total, currency)}
            </span>
          </div>

          <Button
            fullWidth
            size="lg"
            className="mt-4"
            disabled={!selected}
            onClick={() =>
              router.push(`/events/${slug}/book?session=${sessionId}&qty=${clampedQuantity}`)
            }
          >
            Continue to booking
          </Button>

          <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-mist-500">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            Free cancellation up to 24 hours before the start time. No payment is taken — this is a
            demonstration project.
          </p>
        </div>
      </div>
    </div>
  );
}
