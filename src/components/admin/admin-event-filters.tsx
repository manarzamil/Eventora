'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Search } from 'lucide-react';
import { Select } from '@/components/ui/field';

export function AdminEventFilters({ cities }: { cities: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [term, setTerm] = useState(params.get('q') ?? '');

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    startTransition(() => router.push(`${pathname}${next.size ? `?${next}` : ''}`));
  }

  useEffect(() => {
    const current = params.get('q') ?? '';
    if (term === current) return;
    const timer = setTimeout(() => set('q', term), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[14rem] flex-1">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-400"
          aria-hidden
        />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search events by title…"
          aria-label="Search events"
          className="h-11 w-full rounded-xl border border-mist-300 bg-white pl-10 pr-3.5 text-sm placeholder:text-mist-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
      </div>

      <Select
        value={params.get('status') ?? ''}
        onChange={(e) => set('status', e.target.value)}
        aria-label="Filter by status"
        className="!w-auto min-w-[10rem]"
      >
        <option value="">Any status</option>
        <option value="PUBLISHED">Published</option>
        <option value="DRAFT">Draft</option>
        <option value="ARCHIVED">Archived</option>
      </Select>

      <Select
        value={params.get('cityId') ?? ''}
        onChange={(e) => set('cityId', e.target.value)}
        aria-label="Filter by city"
        className="!w-auto min-w-[11rem]"
      >
        <option value="">Any city</option>
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
