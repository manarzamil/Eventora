'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';

/**
 * Route-level error boundary. The message shown is deliberately generic: the
 * real error is logged, not rendered, because framework and driver messages
 * leak schema and file-path detail.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ui] render error', error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-warn-50 text-warn-700">
        <AlertTriangle className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink-950">
        Something went wrong
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-mist-600">
        This page failed to load. It is usually temporary — try again, and if it persists the detail
        is in the server logs.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-mist-400">reference {error.digest}</p>
      )}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Back to the homepage
        </ButtonLink>
      </div>
    </div>
  );
}
