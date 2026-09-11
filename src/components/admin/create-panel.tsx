'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Loader2, Plus } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/field';

/**
 * A collapsible "add a record" panel that POSTs its form to an admin endpoint.
 *
 * The fields are supplied by the caller as children — this component owns only
 * the disclosure, submission, error surface and refresh, so every taxonomy
 * screen gets identical behaviour without repeating the plumbing.
 */
export function CreatePanel({
  title,
  description,
  endpoint,
  submitLabel,
  fields,
  transform,
}: {
  title: string;
  description: string;
  endpoint: string;
  submitLabel: string;
  fields: (errors: Record<string, string>) => ReactNode;
  transform?: (form: FormData) => Record<string, unknown>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);
    setSaving(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = transform
      ? transform(form)
      : Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json();

      if (!response.ok) {
        if (body?.error?.details) setErrors(body.error.details as Record<string, string>);
        setFormError(body?.error?.message ?? 'Could not save that.');
        return;
      }

      formElement.reset();
      setOpen(false);
      router.refresh();
    } catch {
      setFormError('We could not reach the server.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-mist-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span>
          <span className="flex items-center gap-2 text-sm font-semibold text-ink-950">
            <Plus className="h-4 w-4 text-brand-600" aria-hidden />
            {title}
          </span>
          <span className="mt-0.5 block text-xs text-mist-500">{description}</span>
        </span>
        <ChevronDown
          className={clsx('h-4 w-4 shrink-0 text-mist-400 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open && (
        <form onSubmit={onSubmit} noValidate className="border-t border-mist-200 p-5">
          {formError && (
            <div className="mb-4">
              <Notice tone="error">{formError}</Notice>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">{fields(errors)}</div>

          <Button type="submit" className="mt-5" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {submitLabel}
          </Button>
        </form>
      )}
    </div>
  );
}
