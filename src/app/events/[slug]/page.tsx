import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarClock, ChevronRight, Clock, MapPin, ShieldCheck, Tag, UserRound } from 'lucide-react';
import { getEventBySlug } from '@/server/services/event-service';
import { getFavoriteIds } from '@/server/services/favorite-service';
import { readSession } from '@/server/auth/session';
import { BookingPanel } from '@/components/booking-panel';
import { FavoriteButton } from '@/components/favorite-button';
import { CategoryIcon } from '@/components/category-icon';
import { Rating, StarRow } from '@/components/rating';
import { formatDuration, formatLongDate, formatRelative, formatTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const event = await getEventBySlug(slug);
    return {
      title: event.title,
      description: event.summary,
      openGraph: {
        title: event.title,
        description: event.summary,
        images: [{ url: event.heroImageUrl }],
      },
    };
  } catch {
    return { title: 'Event not found' };
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;

  let event;
  try {
    event = await getEventBySlug(slug);
  } catch {
    notFound();
  }

  const session = await readSession();
  const favorites = session ? await getFavoriteIds(session.sub) : new Set<string>();

  const upcoming = event.sessions.filter((s) => s.seatsLeft > 0);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-950">
        <img
          src={event.heroImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/75 to-ink-950/35" />

        <div className="container-page relative pb-10 pt-8 sm:pb-14 sm:pt-10">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-200">
              <li>
                <Link href="/destinations" className="hover:text-white">Destinations</Link>
              </li>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
              <li>
                <Link href={`/destinations/${event.country.slug}`} className="hover:text-white">
                  {event.country.name}
                </Link>
              </li>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
              <li>
                <Link
                  href={`/destinations/${event.country.slug}/${event.city.slug}`}
                  className="hover:text-white"
                >
                  {event.city.name}
                </Link>
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/categories/${event.category.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  <CategoryIcon name={event.category.icon} className="h-3.5 w-3.5" />
                  {event.category.name}
                </Link>
                {event.isFeatured && (
                  <span className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">
                    Featured
                  </span>
                )}
                {event.minAge > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/20">
                    <UserRound className="h-3.5 w-3.5" aria-hidden />
                    {event.minAge}+
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-[2.6rem]">
                {event.title}
              </h1>
              <p className="mt-3 max-w-2xl text-[1.0625rem] leading-relaxed text-ink-100">
                {event.summary}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-100">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 opacity-70" aria-hidden />
                  {event.venue.name}, {event.city.name}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 opacity-70" aria-hidden />
                  {formatDuration(event.durationMinutes)}
                </span>
                {event.rating !== null && (
                  <span className="rounded-full bg-white/12 px-2.5 py-1">
                    <Rating value={event.rating} count={event.reviewCount} className="[&_*]:!text-white" />
                  </span>
                )}
              </div>
            </div>

            <FavoriteButton
              eventId={event.id}
              initial={favorites.has(event.id)}
              signedIn={Boolean(session)}
            />
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="container-page py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_23rem]">
          <div className="min-w-0 space-y-10">
            {/* Gallery */}
            {event.galleryUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {event.galleryUrls.slice(0, 3).map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    loading="lazy"
                    className="aspect-[4/3] w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            )}

            {/* Description */}
            <section>
              <h2 className="text-xl font-semibold text-ink-950">About this experience</h2>
              <p className="mt-4 whitespace-pre-line text-[0.9375rem] leading-[1.75] text-mist-700">
                {event.description}
              </p>

              {event.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-full bg-mist-100 px-3 py-1.5 text-xs font-medium text-mist-700"
                    >
                      <Tag className="h-3 w-3" aria-hidden />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Practical details */}
            <section className="grid gap-4 sm:grid-cols-2">
              <DetailCard icon={MapPin} title="Where">
                <p className="font-medium text-ink-900">{event.venue.name}</p>
                <p className="mt-1 text-mist-600">{event.venue.address}</p>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${event.venue.latitude}&mlon=${event.venue.longitude}#map=16/${event.venue.latitude}/${event.venue.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block font-medium text-brand-700 hover:text-brand-800"
                >
                  View on a map
                </a>
              </DetailCard>

              <DetailCard icon={CalendarClock} title="Next available">
                {upcoming[0] ? (
                  <>
                    <p className="font-medium text-ink-900">
                      {formatLongDate(upcoming[0].startsAt, event.timezone)}
                    </p>
                    <p className="mt-1 text-mist-600">
                      {formatTime(upcoming[0].startsAt, event.timezone)} local ·{' '}
                      {formatRelative(upcoming[0].startsAt)}
                    </p>
                    <p className="mt-2 text-mist-600">
                      {upcoming.length} upcoming {upcoming.length === 1 ? 'date' : 'dates'} listed
                    </p>
                  </>
                ) : (
                  <p className="text-mist-600">All upcoming dates are sold out.</p>
                )}
              </DetailCard>

              <DetailCard icon={Clock} title="Duration">
                <p className="font-medium text-ink-900">{formatDuration(event.durationMinutes)}</p>
                <p className="mt-1 text-mist-600">
                  Times are shown in {event.city.name} local time, not your own.
                </p>
              </DetailCard>

              <DetailCard icon={ShieldCheck} title="Cancellation">
                <p className="font-medium text-ink-900">Free up to 24 hours before</p>
                <p className="mt-1 text-mist-600">
                  Cancel from your bookings page and the seats return to inventory immediately.
                </p>
              </DetailCard>
            </section>

            {/* Reviews */}
            <section>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-xl font-semibold text-ink-950">
                  Reviews{' '}
                  {event.reviewCount > 0 && (
                    <span className="text-base font-normal text-mist-500">
                      ({event.reviewCount})
                    </span>
                  )}
                </h2>
                <Rating value={event.rating} count={event.reviewCount} size="md" />
              </div>

              {event.reviews.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-mist-300 px-5 py-8 text-center text-sm text-mist-600">
                  No reviews for this listing yet.
                </p>
              ) : (
                <ul className="mt-5 space-y-4">
                  {event.reviews.map((review) => (
                    <li key={review.id} className="rounded-xl border border-mist-200 bg-white p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                            {review.author
                              .split(' ')
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join('')}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-ink-950">{review.author}</p>
                            <StarRow value={review.rating} />
                          </div>
                        </div>
                        <time
                          dateTime={review.createdAt}
                          className="shrink-0 text-xs text-mist-500"
                        >
                          {formatRelative(review.createdAt)}
                        </time>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-mist-700">{review.comment}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Booking panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <BookingPanel
              slug={event.slug}
              currency={event.currency}
              timezone={event.timezone}
              sessions={event.sessions}
              minAge={event.minAge}
            />
          </aside>
        </div>
      </div>
    </>
  );
}

function DetailCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof MapPin;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-mist-200 bg-white p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-950">
        <Icon className="h-4 w-4 text-brand-600" aria-hidden />
        {title}
      </h3>
      <div className="mt-2.5 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
