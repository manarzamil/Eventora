import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EventForm } from '@/components/admin/event-form';
import { listVenues } from '@/server/services/admin-service';
import { listCategories, listCities } from '@/server/services/event-service';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'New event' };

export default async function NewEventPage() {
  const [categories, cities, venues] = await Promise.all([
    listCategories(),
    listCities(),
    listVenues(),
  ]);

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/events"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-mist-600 transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to events
      </Link>

      <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink-950">Create an event</h2>
      <p className="mt-1 text-sm text-mist-600">
        The listing is created first; you add its dates on the next screen. New events start as
        drafts unless you publish them here.
      </p>

      <div className="mt-6">
        <EventForm
          mode="create"
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          cities={cities.map((c) => ({
            id: c.id,
            name: `${c.name} — ${c.country.name}`,
            currency: c.country.currency,
          }))}
          venues={venues.map((v) => ({ id: v.id, name: v.name, cityId: v.cityId }))}
        />
      </div>
    </div>
  );
}
