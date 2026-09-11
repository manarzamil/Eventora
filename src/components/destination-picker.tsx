'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Globe2, MapPin, Search } from 'lucide-react';
import clsx from 'clsx';
import { Select } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

export interface PickerCountry {
  slug: string;
  name: string;
  flagEmoji: string;
  cityCount: number;
}

export interface PickerCity {
  slug: string;
  name: string;
  countrySlug: string;
  eventCount: number;
}

/**
 * The country → city → search entry point.
 *
 * The city select stays disabled until a country is chosen, which is the whole
 * point of the journey: a city name alone is ambiguous, and forcing the country
 * first removes that ambiguity before any results are fetched. Choosing a
 * country immediately narrows the city list client-side, so the second step
 * costs no round trip.
 */
export function DestinationPicker({
  countries,
  cities,
  variant = 'hero',
  initialCountry,
  initialCity,
}: {
  countries: PickerCountry[];
  cities: PickerCity[];
  variant?: 'hero' | 'inline';
  initialCountry?: string;
  initialCity?: string;
}) {
  const router = useRouter();
  const [country, setCountry] = useState(initialCountry ?? '');
  const [city, setCity] = useState(initialCity ?? '');
  const [query, setQuery] = useState('');

  const availableCities = useMemo(
    () => cities.filter((c) => c.countrySlug === country),
    [cities, country],
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!country) return;
    const target = city
      ? `/destinations/${country}/${city}${query ? `?q=${encodeURIComponent(query)}` : ''}`
      : `/destinations/${country}`;
    router.push(target);
  }

  const dark = variant === 'hero';

  return (
    <form
      onSubmit={submit}
      className={clsx(
        'w-full',
        dark
          ? 'rounded-2xl border border-white/15 bg-white/[0.07] p-2 backdrop-blur-xl shadow-panel sm:rounded-[1.35rem]'
          : 'surface-panel p-3',
      )}
    >
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1.2fr_auto]">
        <PickerField label="Country" icon={Globe2} dark={dark}>
          <Select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setCity('');
            }}
            aria-label="Country"
            className={clsx(
              'h-10 !border-0 !bg-transparent px-0 text-[0.9375rem] font-medium shadow-none focus:ring-0',
              dark && '!text-white [&>option]:!text-ink-950',
            )}
          >
            <option value="">Choose a country</option>
            {countries.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.flagEmoji} {c.name}
              </option>
            ))}
          </Select>
        </PickerField>

        <PickerField label="City" icon={MapPin} dark={dark}>
          <Select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={!country}
            aria-label="City"
            className={clsx(
              'h-10 !border-0 !bg-transparent px-0 text-[0.9375rem] font-medium shadow-none focus:ring-0',
              dark && '!text-white [&>option]:!text-ink-950 disabled:!text-white/40',
            )}
          >
            <option value="">{country ? 'All cities' : 'Pick a country first'}</option>
            {availableCities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} ({c.eventCount})
              </option>
            ))}
          </Select>
        </PickerField>

        <PickerField label="What are you looking for?" icon={Search} dark={dark}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Concerts, diving, museums…"
            aria-label="Search events"
            className={clsx(
              'h-10 w-full border-0 bg-transparent p-0 text-[0.9375rem] font-medium focus:outline-none',
              dark
                ? 'text-white placeholder:text-white/40'
                : 'text-ink-950 placeholder:text-mist-400',
            )}
          />
        </PickerField>

        <Button
          type="submit"
          size="lg"
          disabled={!country}
          className="h-auto min-h-[3.25rem] sm:px-6"
        >
          Explore
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </form>
  );
}

function PickerField({
  label,
  icon: Icon,
  dark,
  children,
}: {
  label: string;
  icon: typeof Globe2;
  dark: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        'rounded-xl px-3.5 py-2 transition-colors',
        dark ? 'bg-white/[0.06] hover:bg-white/[0.1]' : 'bg-mist-100 hover:bg-mist-200/70',
      )}
    >
      <span
        className={clsx(
          'flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider',
          dark ? 'text-white/55' : 'text-mist-500',
        )}
      >
        <Icon className="h-3 w-3" aria-hidden />
        {label}
      </span>
      {children}
    </div>
  );
}
