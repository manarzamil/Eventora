import { Compass } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <Compass className="h-7 w-7" aria-hidden />
      </span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-950">
        We could not find that page
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-mist-600">
        The link may be out of date, or the listing may have been archived. Start again from a
        destination and you will get where you were going.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/destinations">Browse destinations</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Back to the homepage
        </ButtonLink>
      </div>
    </div>
  );
}
