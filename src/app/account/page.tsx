import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CalendarCheck, Heart, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { readSession } from '@/server/auth/session';
import { getUserById } from '@/server/services/auth-service';
import { listBookingsForUser } from '@/server/services/booking-service';
import { listFavorites } from '@/server/services/favorite-service';
import { PasswordForm, ProfileForm } from '@/components/account-forms';
import { formatLongDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Account settings', robots: { index: false } };

export default async function AccountPage() {
  const session = await readSession();
  if (!session) redirect('/sign-in?next=/account');

  const [user, bookings, favorites] = await Promise.all([
    getUserById(session.sub),
    listBookingsForUser(session.sub),
    listFavorites(session.sub),
  ]);

  const active = bookings.filter((b) => b.status !== 'CANCELLED');

  return (
    <div className="container-page max-w-4xl py-10">
      <header className="flex flex-wrap items-center gap-5">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-600 text-xl font-semibold text-white">
          {user.fullName
            .split(' ')
            .map((p) => p[0])
            .slice(0, 2)
            .join('')}
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
            {user.fullName}
          </h1>
          <p className="mt-1 text-sm text-mist-600">
            {user.email} · member since {formatLongDate(user.createdAt)}
          </p>
        </div>
        {user.role === 'ADMIN' && (
          <Link
            href="/admin"
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-ink-950"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Administrator
          </Link>
        )}
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/bookings"
          className="flex items-center gap-4 rounded-2xl border border-mist-200 bg-white p-5 transition-all hover:border-brand-300 hover:shadow-lift"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <CalendarCheck className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block text-2xl font-semibold text-ink-950">{active.length}</span>
            <span className="block text-sm text-mist-600">active bookings</span>
          </span>
        </Link>

        <Link
          href="/favourites"
          className="flex items-center gap-4 rounded-2xl border border-mist-200 bg-white p-5 transition-all hover:border-brand-300 hover:shadow-lift"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-danger-50 text-danger-600">
            <Heart className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block text-2xl font-semibold text-ink-950">{favorites.length}</span>
            <span className="block text-sm text-mist-600">saved listings</span>
          </span>
        </Link>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-mist-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-ink-950">Your details</h2>
          <p className="mt-1 text-sm text-mist-600">
            These are used to pre-fill the booking form.
          </p>
          <div className="mt-6">
            <ProfileForm
              defaults={{
                fullName: user.fullName,
                email: user.email,
                phone: user.phone ?? '',
              }}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-mist-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-ink-950">Password</h2>
          <p className="mt-1 text-sm text-mist-600">
            Changing it signs out nobody else — sessions are stateless tokens, which is called out
            under Limitations in the README.
          </p>
          <div className="mt-6">
            <PasswordForm />
          </div>
        </section>
      </div>
    </div>
  );
}
