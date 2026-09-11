import type { Metadata } from 'next';
import { CalendarCheck, MapPinned, ShieldCheck, Ticket } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'Country, city, filters, booking — the four steps of using Eventora.',
};

const STEPS = [
  {
    icon: MapPinned,
    title: 'Start with a destination',
    body: 'Country first, then city. City names repeat across the world, so pinning the country first removes the ambiguity — and it fixes the currency and time zone for everything that follows.',
  },
  {
    icon: CalendarCheck,
    title: 'Narrow it down',
    body: 'Category, date window, price range and free-text search all narrow the same result set. Every filter lives in the URL, so a filtered view is a link you can send to whoever you are going with.',
  },
  {
    icon: Ticket,
    title: 'Pick a date and book',
    body: 'A listing is not a single event: it carries its own dated sessions, each with real remaining capacity. You choose the date and party size, confirm your details, and get a booking reference.',
  },
  {
    icon: ShieldCheck,
    title: 'Manage it afterwards',
    body: 'Everything you book sits in one place with its reference. Cancel up to 24 hours before the start and the seats go straight back into inventory for someone else.',
  },
];

const FAQ = [
  {
    q: 'Is any of this real?',
    a: 'No. Eventora is an academic Web Engineering project. The countries, cities and venues are real places, but every listing, price, schedule, review and account is fictional demonstration data written for the project. Nothing is connected to a ticketing provider.',
  },
  {
    q: 'Do I pay anything?',
    a: 'Never. There is no payment integration at all — confirming a booking writes a row to the database and shows you a reference. Prices exist so that the money handling, currency formatting and totals are modelled properly.',
  },
  {
    q: 'Why are prices in different currencies?',
    a: 'Because the platform is multi-country. Each country carries its own ISO currency and every amount is stored as an integer in that currency’s minor unit — which matters more than it sounds, since the Kuwaiti dinar has three decimal places rather than two.',
  },
  {
    q: 'Whose time zone are the times in?',
    a: 'The event’s. A Dubai departure is shown in Dubai time even if you are browsing from London, because the alternative is people missing boats.',
  },
  {
    q: 'What happens if two people book the last seat at once?',
    a: 'One of them gets it and the other sees a clear "taken while you were checking out" message. The seat claim is a single conditional UPDATE inside a transaction, so the database arbitrates rather than the application guessing.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="container-page max-w-4xl py-12">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
          How Eventora works
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-mist-600">
          Four steps from “I am in this city for the weekend” to a booking reference.
        </p>
      </header>

      <ol className="mt-10 space-y-4">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-5 rounded-2xl border border-mist-200 bg-white p-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
              <step.icon className="h-5 w-5" strokeWidth={1.9} aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink-950">
                <span className="mr-2 text-mist-400">{i + 1}.</span>
                {step.title}
              </h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-mist-600">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold tracking-tight text-ink-950">Common questions</h2>
        <dl className="mt-6 divide-y divide-mist-200 border-y border-mist-200">
          {FAQ.map((item) => (
            <div key={item.q} className="py-5">
              <dt className="text-[0.9375rem] font-semibold text-ink-950">{item.q}</dt>
              <dd className="mt-2 text-[0.9375rem] leading-relaxed text-mist-600">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <ButtonLink href="/destinations" size="lg">
          Choose a destination
        </ButtonLink>
        <ButtonLink href="/about" size="lg" variant="secondary">
          About this project
        </ButtonLink>
      </div>
    </div>
  );
}
