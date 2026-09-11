'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import clsx from 'clsx';
import { CategoryIcon } from '@/components/category-icon';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/field';
import { SORT_OPTIONS } from '@/lib/validation';
import { toDateInputValue } from '@/lib/format';

export interface FilterCategory {
  slug: string;
  name: string;
  icon: string;
  eventCount: number;
}

const SORT_LABELS: Record<(typeof SORT_OPTIONS)[number], string> = {
  recommended: 'Recommended',
  soonest: 'Happening soonest',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  rating: 'Highest rated',
};

/**
 * Discovery filters.
 *
 * All filter state lives in the URL rather than in React state. A filtered view
 * is therefore a real address: shareable, bookmarkable, restored by the back
 * button, and renderable by the server without a client-side fetch. The two
 * exported pieces — the bar and the panel — are separate components purely so
 * the page can place them in different grid areas; both read the same query
 * string, so they stay in step without sharing any React state.
 */

/* -------------------------------------------------------------------------- */
/* Shared URL helpers                                                          */
/* -------------------------------------------------------------------------- */

function useFilterNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const push = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      next.delete('page'); // Any filter change returns to the first page.
      startTransition(() => {
        router.push(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false });
      });
    },
    [params, pathname, router],
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      push((next) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
    },
    [push],
  );

  const clearAll = useCallback(() => {
    startTransition(() => router.push(pathname, { scroll: false }));
  }, [pathname, router]);

  return { params, push, setParam, clearAll, pending, pathname };
}

export function activeFilterCount(params: URLSearchParams): number {
  const categories = (params.get('categories') ?? '').split(',').filter(Boolean).length;
  const others = ['minPrice', 'maxPrice', 'dateFrom', 'dateTo', 'freeOnly'].filter((k) =>
    params.get(k),
  ).length;
  return categories + others;
}

/* -------------------------------------------------------------------------- */
/* Search + sort bar                                                           */
/* -------------------------------------------------------------------------- */

export function EventSearchBar({
  categories,
  currencySymbol,
  resultCount,
}: {
  categories: FilterCategory[];
  currencySymbol: string;
  resultCount: number;
}) {
  const { params, push, setParam, pending } = useFilterNavigation();
  const [term, setTerm] = useState(params.get('q') ?? '');
  const [sheetOpen, setSheetOpen] = useState(false);

  // Debounced search: 350 ms swallows a burst of typing without letting the
  // results feel like they are lagging behind the keyboard.
  useEffect(() => {
    const current = params.get('q') ?? '';
    if (term === current) return;
    const timer = setTimeout(() => {
      push((next) => {
        if (term) next.set('q', term);
        else next.delete('q');
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [term, params, push]);

  // Keep the box in step when the URL changes from elsewhere (back button,
  // "clear all", a link into a pre-filtered view).
  useEffect(() => {
    setTerm(params.get('q') ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get('q')]);

  const count = activeFilterCount(params);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-400"
            aria-hidden
          />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search by name, venue or tag…"
            aria-label="Search events"
            className="h-11 w-full rounded-xl border border-mist-300 bg-white pl-10 pr-3.5 text-[0.9375rem] placeholder:text-mist-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
        </div>

        <Select
          value={params.get('sort') ?? 'recommended'}
          onChange={(e) => setParam('sort', e.target.value)}
          aria-label="Sort results"
          className="!w-auto min-w-[12.5rem]"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {SORT_LABELS[option]}
            </option>
          ))}
        </Select>

        <Button
          variant="secondary"
          onClick={() => setSheetOpen(true)}
          className="lg:hidden"
          aria-expanded={sheetOpen}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filters
          {count > 0 && (
            <span className="ml-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[0.6875rem] font-semibold text-white">
              {count}
            </span>
          )}
        </Button>
      </div>

      <p
        className={clsx('mt-3 text-sm', pending ? 'text-mist-400' : 'text-mist-600')}
        aria-live="polite"
      >
        {pending ? 'Updating…' : `${resultCount} ${resultCount === 1 ? 'result' : 'results'}`}
      </p>

      {sheetOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-panel"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-950">Filters</h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close filters"
                className="grid h-9 w-9 place-items-center rounded-lg text-mist-600 hover:bg-mist-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterFields categories={categories} currencySymbol={currencySymbol} />
            <Button fullWidth className="mt-6" onClick={() => setSheetOpen(false)}>
              Show {resultCount} {resultCount === 1 ? 'result' : 'results'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sidebar panel                                                               */
/* -------------------------------------------------------------------------- */

export function EventFilterPanel({
  categories,
  currencySymbol,
}: {
  categories: FilterCategory[];
  currencySymbol: string;
}) {
  return (
    <div className="sticky top-24 rounded-2xl border border-mist-200 bg-white p-5 shadow-soft">
      <FilterFields categories={categories} currencySymbol={currencySymbol} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Fields (shared by the sidebar and the mobile sheet)                         */
/* -------------------------------------------------------------------------- */

function FilterFields({
  categories,
  currencySymbol,
}: {
  categories: FilterCategory[];
  currencySymbol: string;
}) {
  const { params, push, setParam, clearAll } = useFilterNavigation();

  const selected = useMemo(
    () => new Set((params.get('categories') ?? '').split(',').filter(Boolean)),
    [params],
  );

  function toggleCategory(slug: string) {
    push((next) => {
      const set = new Set(selected);
      if (set.has(slug)) set.delete(slug);
      else set.add(slug);
      if (set.size > 0) next.set('categories', [...set].join(','));
      else next.delete('categories');
    });
  }

  const today = toDateInputValue(new Date());
  const count = activeFilterCount(params);

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-semibold text-ink-950">Category</legend>
        <div className="mt-3 space-y-0.5">
          {categories.map((category) => {
            const checked = selected.has(category.slug);
            return (
              <label
                key={category.slug}
                className={clsx(
                  'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                  checked ? 'bg-brand-50 text-brand-800' : 'text-ink-800 hover:bg-mist-100',
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCategory(category.slug)}
                  className="h-4 w-4 rounded border-mist-300 text-brand-600 focus:ring-brand-500"
                />
                <CategoryIcon
                  name={category.icon}
                  className={clsx('h-4 w-4', checked ? 'text-brand-600' : 'text-mist-400')}
                />
                <span className="flex-1">{category.name}</span>
                <span className="text-xs text-mist-500">{category.eventCount}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="border-t border-mist-200 pt-5">
        <legend className="text-sm font-semibold text-ink-950">When</legend>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs text-mist-600">From</span>
            <input
              type="date"
              min={today}
              value={params.get('dateFrom') ?? ''}
              onChange={(e) => setParam('dateFrom', e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-mist-300 px-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </label>
          <label className="block">
            <span className="text-xs text-mist-600">To</span>
            <input
              type="date"
              min={params.get('dateFrom') ?? today}
              value={params.get('dateTo') ?? ''}
              onChange={(e) => setParam('dateTo', e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-mist-300 px-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="border-t border-mist-200 pt-5">
        <legend className="text-sm font-semibold text-ink-950">Price per person</legend>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs text-mist-600">Min ({currencySymbol})</span>
            <input
              key={`min-${params.get('minPrice') ?? ''}`}
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="0"
              defaultValue={params.get('minPrice') ?? ''}
              onBlur={(e) => setParam('minPrice', e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-mist-300 px-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </label>
          <label className="block">
            <span className="text-xs text-mist-600">Max ({currencySymbol})</span>
            <input
              key={`max-${params.get('maxPrice') ?? ''}`}
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Any"
              defaultValue={params.get('maxPrice') ?? ''}
              onBlur={(e) => setParam('maxPrice', e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-mist-300 px-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </label>
        </div>

        <label className="mt-3 flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-800 hover:bg-mist-100">
          <input
            type="checkbox"
            checked={params.get('freeOnly') === 'true'}
            onChange={(e) => setParam('freeOnly', e.target.checked ? 'true' : '')}
            className="h-4 w-4 rounded border-mist-300 text-brand-600 focus:ring-brand-500"
          />
          Free entry only
        </label>
      </fieldset>

      {count > 0 && (
        <div className="border-t border-mist-200 pt-5">
          <Button variant="secondary" size="sm" fullWidth onClick={clearAll}>
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
