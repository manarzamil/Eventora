import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { HeartOff } from 'lucide-react';
import { listFavorites } from '@/server/services/favorite-service';
import { readSession } from '@/server/auth/session';
import { EventCardItem } from '@/components/event-card';
import { ButtonLink } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Favourites', robots: { index: false } };

export default async function FavouritesPage() {
  const session = await readSession();
  if (!session) redirect('/sign-in?next=/favourites');

  const favorites = await listFavorites(session.sub);

  return (
    <div className="container-page py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-950">Favourites</h1>
        <p className="mt-2 text-[0.9375rem] text-mist-600">
          {favorites.length === 0
            ? 'Nothing saved yet.'
            : `${favorites.length} saved ${favorites.length === 1 ? 'listing' : 'listings'} across your destinations.`}
        </p>
      </header>

      {favorites.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-mist-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-mist-100 text-mist-500">
            <HeartOff className="h-6 w-6" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-ink-950">No favourites yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-mist-600">
            Tap the heart on any listing to keep it here — useful when you are comparing a few
            options before committing to a date.
          </p>
          <ButtonLink href="/destinations" className="mt-5">
            Find something to save
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((event) => (
            <EventCardItem key={event.id} event={event} favorited signedIn />
          ))}
        </div>
      )}
    </div>
  );
}
