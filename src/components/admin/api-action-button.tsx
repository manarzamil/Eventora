'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * A button that calls the admin API and refreshes the server-rendered page.
 *
 * Destructive actions require a second click rather than a `window.confirm`,
 * so the confirmation is styled, keyboard-navigable and states the actual
 * consequence.
 */
export function ApiActionButton({
  endpoint,
  method = 'POST',
  body,
  label,
  confirmLabel,
  confirmMessage,
  variant = 'secondary',
  size = 'sm',
  redirectTo,
  onDone,
}: {
  endpoint: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  label: string;
  confirmLabel?: string;
  confirmMessage?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  redirectTo?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error?.message ?? 'That action could not be completed.');
        return;
      }

      setConfirming(false);
      onDone?.();
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch {
      setError('We could not reach the server.');
    } finally {
      setPending(false);
    }
  }

  if (confirmMessage && confirming) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-danger-700">{confirmMessage}</span>
        <Button variant="danger" size={size} onClick={run} disabled={pending}>
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          {confirmLabel ?? 'Confirm'}
        </Button>
        <Button variant="ghost" size={size} onClick={() => setConfirming(false)} disabled={pending}>
          Keep
        </Button>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        variant={variant}
        size={size}
        disabled={pending}
        onClick={() => (confirmMessage ? setConfirming(true) : run())}
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
        {label}
      </Button>
      {error && <span className="text-xs font-medium text-danger-600">{error}</span>}
    </span>
  );
}
