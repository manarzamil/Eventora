import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { readSession } from '@/server/auth/session';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Eventora — find everything happening in your city',
    template: '%s · Eventora',
  },
  description:
    'Choose a country and a city, then browse concerts, outdoor and marine activities, cultural events, workshops and experiences — and book in a few taps.',
  openGraph: {
    title: 'Eventora',
    description: 'Discover and book events and activities, city by city.',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#071426',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read once here rather than in every page: the header needs it on every
  // route, and it is a signature verification, not a database round trip.
  const session = await readSession();

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to content
        </a>

        <SiteHeader
          user={
            session
              ? { name: session.name, email: session.email, role: session.role }
              : null
          }
        />

        <main id="main" className="flex-1">
          {children}
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}
