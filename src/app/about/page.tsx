import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About this project',
  description:
    'Eventora is a full-stack Web Engineering portfolio project: Next.js, TypeScript, PostgreSQL and Drizzle ORM.',
};

const STACK = [
  ['Framework', 'Next.js 15 (App Router) with React 19 Server Components'],
  ['Language', 'TypeScript in strict mode, end to end'],
  ['Database', 'PostgreSQL 16'],
  ['Data access', 'Drizzle ORM with versioned SQL migrations'],
  ['Authentication', 'JWT sessions in httpOnly cookies, bcrypt password hashing'],
  ['Validation', 'Zod schemas shared between the browser and the API'],
  ['Styling', 'Tailwind CSS v4 over a custom design-token system'],
  ['Testing', 'Vitest for unit and API integration tests'],
];

const DECISIONS = [
  {
    title: 'Money is never a floating-point number',
    body: 'Every amount is an integer in the currency’s minor unit, and the exponent is read from Intl rather than assumed to be two — the Kuwaiti dinar has three decimal places. Adding prices in floats eventually charges someone the wrong total.',
  },
  {
    title: 'Availability belongs to the session, not the event',
    body: 'A listing is a description; a session is a dated occurrence with its own capacity and price. Modelling it the other way round makes recurring events impossible to represent without duplicating rows.',
  },
  {
    title: 'The database arbitrates capacity',
    body: 'Seats are claimed by a conditional UPDATE inside a transaction, not by reading a count and deciding in JavaScript. The read-then-write version has a race that oversells under concurrency.',
  },
  {
    title: 'Filters live in the URL',
    body: 'Discovery state is query-string state, so a filtered view is shareable, bookmarkable, server-renderable and restored correctly by the back button.',
  },
  {
    title: 'Middleware guards navigation, route handlers enforce access',
    body: 'Edge middleware improves the experience by redirecting before a page renders. Every API route still checks the session independently, because a routing rule is not an authorisation boundary.',
  },
];

export default function AboutPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          Portfolio project
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
          About Eventora
        </h1>
        <p className="mt-4 text-[1.0625rem] leading-relaxed text-mist-600">
          Eventora is a complete events and activities discovery and booking platform, built from an
          empty directory as a Web Engineering portfolio project. It has a real relational schema, a
          documented REST API, hand-rolled authentication with role-based access control, an
          administrative dashboard and an automated test suite.
        </p>
      </header>

      <div className="mt-10 rounded-2xl border border-warn-500/25 bg-warn-50 p-5">
        <h2 className="text-sm font-semibold text-warn-700">A note on the data</h2>
        <p className="mt-2 text-sm leading-relaxed text-warn-700/90">
          Every event, price, schedule, capacity, review and user account in this application is
          fictional seed data written for the project. The countries, cities and venues are real
          places, but no listing represents genuine availability, nothing is scraped from or
          synchronised with any third-party service, and no payment is ever taken.
        </p>
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-ink-950">Technology</h2>
        <dl className="mt-5 divide-y divide-mist-200 border-y border-mist-200">
          {STACK.map(([label, value]) => (
            <div key={label} className="grid gap-1 py-3.5 sm:grid-cols-[10rem_1fr] sm:gap-4">
              <dt className="text-sm font-semibold text-ink-950">{label}</dt>
              <dd className="text-sm text-mist-600">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-ink-950">
          Decisions worth defending
        </h2>
        <p className="mt-2 text-[0.9375rem] text-mist-600">
          The parts of the build where the obvious approach is the wrong one.
        </p>

        <ul className="mt-6 space-y-4">
          {DECISIONS.map((decision) => (
            <li key={decision.title} className="rounded-xl border border-mist-200 bg-white p-5">
              <h3 className="text-[0.9375rem] font-semibold text-ink-950">{decision.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist-600">{decision.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12">
        <ButtonLink href="/destinations" size="lg">
          Have a look around
        </ButtonLink>
      </div>
    </div>
  );
}
