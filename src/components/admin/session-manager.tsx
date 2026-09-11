'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus, Loader2, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/button';
import { Field, Notice, TextInput } from '@/components/ui/field';
import { formatDate, formatTime } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { adminSessionSchema } from '@/lib/validation';

export interface ManagedSession {
  id: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  seatsBooked: number;
  priceOverrideMinor: number | null;
  bookingCount: number;
}

/**
 * Adds and removes the dated occurrences of an event.
 *
 * A session with live bookings cannot be deleted — the API refuses it, and the
 * button is not offered, because deleting it would cascade away somebody's
 * confirmed booking.
 */
export function SessionManager({
  eventId,
  currency,
  timezone,
  sessions,
}: {
  eventId: string;
  currency: string;
  timezone: string;
  sessions: ManagedSession[];
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  async function addSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const override = String(form.get('priceOverride') ?? '').trim();

    const parsed = adminSessionSchema.safeParse({
      startsAt: String(form.get('startsAt') ?? ''),
      capacity: String(form.get('capacity') ?? ''),
      priceOverride: override === '' ? null : override,
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.');
        if (!(key in next)) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/events/${eventId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const body = await response.json();
      if (!response.ok) {
        if (body?.error?.details) setErrors(body.error.details as Record<string, string>);
        setFormError(body?.error?.message ?? 'Could not add that date.');
        return;
      }
      formElement.reset();
      router.refresh();
    } catch {
      setFormError('We could not reach the server.');
    } finally {
      setSaving(false);
    }
  }

  async function removeSession(id: string) {
    setRemoving(id);
    setFormError(null);
    try {
      const response = await fetch(`/api/admin/sessions/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setFormError(body?.error?.message ?? 'Could not remove that date.');
        return;
      }
      router.refresh();
    } catch {
      setFormError('We could not reach the server.');
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="space-y-5">
      {formError && <Notice tone="error">{formError}</Notice>}

      <form onSubmit={addSession} noValidate className="rounded-xl bg-mist-50 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-950">
          <CalendarPlus className="h-4 w-4 text-brand-600" aria-hidden />
          Add a date
        </h3>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
          <Field label="Starts at" required error={errors.startsAt}>
            {({ id, invalid }) => (
              <TextInput id={id} name="startsAt" type="datetime-local" invalid={invalid} />
            )}
          </Field>

          <Field label="Capacity" required error={errors.capacity}>
            {({ id, invalid }) => (
              <TextInput
                id={id}
                name="capacity"
                type="number"
                min="1"
                defaultValue={30}
                invalid={invalid}
              />
            )}
          </Field>

          <Field
            label={`Price override (${currency})`}
            error={errors.priceOverride}
            hint="Leave blank to use the event price."
          >
            {({ id, invalid }) => (
              <TextInput
                id={id}
                name="priceOverride"
                type="number"
                step="0.001"
                min="0"
                placeholder="—"
                invalid={invalid}
              />
            )}
          </Field>

          <Button type="submit" disabled={saving} className="sm:mb-[1.6rem]">
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Add
          </Button>
        </div>

        <p className="mt-3 text-xs text-mist-500">
          The end time is derived from the event duration. Times entered here are interpreted in the
          server’s time zone.
        </p>
      </form>

      <div className="overflow-hidden rounded-xl border border-mist-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[38rem] text-left text-sm">
            <thead className="border-b border-mist-200 bg-mist-50 text-xs uppercase tracking-wide text-mist-500">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold">Date</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Time</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Booked</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Capacity</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Price</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist-200">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-mist-500">
                    No dates yet. An event with no dates cannot be booked.
                  </td>
                </tr>
              ) : (
                sessions.map((session) => {
                  const full = session.seatsBooked >= session.capacity;
                  const past = new Date(session.startsAt).getTime() < Date.now();
                  return (
                    <tr key={session.id} className={clsx(past && 'opacity-55')}>
                      <td className="px-4 py-2.5 font-medium text-ink-900">
                        {formatDate(session.startsAt, timezone)}
                      </td>
                      <td className="px-4 py-2.5 text-mist-700">
                        {formatTime(session.startsAt, timezone)}
                      </td>
                      <td
                        className={clsx(
                          'px-4 py-2.5 text-right tabular-nums',
                          full ? 'font-semibold text-warn-700' : 'text-mist-700',
                        )}
                      >
                        {session.seatsBooked}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-mist-700">
                        {session.capacity}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-mist-700">
                        {session.priceOverrideMinor === null
                          ? '—'
                          : formatMoney(session.priceOverrideMinor, currency)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {session.bookingCount > 0 ? (
                          <span className="text-xs text-mist-500">
                            {session.bookingCount} booking{session.bookingCount === 1 ? '' : 's'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => removeSession(session.id)}
                            disabled={removing === session.id}
                            aria-label="Remove this date"
                            className="rounded-lg p-1.5 text-mist-400 transition-colors hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50"
                          >
                            {removing === session.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                              <Trash2 className="h-4 w-4" aria-hidden />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
