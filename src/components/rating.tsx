import { Star } from 'lucide-react';
import clsx from 'clsx';

export function Rating({
  value,
  count,
  size = 'sm',
  className,
}: {
  value: number | null;
  count?: number;
  size?: 'sm' | 'md';
  className?: string;
}) {
  if (value === null) {
    return (
      <span className={clsx('text-xs text-mist-500', className)}>New — no reviews yet</span>
    );
  }

  const dim = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <span
      className={clsx('inline-flex items-center gap-1', className)}
      aria-label={`Rated ${value} out of 5${count ? ` from ${count} reviews` : ''}`}
    >
      <Star className={clsx(dim, 'fill-warn-500 text-warn-500')} aria-hidden />
      <span
        className={clsx('font-semibold text-ink-900', size === 'sm' ? 'text-xs' : 'text-sm')}
      >
        {value.toFixed(1)}
      </span>
      {count !== undefined && count > 0 && (
        <span className={clsx('text-mist-500', size === 'sm' ? 'text-xs' : 'text-sm')}>
          ({count})
        </span>
      )}
    </span>
  );
}

/** Five discrete stars, used inside the review list. */
export function StarRow({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={clsx(
            'h-3.5 w-3.5',
            n <= value ? 'fill-warn-500 text-warn-500' : 'text-mist-300',
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}
