'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/field';

export function CancelBookingButton({
  reference,
  disabled,
  disabledReason,
}: {
  reference: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (disabled) {
    return <p className="text-xs text-mist-500">{disabledReason}</p>;
  }

  async function cancel() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${reference}/cancel`, { method: 'POST' });
      const body = await response.json();
      if (!response.ok) {
        setError(body?.error?.message ?? 'We could not cancel that booking.');
        return;
      }
      setConfirming(false);
      router.refresh();
    } catch {
      setError('We could not reach the server. Try again in a moment.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <Notice tone="error">{error}</Notice>}

      {confirming ? (
        <div className="rounded-xl border border-danger-500/25 bg-danger-50 p-4">
          <p className="text-sm font-medium text-danger-700">
            Cancel this booking? The seats are released immediately and cannot be reclaimed.
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="danger" size="sm" onClick={cancel} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Yes, cancel it
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
              Keep booking
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
          Cancel booking
        </Button>
      )}
    </div>
  );
}
