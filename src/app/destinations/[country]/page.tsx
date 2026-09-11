import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { listCities, listCountries } from '@/server/services/event-service';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const match = (await listCountries()).find((c) => c.slug === country);
  return {
    title: match ? `Cities in ${match.name}` : 'Destination',
    description: match
      ? `Browse events and activities across ${match.cityCount} cities in ${match.name}.`
      : undefined,
  };
}

export default async function CountryPage({ params }: Props) {
  const { country: countrySlug } = await params;
  const [countries, cities] = await Promise.all([listCountries(), listCities(countrySlug)]);
  const country = countries.find((c) => c.slug === countrySlug);

  if (!country) notFound();

  return (
    <div className="container-page py-12">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-mist-600">
          <li>
            <Link href="/destinations" className="hover:text-brand-700">
              Destinations
            </Link>
          </li>
          <ChevronRight className="h-3.5 w-3.5 text-mist-400" aria-hidden />
          <li className="font-medium text-ink-900" aria-current="page">
            {country.name}
          </li>
        </ol>
      </nav>

      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Step 2</p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
          <span aria-hidden>{country.flagEmoji}</span>
          Which city in {country.name}?
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-mist-600">
          {country.eventCount} things to do across {country.cityCount}{' '}
          {country.cityCount === 1 ? 'city' : 'cities'}. Prices are shown in {country.currency}.
        </p>
      </header>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => (
          <Link
            key={city.id}
            href={`/destinations/${country.slug}/${city.slug}`}
            className="group overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-soft transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-ink-900">
              <img
                src={city.heroImageUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/20 to-transparent" />
              <h2 className="absolute bottom-4 left-5 text-xl font-semibold text-white">
                {city.name}
              </h2>
              <span className="absolute right-4 top-4 rounded-full bg-white/92 px-2.5 py-1 text-[0.6875rem] font-semibold text-ink-900">
                {city.eventCount} listings
              </span>
            </div>

            <div className="p-5">
              <p className="text-sm leading-relaxed text-mist-600">{city.blurb}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                See what’s on
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
