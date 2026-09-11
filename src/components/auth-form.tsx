'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Notice, TextInput } from '@/components/ui/field';
import { loginSchema, registerSchema } from '@/lib/validation';

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === 'sign-up';
  const schema = isSignUp ? registerSchema : loginSchema;
  const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const form = new FormData(event.currentTarget);
    const candidate = isSignUp
      ? {
          fullName: String(form.get('fullName') ?? ''),
          email: String(form.get('email') ?? ''),
          password: String(form.get('password') ?? ''),
          phone: String(form.get('phone') ?? ''),
        }
      : {
          email: String(form.get('email') ?? ''),
          password: String(form.get('password') ?? ''),
        };

    const parsed = schema.safeParse(candidate);
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
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const body = await response.json();

      if (!response.ok) {
        if (body?.error?.details && typeof body.error.details === 'object') {
          setErrors(body.error.details as Record<string, string>);
        }
        setFormError(body?.error?.message ?? 'Something went wrong. Try again.');
        return;
      }

      // Only allow same-origin redirects: an open redirect here would let a
      // phishing link bounce a freshly authenticated user off-site.
      const target = next.startsWith('/') && !next.startsWith('//') ? next : '/';
      router.push(target);
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

      {isSignUp && (
        <Field label="Full name" required error={errors.fullName}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              name="fullName"
              autoComplete="name"
              placeholder="Sara Al-Harbi"
              aria-describedby={describedBy}
              invalid={invalid}
            />
          )}
        </Field>
      )}

      <Field label="E-mail address" required error={errors.email}>
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Field
        label="Password"
        required
        error={errors.password}
        hint={isSignUp ? 'At least 10 characters, including a number or symbol.' : undefined}
      >
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            name="password"
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      {isSignUp && (
        <Field label="Phone number" error={errors.phone} hint="Optional.">
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+965 5000 0000"
              aria-describedby={describedBy}
              invalid={invalid}
            />
          )}
        </Field>
      )}

      <Button type="submit" size="lg" fullWidth disabled={submitting}>
        {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {isSignUp ? 'Create account' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-mist-600">
        {isSignUp ? 'Already have an account? ' : 'New to Eventora? '}
        <Link
          href={`${isSignUp ? '/sign-in' : '/sign-up'}?next=${encodeURIComponent(next)}`}
          className="font-semibold text-brand-700 hover:text-brand-800"
        >
          {isSignUp ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </form>
  );
}
