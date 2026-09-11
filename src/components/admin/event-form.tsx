'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { ZodError } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Notice, Select, TextArea, TextInput } from '@/components/ui/field';
import { adminEventSchema } from '@/lib/validation';

export interface FormOption {
  id: string;
  name: string;
}

export interface FormVenue extends FormOption {
  cityId: string;
}

export interface FormCity extends FormOption {
  currency: string;
}

function collect(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/**
 * Create / edit form for an event.
 *
 * The venue select is derived from the chosen city rather than listing every
 * venue in the database — an event at a venue in another city is not a
 * validation error to report afterwards, it is a state the form should not be
 * able to reach. The API re-checks the pairing regardless.
 */
export function EventForm({
  mode,
  eventId,
  categories,
  cities,
  venues,
  defaults,
}: {
  mode: 'create' | 'edit';
  eventId?: string;
  categories: FormOption[];
  cities: FormCity[];
  venues: FormVenue[];
  defaults?: {
    title: string;
    summary: string;
    description: string;
    categoryId: string;
    cityId: string;
    venueId: string;
    price: number;
    durationMinutes: number;
    minAge: number;
    tags: string[];
    isFeatured: boolean;
    status: string;
  };
}) {
  const router = useRouter();
  const [cityId, setCityId] = useState(defaults?.cityId ?? cities[0]?.id ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cityVenues = useMemo(() => venues.filter((v) => v.cityId === cityId), [venues, cityId]);
  const currency = cities.find((c) => c.id === cityId)?.currency ?? '';

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const form = new FormData(event.currentTarget);
    const parsed = adminEventSchema.safeParse({
      title: String(form.get('title') ?? ''),
      summary: String(form.get('summary') ?? ''),
      description: String(form.get('description') ?? ''),
      categoryId: String(form.get('categoryId') ?? ''),
      cityId: String(form.get('cityId') ?? ''),
      venueId: String(form.get('venueId') ?? ''),
      price: String(form.get('price') ?? '0'),
      durationMinutes: String(form.get('durationMinutes') ?? '60'),
      minAge: String(form.get('minAge') ?? '0'),
      tags: String(form.get('tags') ?? ''),
      isFeatured: form.get('isFeatured') === 'on',
      status: String(form.get('status') ?? 'DRAFT'),
    });

    if (!parsed.success) {
      setErrors(collect(parsed.error));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        mode === 'create' ? '/api/admin/events' : `/api/admin/events/${eventId}`,
        {
          method: mode === 'create' ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        },
      );
      const body = await response.json();

      if (!response.ok) {
        if (body?.error?.details) setErrors(body.error.details as Record<string, string>);
        setFormError(body?.error?.message ?? 'Could not save the event.');
        return;
      }

      router.push(`/admin/events/${body.data.id}`);
      router.refresh();
    } catch {
      setFormError('We could not reach the server. Try again in a moment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {formError && <Notice tone="error">{formError}</Notice>}

      <div className="rounded-2xl border border-mist-200 bg-white p-6">
        <h2 className="text-base font-semibold text-ink-950">Listing</h2>
        <div className="mt-5 space-y-5">
          <Field label="Title" required error={errors.title}>
            {({ id, invalid }) => (
              <TextInput id={id} name="title" defaultValue={defaults?.title} invalid={invalid} />
            )}
          </Field>

          <Field
            label="Summary"
            required
            error={errors.summary}
            hint="One or two sentences. This is what appears on the card in search results."
          >
            {({ id, invalid }) => (
              <TextArea
                id={id}
                name="summary"
                rows={2}
                defaultValue={defaults?.summary}
                invalid={invalid}
              />
            )}
          </Field>

          <Field label="Full description" required error={errors.description}>
            {({ id, invalid }) => (
              <TextArea
                id={id}
                name="description"
                rows={7}
                defaultValue={defaults?.description}
                invalid={invalid}
              />
            )}
          </Field>

          <Field
            label="Tags"
            error={errors.tags}
            hint="Comma separated — these are searchable and shown on the detail page."
          >
            {({ id, invalid }) => (
              <TextInput
                id={id}
                name="tags"
                placeholder="sunset, boat, family friendly"
                defaultValue={defaults?.tags.join(', ')}
                invalid={invalid}
              />
            )}
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-mist-200 bg-white p-6">
        <h2 className="text-base font-semibold text-ink-950">Placement</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Category" required error={errors.categoryId}>
            {({ id, invalid }) => (
              <Select id={id} name="categoryId" defaultValue={defaults?.categoryId} invalid={invalid}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="City" required error={errors.cityId}>
            {({ id, invalid }) => (
              <Select
                id={id}
                name="cityId"
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                invalid={invalid}
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            label="Venue"
            required
            error={errors.venueId}
            className="sm:col-span-2"
            hint={
              cityVenues.length === 0
                ? 'This city has no venues yet — add one under Destinations first.'
                : undefined
            }
          >
            {({ id, invalid }) => (
              <Select
                id={id}
                name="venueId"
                defaultValue={defaults?.venueId}
                disabled={cityVenues.length === 0}
                invalid={invalid}
              >
                {cityVenues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-mist-200 bg-white p-6">
        <h2 className="text-base font-semibold text-ink-950">Pricing and rules</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <Field
            label={`Price${currency ? ` (${currency})` : ''}`}
            required
            error={errors.price}
            hint="0 for free entry."
          >
            {({ id, invalid }) => (
              <TextInput
                id={id}
                name="price"
                type="number"
                step="0.001"
                min="0"
                defaultValue={defaults?.price ?? 0}
                invalid={invalid}
              />
            )}
          </Field>

          <Field label="Duration (minutes)" required error={errors.durationMinutes}>
            {({ id, invalid }) => (
              <TextInput
                id={id}
                name="durationMinutes"
                type="number"
                min="15"
                defaultValue={defaults?.durationMinutes ?? 90}
                invalid={invalid}
              />
            )}
          </Field>

          <Field label="Minimum age" error={errors.minAge} hint="0 for all ages.">
            {({ id, invalid }) => (
              <TextInput
                id={id}
                name="minAge"
                type="number"
                min="0"
                max="21"
                defaultValue={defaults?.minAge ?? 0}
                invalid={invalid}
              />
            )}
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-mist-200 bg-white p-6">
        <h2 className="text-base font-semibold text-ink-950">Visibility</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Status" required error={errors.status}>
            {({ id, invalid }) => (
              <Select id={id} name="status" defaultValue={defaults?.status ?? 'DRAFT'} invalid={invalid}>
                <option value="DRAFT">Draft — hidden from the site</option>
                <option value="PUBLISHED">Published — live and bookable</option>
                <option value="ARCHIVED">Archived — hidden, history kept</option>
              </Select>
            )}
          </Field>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-mist-50 p-4">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={defaults?.isFeatured}
              className="mt-0.5 h-4 w-4 rounded border-mist-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              <span className="block text-sm font-medium text-ink-900">Feature this event</span>
              <span className="mt-0.5 block text-xs text-mist-600">
                Featured events are promoted on the homepage and sorted first under “Recommended”.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" disabled={saving || cityVenues.length === 0}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {mode === 'create' ? 'Create event' : 'Save changes'}
        </Button>
        <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
