# Portfolio and profile copy

Ready-to-paste text for the repository settings, a portfolio site, a CV and
LinkedIn. Replace `USERNAME` with your GitHub handle before using any of it.

---

## 1. GitHub repository settings

### Repository name

```
eventora
```

Short, pronounceable, and it is the product's name rather than a description of
it — which is how real projects are named. If you would rather the URL explain
itself at a glance, `eventora-booking-platform` also works; avoid
`web-engineering-project-2`, which tells a recruiter nothing and dates the work
as coursework.

### Description (the one-liner under the repo title)

```
Full-stack events and activities booking platform — Next.js 15, TypeScript, PostgreSQL, Drizzle ORM. Country → city discovery, transactional seat booking, admin dashboard, 138 tests.
```

Shorter alternative, if you prefer:

```
Discover and book events and activities, city by city. Next.js 15 · TypeScript · PostgreSQL · Drizzle ORM.
```

### Website field

Your deployed URL, if you deploy it. Otherwise leave it empty rather than
pointing at the repository itself.

### Topics

Paste these into `Settings → Topics`:

```
nextjs  react  typescript  postgresql  drizzle-orm  tailwindcss
fullstack  web-engineering  booking-system  events-platform
rest-api  jwt-authentication  server-components  vitest  portfolio-project
```

### Repository checklist

- [ ] Description and topics set as above.
- [ ] `README.md` badges updated — replace `USERNAME` in the CI badge URL.
- [ ] Social preview image: upload `docs/screenshots/01-home.png` under
      `Settings → Social preview`. This is what appears when the link is pasted
      into LinkedIn or Slack, and it makes a visible difference.
- [ ] Issues enabled, Wiki and Projects disabled unless you use them.
- [ ] Branch protection on `main` requiring the CI check to pass.
- [ ] Pinned to your profile.

---

## 2. Portfolio site description

### Short (one or two lines, for a project card)

> **Eventora** — a full-stack events and activities booking platform. Pick a
> country and a city, then browse and book everything happening there. Next.js
> 15, TypeScript, PostgreSQL and Drizzle ORM, with an administrative dashboard
> and 138 automated tests.

### Medium (a paragraph, for a project page)

> Eventora is a discovery and booking platform for events and activities —
> Booking.com's model applied to concerts, marine trips, desert nights, museum
> tours and workshops rather than hotels. The user picks a country, then a city,
> and everything after that is scoped to that place in its own currency and time
> zone.
>
> I built it from an empty directory: a PostgreSQL schema of ten tables with
> versioned migrations, 29 REST endpoints, hand-rolled JWT authentication with
> role-based access control, a full administrative dashboard, and 138 tests that
> run against a real database in CI.
>
> The engineering problem I am most pleased with is seat contention. The obvious
> implementation reads the remaining capacity, checks it in application code and
> then writes — which oversells under concurrency, because ten simultaneous
> requests all read the same number. Eventora puts the capacity test inside the
> `UPDATE` statement's `WHERE` clause within a transaction, so PostgreSQL
> arbitrates and the losing requests are told cleanly that the seats went. There
> is a test that fires ten simultaneous bookings at a five-seat session and
> asserts exactly five succeed.

### Long (a case study, for a detailed project page)

> **The problem.** Finding what is actually on in a city is solved for hotels
> and flights and unsolved for everything else. Listings are scattered across
> venue social accounts, ticketing sites that only carry arena shows, and posters
> in café windows. The things people find are the things with a marketing budget.
> Meanwhile a small operator running a dhow cruise four evenings a week has no
> realistic route to an audience, because general-purpose ticketing platforms are
> built around single large events rather than recurring activities with per-date
> capacity.
>
> **The approach.** Eventora treats place as the primary axis and the dated
> session — not the listing — as the unit of availability. Country selection
> comes before anything is fetched, which removes the ambiguity of repeated city
> names and fixes the currency and time zone for every screen that follows. Each
> listing carries its own dated sessions with live remaining capacity, so a
> sold-out Friday is visibly sold out.
>
> **What I built.** Next.js 15 with the App Router and React Server Components,
> TypeScript in strict mode end to end, PostgreSQL 16 modelled with Drizzle ORM,
> and Tailwind CSS v4 over a custom design-token system. Authentication is
> hand-rolled — HS256 JWTs in httpOnly cookies with bcrypt hashing and
> role-based access control — rather than dropped in from a library, because the
> auth work is exactly what a Web Engineering project should demonstrate.
> Validation uses Zod schemas shared between the browser and the API, so the form
> and the endpoint cannot drift apart.
>
> **The decisions worth defending.** Money is stored as an integer in each
> currency's minor unit, with the exponent read from `Intl` rather than assumed —
> the Kuwaiti dinar has three decimal places, and hardcoding `× 100` would make
> every Gulf price wrong by a factor of ten. Times are always rendered in the
> event's own time zone rather than the viewer's, because the alternative is
> people missing boats. Filter state lives in the URL, so a filtered view is a
> shareable address that the server can render directly. Edge middleware gates
> navigation, but every API route independently re-checks the session, because a
> routing rule is not an authorisation boundary. And deleting an event that has
> bookings archives it instead — destroying booking history to tidy a list is not
> an acceptable administrative action.
>
> **How it is verified.** 138 tests: unit tests over the pure logic, and
> integration tests against a real PostgreSQL instance rather than an in-memory
> substitute, because transactions, conditional updates and unique indexes on
> expressions are exactly what a fake would not reproduce. CI runs type-check,
> lint, test and build on every push.

---

## 3. LinkedIn

### Featured project entry

**Project name**

```
Eventora — Events & Activities Booking Platform
```

**Description** (LinkedIn's project field; ~2,000 characters)

```
A full-stack events and activities discovery and booking platform, built from
scratch. Users choose a country, then a city, and browse everything happening
there — concerts, marine trips, outdoor and cultural activities, workshops and
family events — then book a specific date and receive a reference.

Built with Next.js 15 (App Router, React Server Components), TypeScript in
strict mode, PostgreSQL 16 with Drizzle ORM, and Tailwind CSS v4 over a custom
design-token system. Authentication is hand-rolled — HS256 JWTs in httpOnly
cookies, bcrypt password hashing, role-based access control — rather than
dropped in from a library.

Scope: 10 database tables with versioned SQL migrations, 29 REST endpoints, 25
pages, a complete administrative dashboard (events, dates and capacity, bookings,
destinations, categories, users, statistics), and 138 automated tests running
against a real PostgreSQL instance in GitHub Actions.

The engineering problem I am most pleased with is seat contention. The obvious
implementation reads remaining capacity, checks it in application code, then
writes — which oversells under concurrency, because simultaneous requests all
read the same number before any of them writes. Eventora moves the capacity test
into the UPDATE statement's WHERE clause inside a transaction, so PostgreSQL
arbitrates and losing requests get a clean "those seats just went" instead of a
corrupted count. A test fires ten simultaneous bookings at a five-seat session
and asserts exactly five succeed.

Other decisions worth naming: money is stored as an integer in each currency's
minor unit, with the exponent read from Intl rather than assumed — the Kuwaiti
dinar has three decimal places, so hardcoding × 100 makes every Gulf price wrong
by a factor of ten. Times are rendered in the event's own time zone, never the
viewer's. Filter state lives in the URL, making a filtered view a shareable,
server-renderable address.

Note: all event data is clearly-labelled fictional demo data. The project takes
no payments and is not connected to any ticketing provider.
```

### Post announcing it

```
I have been building Eventora — a full-stack events and activities booking
platform. Booking.com's model, but for the things that actually happen in a city
rather than hotels: concerts, reef dives, desert nights, museum tours,
workshops.

Country → city → filtered results → a specific dated booking, with an admin
dashboard behind it.

Stack: Next.js 15 with React Server Components, TypeScript (strict),
PostgreSQL 16 with Drizzle ORM, Tailwind v4. Authentication hand-rolled with
JWTs and bcrypt rather than a drop-in library — the auth work is the point.

The bit that took the most thought was seat contention. The obvious version of
"book a seat" reads the remaining capacity, checks it in JavaScript, then
writes. Ten people reaching for the last five seats at the same moment all read
"5 left", all decide "1 is fine", and you are five seats oversold with five
customers who will find out at the door.

The fix is to stop making the decision in application code. The capacity test
goes inside the UPDATE:

  UPDATE event_sessions
  SET    seats_booked = seats_booked + $n
  WHERE  id = $id AND seats_booked + $n <= capacity

Postgres holds the row lock and re-evaluates the predicate, so the losers match
zero rows and get told cleanly. There is a test that fires ten simultaneous
bookings at a five-seat session and asserts exactly five succeed.

Second favourite detail: the Kuwaiti dinar has three decimal places, not two.
Every amount is stored as an integer in minor units with the exponent read from
Intl, so KD 18.000 and £18.50 are both right. Hardcoding × 100 would have made
every Gulf price wrong by a factor of ten.

138 tests, running against a real Postgres in CI rather than an in-memory fake —
transactions and conditional updates are exactly what a fake would not
reproduce.

Code and full write-up: github.com/USERNAME/eventora

(All event data is fictional demo data — it takes no payments and is not
connected to any ticketing provider.)

#WebDevelopment #NextJS #TypeScript #PostgreSQL #FullStack #SoftwareEngineering
```

---

## 4. CV entry

```
Eventora — Events & Activities Booking Platform                    2026
Full-stack web application · Next.js 15, TypeScript, PostgreSQL, Drizzle ORM
github.com/USERNAME/eventora

• Designed and built a multi-country events discovery and booking platform:
  10-table PostgreSQL schema with versioned migrations, 29 REST endpoints,
  25 pages and a full administrative dashboard.
• Eliminated a seat-oversell race condition by moving the capacity check into a
  conditional UPDATE inside a transaction, so the database arbitrates
  concurrency; verified by a test firing ten simultaneous bookings at a
  five-seat session.
• Implemented authentication from first principles — HS256 JWTs in httpOnly
  cookies, bcrypt hashing, role-based access control, rate limiting, and
  timing-matched responses to prevent account enumeration.
• Modelled money as integers in each currency's minor unit with the exponent
  resolved at runtime, correctly handling three-decimal currencies such as KWD.
• Wrote 138 unit and integration tests against a real PostgreSQL instance, with
  GitHub Actions running type-check, lint, test and build on every push.
```

---

## 5. Interview talking points

Have a concrete answer ready for each of these — they are the questions this
project invites.

| Question | Where the answer lives |
|---|---|
| "Walk me through the hardest technical problem." | Seat contention. Name the TOCTOU race explicitly, then the conditional `UPDATE`, then the ten-way concurrency test. |
| "Why Drizzle over Prisma?" | Pure TypeScript with no binary engine, so `npm install` works anywhere including CI; SQL-first, so the repository shows the queries rather than hiding them; migrations are readable `.sql` in a diff. |
| "How do you handle money?" | Integer minor units, exponent from `Intl`, and the KWD three-decimal example. |
| "How is authorisation enforced?" | Middleware for navigation, `requireUser`/`requireAdmin` in every route handler, and the reason both exist. |
| "How would this scale?" | The table at the end of `docs/ARCHITECTURE.md` — Redis for rate limiting and revocation, caching the discovery aggregates, a real search index. |
| "What would you do differently?" | The Limitations section of the README. Knowing where a project stops is more credible than claiming it does not. |
| "How do you know it works?" | 138 tests against real PostgreSQL, and why an in-memory fake would have proven nothing here. |
