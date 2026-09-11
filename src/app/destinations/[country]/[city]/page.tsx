import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, SearchX } from 'lucide-react';
import { EventCardItem } from '@/components/event-card';
import { EventFilterPanel, EventSearchBar } from '@/components/event-filters';
import { Pagination } from '@/components/pagination';
import { ButtonLink } from '@/components/ui/button';
import { getCityBySlug, listCategories, listEvents } from '@/server/services/event-service';
import { getFavoriteIds } from '@/server/services/favorite-service';
import { readSession } from '@/server/auth/session';
import { eventQuerySchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ country: string; city: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, city } = await params;
  try {
    const match = await getCityBySlug(country, city);
    return {
      title: `Things to do in ${match.name}`,
      description: match.blurb,
    };
  } catch {
    return { title: 'City not found' };
  }
}

/** The narrow-symbol currency prefix shown next to the price inputs. */
function currencySymbol(currency: string): string {
  const parts = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).formatToParts(0);
  return parts.find((p) => p.type === 'currency')?.value ?? currency;
}

export default async function CityDiscoveryPage({ params, searchParams }: Props) {
  const { country: countrySlug, city: citySlug } = await params;
  const rawSearch = await searchParams;

  let city;
  try {
    city = await getCityBySlug(countrySlug, citySlug);
  } catch {
    notFound();
  }

  // Bad query strings degrade to the default view rather than throwing a 500 —
  // people edit URLs, and a hand-typed `?page=abc` should not be a crash.
  const parsed = eventQuerySchema.safeParse({ ...rawSearch, city: citySlug, country: countrySlug });
  const query = parsed.success
    ? parsed.data
    : eventQuerySchema.parse({ city: citySlug, country: countrySlug });

  const session = await readSession();
  const [results, categories, favorites] = await Promise.all([
    listEvents(query),
    listCategories(citySlug),
    session ? getFavoriteIds(session.sub) : Promise.resolve(new Set<string>()),
  ]);

  const basePath = `/destinations/${countrySlug}/${citySlug}`;
  const filterCategories = categories
    .filter((c) => c.eventCount > 0)
    .map((c) => ({ slug: c.slug, name: c.name, icon: c.icon, eventCount: c.eventCount }));

  return (
    <>
      {/* City banner */}
      <section className="relative overflow-hidden bg-ink-950">
        <img
          src={city.heroImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/40" />

        <div className="container-page relative py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-200">
              <li>
                <Link href="/destinations" className="hover:text-white">
                  Destinations
                </Link>
              </li>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
              <li>
                <Link href={`/destinations/${countrySlug}`} className="hover:text-white">
                  {city.country.name}
                </Link>
              </li>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
              <li className="font-medium text-white" aria-current="page">
                {city.name}
              </li>
            </ol>
          </nav>

          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Things to do in {city.name}
          </h1>
          <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-100">{city.blurb}</p>
          <p className="mt-4 text-xs text-ink-300">
            {city.eventCount} listings · prices in {city.country.currency} · times shown in{' '}
            {city.timezone.replace('_', ' ')}
          </p>
        </div>
      </section>

      {/* Results */}
      <div className="container-page py-8">
        <EventSearchBar
          categories={filterCategories}
          currencySymbol={currencySymbol(city.country.currency)}
          resultCount={results.total}
        />

        <div className="mt-6 grid gap-8 lg:grid-cols-[16.5rem_1fr]">
          <aside className="hidden lg:block">
            <EventFilterPanel
              categories={filterCategories}
              currencySymbol={currencySymbol(city.country.currency)}
            />
          </aside>

          <div>
            {results.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-mist-300 bg-white px-6 py-16 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-mist-100 text-mist-500">
                  <SearchX className="h-6 w-6" aria-hidden />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-ink-950">
                  Nothing matches those filters
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mist-600">
                  Try widening the date window, removing a category, or clearing the price range.
                  Everything in {city.name} is one click away.
                </p>
                <ButtonLink href={basePath} variant="secondary" className="mt-5">
                  Show everything in {city.name}
                </ButtonLink>
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {results.items.map((event) => (
                    <EventCardItem
                      key={event.id}
                      event={event}
                      favorited={favorites.has(event.id)}
                      signedIn={Boolean(session)}
                      timezone={city.timezone}
                    />
                  ))}
                </div>

                <Pagination
                  page={results.page}
                  pageCount={results.pageCount}
                  basePath={basePath}
                  searchParams={rawSearch}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
