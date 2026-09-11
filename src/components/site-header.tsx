'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { CalendarCheck, ChevronDown, Heart, LayoutDashboard, LogOut, Menu, User, X } from 'lucide-react';
import { Logo } from '@/components/logo';
import { ButtonLink } from '@/components/ui/button';

export interface HeaderUser {
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

const NAV = [
  { href: '/destinations', label: 'Destinations' },
  { href: '/categories', label: 'Categories' },
  { href: '/how-it-works', label: 'How it works' },
];

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // The landing page draws its own dark hero, so the header sits on top of it
  // transparently there and becomes a solid bar everywhere else.
  const overlay = pathname === '/';

  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <header
      className={clsx(
        'sticky top-0 z-50 w-full transition-colors',
        overlay
          ? 'border-b border-white/10 bg-ink-950/70 backdrop-blur-xl'
          : 'border-b border-mist-200 bg-white/90 backdrop-blur-xl',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="Eventora home">
            <Logo tone={overlay ? 'light' : 'dark'} />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    overlay
                      ? active
                        ? 'bg-white/15 text-white'
                        : 'text-white/75 hover:bg-white/10 hover:text-white'
                      : active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-mist-600 hover:bg-mist-100 hover:text-ink-900',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className={clsx(
                  'flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 text-sm font-medium transition-colors',
                  overlay
                    ? 'text-white hover:bg-white/12'
                    : 'text-ink-900 hover:bg-mist-100',
                )}
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                  {initials(user.name)}
                </span>
                <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
                <ChevronDown className="h-4 w-4 opacity-60" aria-hidden />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-mist-200 bg-white py-1.5 shadow-panel"
                >
                  <div className="border-b border-mist-200 px-4 pb-3 pt-2">
                    <p className="truncate text-sm font-semibold text-ink-950">{user.name}</p>
                    <p className="truncate text-xs text-mist-500">{user.email}</p>
                  </div>

                  <MenuLink href="/bookings" icon={CalendarCheck}>My bookings</MenuLink>
                  <MenuLink href="/favourites" icon={Heart}>Favourites</MenuLink>
                  <MenuLink href="/account" icon={User}>Account settings</MenuLink>
                  {user.role === 'ADMIN' && (
                    <MenuLink href="/admin" icon={LayoutDashboard}>Admin dashboard</MenuLink>
                  )}

                  <div className="mt-1 border-t border-mist-200 pt-1">
                    <button
                      type="button"
                      onClick={signOut}
                      role="menuitem"
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-danger-600 transition-colors hover:bg-danger-50"
                    >
                      <LogOut className="h-4 w-4" aria-hidden />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <ButtonLink href="/sign-in" variant={overlay ? 'inverse' : 'ghost'} size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/sign-up" variant="primary" size="sm">
                Create account
              </ButtonLink>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className={clsx(
              'grid h-10 w-10 place-items-center rounded-xl transition-colors md:hidden',
              overlay ? 'text-white hover:bg-white/12' : 'text-ink-900 hover:bg-mist-100',
            )}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-mist-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-900 hover:bg-mist-100"
              >
                {item.label}
              </Link>
            ))}
            {!user && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <ButtonLink href="/sign-in" variant="secondary" size="sm">Sign in</ButtonLink>
                <ButtonLink href="/sign-up" size="sm">Create account</ButtonLink>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-900 transition-colors hover:bg-mist-100"
    >
      <Icon className="h-4 w-4 text-mist-500" aria-hidden />
      {children}
    </Link>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U';
}
