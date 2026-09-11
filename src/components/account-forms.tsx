'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Notice, TextInput } from '@/components/ui/field';
import type { ZodError } from 'zod';
import { changePasswordSchema, updateProfileSchema } from '@/lib/validation';

type Errors = Record<string, string>;

/** Flattens a ZodError into `{ field: "first message" }` for inline display. */
function collectIssues(error: ZodError): Errors {
  const out: Errors = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

export function ProfileForm({
  defaults,
}: {
  defaults: { fullName: string; email: string; phone: string };
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setStatus(null);

    const form = new FormData(event.currentTarget);
    const parsed = updateProfileSchema.safeParse({
      fullName: String(form.get('fullName') ?? ''),
      phone: String(form.get('phone') ?? ''),
    });

    if (!parsed.success) {
      setErrors(collectIssues(parsed.error));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const body = await response.json();
      if (!response.ok) {
        if (body?.error?.details) setErrors(body.error.details as Errors);
        setStatus({ tone: 'error', text: body?.error?.message ?? 'Could not save your details.' });
        return;
      }
      setStatus({ tone: 'success', text: 'Your details have been updated.' });
      router.refresh();
    } catch {
      setStatus({ tone: 'error', text: 'We could not reach the server. Try again in a moment.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {status && <Notice tone={status.tone}>{status.text}</Notice>}

      <Field label="Full name" required error={errors.fullName}>
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            name="fullName"
            defaultValue={defaults.fullName}
            autoComplete="name"
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Field
        label="E-mail address"
        hint="Changing the address on an account is not implemented in this build — see Limitations in the README."
      >
        {({ id }) => <TextInput id={id} value={defaults.email} disabled readOnly />}
      </Field>

      <Field label="Phone number" error={errors.phone}>
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            name="phone"
            type="tel"
            defaultValue={defaults.phone}
            autoComplete="tel"
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Save changes
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setStatus(null);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const parsed = changePasswordSchema.safeParse({
      currentPassword: String(form.get('currentPassword') ?? ''),
      newPassword: String(form.get('newPassword') ?? ''),
      confirmPassword: String(form.get('confirmPassword') ?? ''),
    });

    if (!parsed.success) {
      setErrors(collectIssues(parsed.error));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const body = await response.json();
      if (!response.ok) {
        if (body?.error?.details) setErrors(body.error.details as Errors);
        setStatus({ tone: 'error', text: body?.error?.message ?? 'Could not change your password.' });
        return;
      }
      setStatus({ tone: 'success', text: 'Your password has been changed.' });
      formElement.reset();
    } catch {
      setStatus({ tone: 'error', text: 'We could not reach the server. Try again in a moment.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {status && <Notice tone={status.tone}>{status.text}</Notice>}

      <Field label="Current password" required error={errors.currentPassword}>
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Field
        label="New password"
        required
        error={errors.newPassword}
        hint="At least 10 characters, including a number or symbol."
      >
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            name="newPassword"
            type="password"
            autoComplete="new-password"
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Field label="Confirm new password" required error={errors.confirmPassword}>
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Change password
      </Button>
    </form>
  );
}
