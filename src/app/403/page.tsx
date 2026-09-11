import type { Metadata } from 'next';
import { ShieldAlert } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Access denied', robots: { index: false } };

export default function ForbiddenPage() {
  return (
    <div className="container-page flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-danger-50 text-danger-600">
        <ShieldAlert className="h-7 w-7" aria-hidden />
      </span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-danger-600">403</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-950">
        That area is for administrators
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-mist-600">
        Your account is signed in, but it does not have the role required for the dashboard. If you
        are exploring the demo, sign in with the administrator account shown on the sign-in page.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Back to the homepage</ButtonLink>
        <ButtonLink href="/bookings" variant="secondary">
          My bookings
        </ButtonLink>
      </div>
    </div>
  );
}
