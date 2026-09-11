import Link from 'next/link';
import { Check } from 'lucide-react';
import { Logo } from '@/components/logo';
import { DEMO_ACCOUNTS } from '@/server/db/seed-data';

const POINTS = [
  'Book across five countries in their own currency',
  'Keep every reference and cancellation in one place',
  'Save listings you are still deciding between',
];

export function AuthLayout({
  title,
  subtitle,
  showDemoAccounts,
  children,
}: {
  title: string;
  subtitle: string;
  showDemoAccounts?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* Form column */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>

          <h1 className="mt-8 text-2xl font-semibold tracking-tight text-ink-950 lg:mt-0 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-mist-600">{subtitle}</p>

          <div className="mt-8">{children}</div>

          {showDemoAccounts && (
            <div className="mt-8 rounded-xl border border-brand-500/20 bg-brand-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">
                Demo accounts
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-brand-800/80">
                This is a portfolio project seeded with fictional data. Sign in with either account
                to look around — the administrator one opens the dashboard.
              </p>
              <dl className="mt-3 space-y-1.5 font-mono text-[0.6875rem] text-brand-900">
                <div className="flex justify-between gap-3">
                  <dt>{DEMO_ACCOUNTS.customer.email}</dt>
                  <dd>{DEMO_ACCOUNTS.customer.password}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>{DEMO_ACCOUNTS.admin.email}</dt>
                  <dd>{DEMO_ACCOUNTS.admin.password}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Brand column */}
      <div className="surface-deep relative hidden items-center overflow-hidden px-12 lg:flex">
        <div className="relative max-w-md">
          <Logo tone="light" />
          <h2 className="mt-8 text-3xl font-semibold leading-tight tracking-tight text-white">
            Find the thing you would otherwise have heard about a week too late.
          </h2>
          <ul className="mt-8 space-y-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-[0.9375rem] text-ink-100">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} aria-hidden />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
