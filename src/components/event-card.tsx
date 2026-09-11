import Link from 'next/link';
import clsx from 'clsx';
import { Clock, MapPin } from 'lucide-react';
import type { EventCard as EventCardData } from '@/server/services/event-service';
import { CategoryIcon } from '@/components/category-icon';
import { FavoriteButton } from '@/components/favorite-button';
import { Rating } from '@/components/rating';
import { formatDate, formatDuration, formatTime, availabilityLabel } from '@/lib/format';
import { formatMoneyCompact } from '@/lib/money';

export function EventCardItem({
  event,
  favorited,
  signedIn,
  timezone,
  priority: _priority,
}: {
  event: EventCardData;
  favorited: boolean;
  signedIn: boolean;
  timezone?: string;
  priority?: boolean;
}) {
  const next = event.nextSession;
  const availability = next ? availabilityLabel(next.seatsLeft) : null;
  const price = next?.priceMinor ?? event.basePriceMinor;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-mist-300 hover:shadow-lift">
      <Link href={`/events/${event.slug}`} className="absolute inset-0 z-10" aria-label={event.title}>
        <span className="sr-only">{event.title}</span>
      </Link>

      <div className="relative aspect-[16/10] overflow-hidden bg-mist-200">
        <img
          src={event.heroImageUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />

        <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/92 px-2.5 py-1 text-[0.6875rem] font-semibold text-ink-900 backdrop-blur-sm">
            <CategoryIcon name={event.category.icon} className="h-3.5 w-3.5 text-brand-600" />
            {event.category.name}
          </span>
          {event.isFeatured && (
            <span className="rounded-full bg-brand-600 px-2.5 py-1 text-[0.6875rem] font-semibold text-white">
              Featured
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 z-20">
          <FavoriteButton
            eventId={event.id}
            initial={favorited}
            signedIn={signedIn}
            size="sm"
          />
        </div>

        {availability && availability.tone !== 'ok' && (
          <span
            className={clsx(
              'absolute bottom-3 left-3 z-20 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold',
              availability.tone === 'low' ? 'bg-warn-500 text-ink-950' : 'bg-ink-950/85 text-white',
            )}
          >
            {availability.text}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[0.9375rem] font-semibold leading-snug text-ink-950 transition-colors group-hover:text-brand-700">
            {event.title}
          </h3>
        </div>

        <p className="line-clamp-2 text-[0.8125rem] leading-relaxed text-mist-600">
          {event.summary}
        </p>

        <div className="mt-auto space-y-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mist-600">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-mist-400" aria-hidden />
              {event.venueName}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-mist-400" aria-hidden />
              {formatDuration(event.durationMinutes)}
            </span>
          </div>

          <div className="flex items-end justify-between gap-3 border-t border-mist-200 pt-2.5">
            <div>
              {next ? (
                <p className="text-xs font-medium text-ink-800">
                  Next: {formatDate(next.startsAt, timezone)} · {formatTime(next.startsAt, timezone)}
                </p>
              ) : (
                <p className="text-xs text-mist-500">No upcoming dates</p>
              )}
              <Rating value={event.rating} count={event.reviewCount} className="mt-1" />
            </div>

            <div className="text-right">
              <p className="text-[0.6875rem] uppercase tracking-wide text-mist-500">from</p>
              <p className="text-base font-semibold text-ink-950">
                {formatMoneyCompact(price, event.currency)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Loading placeholder matching the card's exact geometry, to avoid layout shift. */
export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
      <div className="skeleton aspect-[16/10]" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton mt-3 h-8 w-full rounded" />
      </div>
    </div>
  );
}
