'use client';

import { Heart } from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

/**
 * Optimistic favourite toggle.
 *
 * The heart fills the instant it is pressed and reverts only if the request
 * fails, because waiting ~120 ms for a round trip on a purely cosmetic toggle
 * makes the whole grid feel unresponsive. A signed-out visitor is routed to
 * sign-in with a `next` parameter so they land back on the same page.
 */
export function FavoriteButton({
  eventId,
  initial,
  signedIn,
  size = 'md',
  className,
}: {
  eventId: string;
  initial: boolean;
  signedIn: boolean;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const [favorited, setFavorited] = useState(initial);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!signedIn) {
      const next = typeof window === 'undefined' ? '/' : window.location.pathname;
      router.push(`/sign-in?next=${encodeURIComponent(next)}`);
      return;
    }

    const optimistic = !favorited;
    setFavorited(optimistic);

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      if (!response.ok) throw new Error('request failed');
      const body = (await response.json()) as { data: { favorited: boolean } };
      setFavorited(body.data.favorited);
      startTransition(() => router.refresh());
    } catch {
      setFavorited(!optimistic);
    }
  }

  const dim = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={favorited}
      aria-label={favorited ? 'Remove from favourites' : 'Save to favourites'}
      className={clsx(
        dim,
        'grid place-items-center rounded-full border backdrop-blur-md transition-all duration-150',
        'active:scale-90',
        favorited
          ? 'border-danger-500/30 bg-white text-danger-600'
          : 'border-white/40 bg-ink-950/35 text-white hover:bg-ink-950/55',
        className,
      )}
    >
      <Heart
        className={clsx(size === 'sm' ? 'h-4 w-4' : 'h-[1.05rem] w-[1.05rem]', favorited && 'fill-danger-600')}
        strokeWidth={2}
        aria-hidden
      />
    </button>
  );
}
