import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readSession } from '@/server/auth/session';
import { AdminNav } from '@/components/admin/admin-nav';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Eventora admin' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Middleware already redirected unauthenticated visitors, but the layout
  // checks again: middleware is a routing rule, not an authorisation boundary,
  // and this is the last place before data reaches the page.
  const session = await readSession();
  if (!session) redirect('/sign-in?next=/admin');
  if (session.role !== 'ADMIN') redirect('/403');

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-mist-100">
      <div className="border-b border-mist-200 bg-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink-950">
              Administration
            </h1>
            <p className="text-xs text-mist-500">
              Signed in as {session.name} · {session.email}
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-mist-300 px-3.5 py-2 text-sm font-medium text-ink-800 transition-colors hover:bg-mist-100"
          >
            View the site
          </Link>
        </div>
        <div className="container-page">
          <AdminNav />
        </div>
      </div>

      <div className="container-page py-8">{children}</div>
    </div>
  );
}
