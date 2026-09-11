import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { listCities, listCountries } from '@/server/services/event-service';
import { DestinationPicker } from '@/components/destination-picker';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Destinations',
  description: 'Choose a country to see the cities Eventora covers.',
};

export default async function DestinationsPage() {
  const [countries, cities] = await Promise.all([listCountries(), listCities()]);

  return (
    <div className="container-page py-12">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Step 1</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
          Where are you going?
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-mist-600">
          Pick a country first — city names repeat around the world, and everything after this point
          is priced in the local currency and scheduled in the local time zone.
        </p>
      </header>

      <div className="mt-8 max-w-4xl">
        <DestinationPicker
          variant="inline"
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

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {countries.map((country) => {
          const countryCities = cities.filter((c) => c.country.slug === country.slug);
          return (
            <Link
              key={country.id}
              href={`/destinations/${country.slug}`}
              className="group overflow-hidden rounded-2xl border border-mist-200 bg-white shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift"
            >
              <div className="relative aspect-[16/8] overflow-hidden bg-ink-900">
                <img
                  src={country.heroImageUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                  <div>
                    <p className="text-2xl leading-none">{country.flagEmoji}</p>
                    <h2 className="mt-1.5 text-lg font-semibold text-white">{country.name}</h2>
                  </div>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[0.6875rem] font-semibold text-white backdrop-blur-sm">
                    {country.currency}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <p className="text-xs text-mist-500">
                  {country.cityCount} {country.cityCount === 1 ? 'city' : 'cities'} ·{' '}
                  {country.eventCount} things to do
                </p>
                <p className="mt-2 text-sm text-ink-800">
                  {countryCities.map((c) => c.name).join(' · ')}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                  Choose a city
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
