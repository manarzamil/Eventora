import Link from 'next/link';
import { Logo } from '@/components/logo';

const COLUMNS = [
  {
    title: 'Discover',
    links: [
      { href: '/destinations', label: 'All destinations' },
      { href: '/categories', label: 'Browse categories' },
      { href: '/destinations/kuwait/kuwait-city', label: 'Kuwait City' },
      { href: '/destinations/united-arab-emirates/dubai', label: 'Dubai' },
      { href: '/destinations/united-kingdom/london', label: 'London' },
    ],
  },
  {
    title: 'Your account',
    links: [
      { href: '/bookings', label: 'My bookings' },
      { href: '/favourites', label: 'Favourites' },
      { href: '/account', label: 'Account settings' },
      { href: '/sign-in', label: 'Sign in' },
    ],
  },
  {
    title: 'About',
    links: [
      { href: '/how-it-works', label: 'How it works' },
      { href: '/about', label: 'About this project' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="surface-deep mt-24 text-white">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <Logo tone="light" />
            <p className="mt-4 text-sm leading-relaxed text-ink-200">
              One place to find everything happening in a city — concerts, marine trips, museum
              nights, workshops and the small local things that never make it onto a listings site.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-300">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-100 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/*
          The demo-data disclosure sits in the footer of every page rather than
          only in the README, because the interface is what a visitor sees.
        */}
        <div className="mt-12 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-xs leading-relaxed text-ink-200">
            <span className="font-semibold text-white">Demonstration data.</span>{' '}
            Eventora is an academic Web Engineering project. Every event, price, schedule and review
            shown here is fictional seed data created for the project. Nothing is connected to a real
            ticketing provider, no payment is ever taken, and no listing represents genuine
            availability.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-ink-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Eventora — built as a Web Engineering portfolio project.</p>
          <p>Next.js · TypeScript · PostgreSQL · Drizzle ORM</p>
        </div>
      </div>
    </footer>
  );
}
