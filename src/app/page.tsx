import Link from 'next/link';
import { ArrowRight, CalendarCheck, MapPinned, ShieldCheck, Ticket } from 'lucide-react';
import { DestinationPicker } from '@/components/destination-picker';
import { EventCardItem } from '@/components/event-card';
import { CategoryIcon } from '@/components/category-icon';
import { ButtonLink } from '@/components/ui/button';
import {
  getPlatformCounts,
  listCategories,
  listCities,
  listCountries,
  listEvents,
} from '@/server/services/event-service';
import { getFavoriteIds } from '@/server/services/favorite-service';
import { readSession } from '@/server/auth/session';
import type { EventQuery } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await readSession();

  // One parallel fan-out rather than five sequential awaits — the page is
  // server-rendered, so every millisecond here is time-to-first-byte.
  const [countries, cities, categories, counts, featured, favorites] = await Promise.all([
    listCountries(),
    listCities(),
    listCategories(),
    getPlatformCounts(),
    listEvents({ sort: 'recommended', page: 1, perPage: 8 } as EventQuery),
    session ? getFavoriteIds(session.sub) : Promise.resolve(new Set<string>()),
  ]);

  const topCities = [...cities].sort((a, b) => b.eventCount - a.eventCount).slice(0, 6);

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="surface-deep relative -mt-16 overflow-hidden pt-16">
        <div className="container-page relative py-20 sm:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-1.5 text-xs font-medium text-ink-100 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-azure-400" aria-hidden />
              {counts.events} experiences across {counts.cities} cities
            </span>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-5xl lg:text-[3.75rem]">
              Everything happening in your city,{' '}
              <span className="text-gradient-brand">in one place.</span>
            </h1>

            <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-ink-100">
              Pick a country, pick a city, and see what is actually on — concerts, desert nights,
              reef dives, museum tours, workshops and the local things you would otherwise only hear
              about from someone who lives there.
            </p>
          </div>

          <div className="mt-10 max-w-5xl">
            <DestinationPicker
              countries={countries.map((c) => ({
                slug: c.slug,
                name: c.name,
                flagEmoji: c.flagEmoji,
                cityCount: c.cityCount,
              }))}
              cities={cities.map((c) => ({
                slug: c.slug,
                name: c.name,
                countrySlug: c.country.slug,
                eventCount: c.eventCount,
              }))}
            />
          </div>

          <dl className="mt-12 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/10 pt-8">
            {[
              { label: 'Countries', value: counts.countries },
              { label: 'Cities', value: counts.cities },
              { label: 'Things to do', value: counts.events },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-xs uppercase tracking-wider text-ink-300">{stat.label}</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-white">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------------------------------------------------------- categories */}
      <section className="container-page py-16">
        <SectionHeading
          eyebrow="Browse by type"
          title="What kind of evening are you after?"
          action={{ href: '/categories', label: 'All categories' }}
        />

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <CategoryIcon name={category.icon} className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink-950">{category.name}</span>
                <span className="mt-0.5 block text-xs text-mist-500">
                  {category.eventCount} listings
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ featured */}
      <section className="bg-white py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Handpicked"
            title="Featured this season"
            description="A cross-section of what the platform covers, from a mirrored concert hall in the Saudi desert to a supervised winter swim on Hampstead Heath."
          />

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.items.slice(0, 8).map((event) => (
              <EventCardItem
                key={event.id}
                event={event}
                favorited={favorites.has(event.id)}
                signedIn={Boolean(session)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- cities */}
      <section className="container-page py-16">
        <SectionHeading
          eyebrow="Destinations"
          title="Cities with the most on right now"
          action={{ href: '/destinations', label: 'All destinations' }}
        />

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {topCities.map((city) => (
            <Link
              key={city.id}
              href={`/destinations/${city.country.slug}/${city.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-mist-200 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="aspect-[16/10] overflow-hidden bg-ink-900">
                <img
                  src={city.heroImageUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/45 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-xs font-medium text-ink-200">
                  {city.country.flagEmoji} {city.country.name}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-white">{city.name}</h3>
                <p className="mt-1.5 line-clamp-2 text-[0.8125rem] leading-relaxed text-ink-100">
                  {city.blurb}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                  {city.eventCount} things to do
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- how it works */}
      <section className="bg-white py-16">
        <div className="container-page">
          <SectionHeading eyebrow="How it works" title="Four steps, no account needed to browse" />

          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: MapPinned,
                title: 'Choose where',
                body: 'Country first, then city. Everything after that is scoped to that one place, in its own currency and time zone.',
              },
              {
                icon: CalendarCheck,
                title: 'Filter to what fits',
                body: 'Category, date window, price range and free-text search all narrow the same result set, and the URL keeps your filters shareable.',
              },
              {
                icon: Ticket,
                title: 'Pick a date and book',
                body: 'Each listing carries its own dated sessions with live remaining capacity, so you never book a slot that has already filled.',
              },
              {
                icon: ShieldCheck,
                title: 'Manage it afterwards',
                body: 'Your bookings, references and cancellations all live in one account area, with a 24-hour cancellation window.',
              },
            ].map((step, i) => (
              <li key={step.title} className="relative rounded-2xl bg-mist-50 p-6">
                <span className="absolute right-5 top-4 text-4xl font-semibold text-mist-200">
                  {i + 1}
                </span>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white">
                  <step.icon className="h-5 w-5" strokeWidth={1.9} aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist-600">{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 overflow-hidden rounded-[1.25rem] border border-mist-200">
            <div className="surface-deep flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
              <div className="max-w-xl">
                <h3 className="text-2xl font-semibold text-white">Ready to look around?</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-100">
                  Start with a destination, or jump straight into a category if you already know
                  what kind of thing you are after.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/destinations" size="lg">
                  Choose a destination
                </ButtonLink>
                <ButtonLink href="/categories" size="lg" variant="inverse">
                  Browse categories
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-mist-600">{description}</p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
        >
          {action.label}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}
