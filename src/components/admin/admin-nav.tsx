'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  CalendarRange,
  Globe2,
  LayoutDashboard,
  Shapes,
  Ticket,
  Users,
} from 'lucide-react';

const TABS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/events', label: 'Events', icon: CalendarRange },
  { href: '/admin/bookings', label: 'Bookings', icon: Ticket },
  { href: '/admin/destinations', label: 'Destinations', icon: Globe2 },
  { href: '/admin/categories', label: 'Categories', icon: Shapes },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="no-scrollbar -mb-px flex gap-1 overflow-x-auto">
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              'inline-flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-3 text-sm font-medium transition-colors',
              active
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-mist-600 hover:border-mist-300 hover:text-ink-900',
            )}
          >
            <tab.icon className="h-4 w-4" aria-hidden />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
