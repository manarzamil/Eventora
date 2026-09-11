'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Notice, TextArea, TextInput } from '@/components/ui/field';
import { createBookingSchema } from '@/lib/validation';

export function CheckoutForm({
  sessionId,
  quantity,
  defaults,
}: {
  sessionId: string;
  quantity: number;
  defaults: { name: string; email: string; phone: string };
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setErrors({});
    setFormError(null);

    const form = new FormData(formEvent.currentTarget);
    const candidate = {
      sessionId,
      quantity,
      guestName: String(form.get('guestName') ?? ''),
      guestEmail: String(form.get('guestEmail') ?? ''),
      guestPhone: String(form.get('guestPhone') ?? ''),
      notes: String(form.get('notes') ?? ''),
    };

    // Client-side pass with the *same* schema the API uses, so obvious mistakes
    // are caught without a round trip. The server validates again regardless.
    const parsed = createBookingSchema.safeParse(candidate);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.');
        if (!(key in next)) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const body = await response.json();

      if (!response.ok) {
        if (body?.error?.details && typeof body.error.details === 'object') {
          setErrors(body.error.details as Record<string, string>);
        }
        setFormError(body?.error?.message ?? 'We could not complete that booking.');
        return;
      }

      router.push(`/bookings/${body.data.reference}?new=1`);
      router.refresh();
    } catch {
      setFormError('We could not reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <Notice tone="error">{formError}</Notice>}

      <Field label="Lead guest name" required error={errors.guestName}>
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            name="guestName"
            defaultValue={defaults.name}
            autoComplete="name"
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Field
        label="E-mail for the confirmation"
        required
        error={errors.guestEmail}
        hint="Your booking reference is shown on screen; this is where a real deployment would send it."
      >
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            name="guestEmail"
            type="email"
            defaultValue={defaults.email}
            autoComplete="email"
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Field label="Phone number" error={errors.guestPhone} hint="Optional — used only if plans change.">
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            name="guestPhone"
            type="tel"
            defaultValue={defaults.phone}
            autoComplete="tel"
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Field
        label="Anything the organiser should know?"
        error={errors.notes}
        hint="Accessibility needs, dietary requirements, a birthday — optional."
      >
        {({ id, describedBy, invalid }) => (
          <TextArea id={id} name="notes" aria-describedby={describedBy} invalid={invalid} />
        )}
      </Field>

      <Button type="submit" size="lg" fullWidth disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Confirming…
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" aria-hidden />
            Confirm booking
          </>
        )}
      </Button>

      <p className="text-center text-xs leading-relaxed text-mist-500">
        No payment is taken. Eventora is an academic project and is not connected to any payment
        processor or ticketing provider.
      </p>
    </form>
  );
}
