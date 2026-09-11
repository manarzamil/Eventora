'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Search } from 'lucide-react';

export function AdminUserSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [term, setTerm] = useState(params.get('q') ?? '');

  useEffect(() => {
    const current = params.get('q') ?? '';
    if (term === current) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (term) next.set('q', term);
      else next.delete('q');
      startTransition(() => router.push(`${pathname}${next.size ? `?${next}` : ''}`));
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  return (
    <div className="relative max-w-md">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-400"
        aria-hidden
      />
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search by name or e-mail…"
        aria-label="Search users"
        className="h-11 w-full rounded-xl border border-mist-300 bg-white pl-10 pr-3.5 text-sm placeholder:text-mist-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
      />
    </div>
  );
}
