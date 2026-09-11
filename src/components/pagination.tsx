import Link from 'next/link';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Server-rendered pagination: every control is a real `<a href>` carrying the
 * full query string, so pages are crawlable, middle-clickable and work with
 * JavaScript disabled.
 */
export function Pagination({
  page,
  pageCount,
  basePath,
  searchParams,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (pageCount <= 1) return null;

  function href(target: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === 'page' || value === undefined) continue;
      params.set(key, Array.isArray(value) ? value.join(',') : value);
    }
    if (target > 1) params.set('page', String(target));
    return `${basePath}${params.size ? `?${params}` : ''}`;
  }

  // Windowed page numbers with ellipses, so 40 pages does not render 40 links.
  const window: (number | 'gap')[] = [];
  for (let n = 1; n <= pageCount; n += 1) {
    if (n === 1 || n === pageCount || Math.abs(n - page) <= 1) window.push(n);
    else if (window[window.length - 1] !== 'gap') window.push('gap');
  }

  const cell =
    'grid h-10 min-w-10 place-items-center rounded-lg px-3 text-sm font-medium transition-colors';

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={href(page - 1)} className={clsx(cell, 'text-ink-800 hover:bg-mist-200')} rel="prev">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          <span className="sr-only">Previous page</span>
        </Link>
      ) : (
        <span className={clsx(cell, 'text-mist-300')} aria-disabled>
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </span>
      )}

      {window.map((entry, i) =>
        entry === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-mist-400">
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={href(entry)}
            aria-current={entry === page ? 'page' : undefined}
            className={clsx(
              cell,
              entry === page
                ? 'bg-brand-600 text-white'
                : 'text-ink-800 hover:bg-mist-200',
            )}
          >
            {entry}
          </Link>
        ),
      )}

      {page < pageCount ? (
        <Link href={href(page + 1)} className={clsx(cell, 'text-ink-800 hover:bg-mist-200')} rel="next">
          <ChevronRight className="h-4 w-4" aria-hidden />
          <span className="sr-only">Next page</span>
        </Link>
      ) : (
        <span className={clsx(cell, 'text-mist-300')} aria-disabled>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}
