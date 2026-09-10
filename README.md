<div align="center">

# Eventora

**Find everything happening in a city — and book it.**

A full-stack events and activities discovery and booking platform.
Country → city → filtered results → dated booking, with an administrative
dashboard behind it.

[![CI](https://github.com/manarzamil/Eventora/actions/workflows/ci.yml/badge.svg)](https://github.com/manarzamil/Eventora/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=black)
![Tests](https://img.shields.io/badge/tests-138%20passing-10B981)
![License](https://img.shields.io/badge/license-MIT-1D55E8)

</div>

![Eventora — landing page](docs/screenshots/01-home.png)

---

> ### ⚠️ Demonstration data
>
> Eventora is an academic Web Engineering project. The countries, cities and
> venues are real places, but **every event listing, price, schedule, capacity,
> review and user account is fictional data written for this project.** Nothing
> is connected to a ticketing provider, no listing represents genuine
> availability, no payment is ever taken, and no data is scraped from or
> synchronised with any third-party service. The same disclosure appears in the
> footer of every page in the running application.

---

## Table of contents

- [Overview](#overview)
- [The problem](#the-problem)
- [The solution](#the-solution)
- [Features](#features)
- [User journey](#user-journey)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Database design](#database-design)
- [API documentation](#api-documentation)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [Running locally](#running-locally)
- [Testing](#testing)
- [Screenshots](#screenshots)
- [Project structure](#project-structure)
- [Security considerations](#security-considerations)
- [Engineering decisions worth defending](#engineering-decisions-worth-defending)
- [Limitations](#limitations)
- [Future improvements](#future-improvements)
- [License](#license)

---

## Overview

Eventora is a discovery and booking platform for events and activities.
The user picks a **country**, then a **city**, and from that point everything —
prices, times, categories, availability — is scoped to that one place, in its
own currency and its own time zone.

The demo dataset covers **5 countries, 15 cities and 89 listings** across ten
categories: entertainment, concerts and live music, outdoor and marine
activities, cultural events, sports, experiences, workshops, family things, and
local happenings.

It was built from an empty directory as a portfolio project, and it is complete
rather than a mock-up: a real relational schema with 10 tables and versioned
migrations, 29 REST endpoints, hand-rolled authentication with role-based access
control, an administrative dashboard with full CRUD, and 138 automated tests
that run against a real PostgreSQL instance in CI.

| | |
|---|---|
| **Lines of TypeScript** | ~13,500 in `src/`, ~1,700 in `tests/` |
| **Pages** | 25 |
| **API endpoints** | 29 |
| **Database tables** | 10 |
| **Tests** | 138, all passing |
| **Seed data** | 5 countries · 15 cities · 81 venues · 89 events · ~3,300 sessions |

---

## The problem

Finding out what is actually on in a city is a solved problem for hotels and
flights, and an unsolved one for everything else.

**For the visitor.** What is on this weekend is scattered across a venue's
Instagram, a ticketing site that only carries arena shows, a WhatsApp group, and
a poster in a café window. There is no single place to answer "I am in Kuwait
City for three days — what is worth doing?" The things that get found are the
things with a marketing budget; the Sadu House weaving workshop and the
stargazing night at Kabd do not surface at all.

**For the organiser.** A small operator running a dhow cruise four evenings a
week has no realistic route to an audience beyond social media. General-purpose
ticketing platforms are built around single large events, not recurring
activities with per-date capacity.

**Concretely, the friction is:**

1. **Discovery is fragmented.** No canonical place to look, so people find
   things by accident or not at all.
2. **Locality is an afterthought.** Search engines and social feeds are not
   organised by *where you are*, which is the only axis that matters here.
3. **Availability is opaque.** A listing says "Fridays at sunset" without saying
   whether this Friday has space.
4. **Multi-country is genuinely hard.** Currencies with different minor-unit
   exponents, time zones that must be shown locally rather than converted, and
   city names that repeat across countries.

## The solution

Eventora treats **place as the primary axis** and **the dated session, not the
listing, as the unit of availability.**

| Problem | How Eventora answers it |
|---|---|
| Fragmented discovery | One catalogue, ten categories, full-text search across titles, tags, venues and cities. |
| Locality as an afterthought | Country → city is the first interaction, before any results are fetched. Everything downstream inherits that scope. |
| Opaque availability | Each listing carries its own dated sessions with live remaining capacity. A sold-out date is visibly sold out; a nearly-full one says how many places are left. |
| Multi-country complexity | Currency and IANA time zone are modelled per country and per city. Money is stored in integer minor units with the exponent read from `Intl` — so `KD 18.000` and `£18.50` are both right. Times are shown in the **event's** zone, never the viewer's. |
| No route to market for organisers | An administrative dashboard where events, dates, capacity, pricing and taxonomy are all editable, with statistics on what is selling. |

---

## Features

### Discovery and booking

- **Country → city selection** as the entry point, with the city list narrowing
  client-side once a country is chosen.
- **Search** — PostgreSQL full-text over title and summary, plus pattern
  matching across tags, venue names and city names.
- **Filters** — category (multi-select with live facet counts), date window,
  price range, free-entry-only. All filter state lives in the URL, so a filtered
  view is a link you can send to someone.
- **Sorting** — recommended, happening soonest, price ascending or descending,
  highest rated.
- **Event cards** carrying the next available date, remaining capacity,
  duration, venue, rating and price — a card is enough to decide from.
- **Event detail** with a full description, gallery, practical details, venue
  with a map link, up to 60 upcoming dates, and reviews.
- **Booking flow** — pick a date and party size, confirm pre-filled details,
  receive a reference. The quantity stepper is bounded by both the per-booking
  limit and the seats actually left.
- **Booking management** — every booking in one place, grouped into upcoming,
  past and cancelled, with a 24-hour cancellation window that returns seats to
  inventory immediately.
- **Favourites** with an optimistic toggle that reverts on failure.
- **Accounts** — registration, sign-in, profile editing, password change.
- **Responsive** from 390 px to ultrawide, with a bottom-sheet filter panel on
  small screens.
- **Accessible** — semantic landmarks, a skip link, labelled form fields with
  `aria-describedby` error wiring, `aria-live` result counts, visible focus
  everywhere, and `prefers-reduced-motion` respected.

### Administration

- **Overview** — published and draft counts, bookings, users, average occupancy,
  a 14-day booking chart, revenue grouped by currency, most-booked events and
  the latest bookings.
- **Events** — create, edit, publish, feature, archive and delete, with search
  and filtering by status and city.
- **Sessions** — add and remove dates per event with individual capacity and
  optional price overrides.
- **Destinations** — countries, cities and venues, with delete guards that
  refuse to orphan data.
- **Categories** — full CRUD, icon chosen from a closed set resolved on the
  client so a new category needs no deploy.
- **Bookings** — every booking, searchable by reference, guest, e-mail or event.
- **Users** — role management, with guards preventing the last administrator
  from being demoted and preventing self-demotion.

---

## User journey

```mermaid
flowchart TD
  A([Arrive]) --> B["Choose a country"]
  B --> C["Choose a city"]
  C --> D["Browse everything in that city"]
  D --> E{"Narrow it down?"}
  E -->|"category · dates · price · search"| D
  E -->|"looks good"| F["Open the listing"]
  F --> G{"Save for later?"}
  G -->|"yes"| H["Favourites"]
  H --> F
  G -->|"no"| I["Pick a date and party size"]
  I --> J{"Signed in?"}
  J -->|"no"| K["Sign in / register"]
  K --> L
  J -->|"yes"| L["Confirm details"]
  L --> M{"Seats still available?"}
  M -->|"taken while checking out"| I
  M -->|"yes"| N["Booking confirmed<br/>reference issued"]
  N --> O["My bookings"]
  O --> P{"Plans changed?"}
  P -->|"more than 24h before"| Q["Cancel — seats released"]
  P -->|"no"| R([Attend])
```

The journey is deliberately **country first**. City names repeat across the
world, and pinning the country before anything is fetched removes that ambiguity
while fixing the currency and time zone for every screen that follows.

---

## Architecture

```mermaid
flowchart TB
  subgraph browser["Browser"]
    RSC["Server-rendered pages"]
    ISL["Client islands<br/>filters · booking panel · forms"]
  end

  subgraph app["Next.js 15 application"]
    MW["Edge middleware<br/>route gating"]
    PG_["Pages — src/app/**/page.tsx"]
    API["Route handlers — src/app/api/**"]
    HTTP["HTTP layer<br/>parse · authorise · translate errors"]
    SVC["Services<br/>booking · event · auth · admin · favorite"]
    ORM["Drizzle ORM"]
  end

  DB[("PostgreSQL 16")]

  RSC --> MW --> PG_ --> SVC
  ISL -->|fetch| API --> HTTP --> SVC
  SVC --> ORM --> DB
```

Both entry points — a server-rendered page and an HTTP route handler — call the
same services. The rule that keeps the separation honest is that **a service
never imports from `next/server` and never knows what a status code is.** It
throws a typed `ApiError`; the HTTP layer decides that `SOLD_OUT` means 409.
That is exactly why the same `createBooking` function is callable from a route
handler and from the test suite with no adapter in between.

Full detail, including request lifecycle diagrams and the reasoning behind the
rendering strategy, is in **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

---

## Technology stack

| Layer | Choice | Why this one |
|---|---|---|
| **Framework** | Next.js 15 (App Router), React 19 | Server Components render discovery pages with data already in them — real SEO, fast first paint, no client-side waterfall. Route Handlers give a genuine REST API in the same codebase. |
| **Language** | TypeScript, strict, `noUncheckedIndexedAccess` | Types flow from the database row through the service to the React prop. Nothing is `any`. |
| **Database** | PostgreSQL 16 | Real relational modelling: foreign keys with explicit deletion rules, unique indexes on expressions, a GIN full-text index, transactional seat claiming. |
| **ORM** | Drizzle ORM + postgres.js | Pure TypeScript, no binary engine to download, so `npm install` works anywhere including CI. SQL-first, so the repository shows the queries rather than hiding them. Versioned `.sql` migrations that are readable in a diff. |
| **Auth** | `jose` (HS256 JWT) + bcrypt, httpOnly cookies | Hand-rolled rather than a drop-in provider, so the project actually demonstrates session handling, password hashing and role-based access control. |
| **Validation** | Zod, shared client and server | One schema validates the form and the API route — they cannot drift apart. |
| **Styling** | Tailwind CSS v4 + a custom token system | Tokens declared once in `@theme`; no component invents a colour. |
| **Icons** | lucide-react | Consistent stroke weight, tree-shaken. |
| **Testing** | Vitest, against real PostgreSQL | The behaviour under test — transactions, conditional updates, unique indexes — is exactly what an in-memory fake would not reproduce. |
| **CI** | GitHub Actions | Type-check, lint, test and build on every push, with a PostgreSQL service container. |

**Deliberately not chosen:** SQLite (hides real database engineering), NextAuth
(hides the auth work, which is the point), a component library like MUI (hides
the design work), a charting library (50 kB for fourteen bars).

---

## Database design

Ten tables. The full ER diagram, index list and the reasoning behind each
modelling decision are in **[docs/DATABASE.md](docs/DATABASE.md)**.

```mermaid
erDiagram
  COUNTRIES ||--o{ CITIES : contains
  CITIES ||--o{ VENUES : hosts
  CITIES ||--o{ EVENTS : lists
  VENUES ||--o{ EVENTS : stages
  CATEGORIES ||--o{ EVENTS : classifies
  EVENTS ||--o{ EVENT_SESSIONS : "runs on"
  EVENT_SESSIONS ||--o{ BOOKINGS : "is booked as"
  USERS ||--o{ BOOKINGS : makes
  USERS ||--o{ FAVORITES : saves
  EVENTS ||--o{ FAVORITES : "is saved as"
  USERS ||--o{ REVIEWS : writes
  EVENTS ||--o{ REVIEWS : receives
```

Three decisions carry most of the weight:

**Money is an integer in minor units.** `0.1 + 0.2 !== 0.3` in IEEE-754, and a
booking platform that adds prices in floating point charges someone the wrong
total eventually. The subtlety most implementations miss is that the minor-unit
exponent is **not always 2** — the Kuwaiti dinar has three decimal places, the
yen has none — so `src/lib/money.ts` reads it from `Intl` instead of assuming.

**Availability hangs off the session, not the event.** An event is a
description; a session is a dated occurrence with its own capacity and optional
price. Modelling it the other way makes a recurring activity impossible to
represent without duplicating the whole listing per date.

**`seats_booked` is a denormalised counter, mutated only inside a transaction**
that also writes the booking — see below.

---

## API documentation

29 REST endpoints under `/api`, all returning the same envelope:

```jsonc
{ "data": { }, "meta": { } }                                    // success
{ "error": { "code": "SOLD_OUT", "message": "…", "details": {} } } // failure
```

| Group | Endpoints |
|---|---|
| **Auth** | `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET`/`PATCH` `/auth/me` · `POST /auth/password` |
| **Discovery** | `GET /events` · `GET /events/{slug}` · `GET /countries` · `GET /cities` · `GET /categories` |
| **Bookings** | `GET`/`POST` `/bookings` · `GET /bookings/{reference}` · `POST /bookings/{reference}/cancel` |
| **Favourites** | `GET`/`POST` `/favorites` |
| **Admin** | `/admin/stats` · `/admin/events` (+`/{id}`, `/{id}/sessions`) · `/admin/sessions/{id}` · `/admin/countries` · `/admin/cities` · `/admin/categories` · `/admin/venues` · `/admin/users` · `/admin/bookings` |

Example — the discovery endpoint:

```bash
curl "http://localhost:3000/api/events?city=dubai&categories=marine,outdoor&sort=price-asc&perPage=6"
```

```jsonc
{
  "data": [{
    "slug": "marina-yacht-sunset-cruise-dubai",
    "title": "Marina Yacht Sunset Cruise",
    "basePriceMinor": 24900,        // AED 249.00 — integer minor units
    "currency": "AED",
    "nextSession": { "startsAt": "2026-09-11T13:15:00.000Z", "seatsLeft": 2 },
    "rating": 4.0, "reviewCount": 5
  }],
  "meta": { "total": 11, "page": 1, "perPage": 6, "pageCount": 2 }
}
```

Every parameter, error code, rate limit and a full `curl` walkthrough of the
customer journey are in **[docs/API.md](docs/API.md)**.

---

## Installation

### Prerequisites

- **Node.js 20+** (22 recommended)
- **PostgreSQL 16** — locally, or via the included `docker-compose.yml`
- **npm 10+**

### Steps

```bash
# 1. Clone
git clone https://github.com/manarzamil/Eventora.git
cd eventora

# 2. Install
npm install

# 3. Configure
cp .env.example .env
#    Then edit .env — at minimum set AUTH_SECRET:
#    openssl rand -base64 48

# 4. Start PostgreSQL
docker compose up -d          # creates both eventora and eventora_test
#    …or, with a local install:
#    createdb eventora && createdb eventora_test

# 5. Create the schema and load the demo data
npm run db:migrate
npm run db:seed

# 6. Run
npm run dev
```

Open <http://localhost:3000>.

### Demonstration accounts

Created by `npm run db:seed`. They are published here because the data behind
them is fictional — never reuse these credentials anywhere else.

| Role | E-mail | Password |
|---|---|---|
| Customer | `demo@eventora.demo` | `Demo!2345` |
| Administrator | `admin@eventora.demo` | `Admin!2345` |

The administrator account opens the dashboard at `/admin`.

---

## Environment variables

Copy `.env.example` to `.env`. The application validates these at boot with Zod
and **refuses to start** on a missing or under-length `AUTH_SECRET`, rather than
silently signing sessions with a predictable key.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string. |
| `TEST_DATABASE_URL` | for tests | — | A **separate** database the suite is allowed to truncate. |
| `AUTH_SECRET` | ✅ | — | Signs session JWTs. Minimum 32 characters. Generate with `openssl rand -base64 48`. |
| `AUTH_SESSION_TTL_SECONDS` | | `604800` | Session lifetime — 7 days. |
| `NEXT_PUBLIC_APP_URL` | | `http://localhost:3000` | Public base URL, used for metadata and absolute links. |

---

## Running locally

```bash
npm run dev          # development server with hot reload
npm run build        # production build
npm start            # serve the production build

npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # vitest — needs TEST_DATABASE_URL

npm run db:migrate   # apply pending migrations
npm run db:generate  # generate a migration from schema changes
npm run db:seed      # load the demo dataset
npm run db:reset     # drop, recreate, re-migrate (refuses in production)
npm run db:studio    # Drizzle Studio, a browser UI over the database

npm run screenshots  # regenerate docs/screenshots from a running server
```

---

## Testing

**138 tests across 9 files**, run with `npm test`.

```
tests/
├── unit/
│   ├── money.test.ts       # minor units, KWD's 3 decimals, exact arithmetic
│   ├── validation.test.ts  # every Zod schema, including what it must reject
│   ├── format.test.ts      # durations, availability wording, slugs, ids, covers
│   ├── timezone.test.ts    # wall time ↔ instant, across a DST boundary
│   └── rate-limit.test.ts  # windows, per-key buckets, proxy header parsing
└── integration/            # against a real PostgreSQL database
    ├── auth.test.ts        # registration, login, enumeration resistance, JWT tampering
    ├── booking.test.ts     # capacity, concurrency, cancellation, ownership
    ├── discovery.test.ts   # filters, search, sorting, pagination, favourites
    └── admin.test.ts       # CRUD, slug behaviour, delete guards, role guards
```

The integration tests run against a real database rather than an in-memory
substitute, because the behaviour under test is precisely what a substitute
would not reproduce.

**The test that matters most:**

```ts
it('never oversells a session under simultaneous demand', async () => {
  const world = await createWorld({ capacity: 5 });
  const users = await Promise.all(Array.from({ length: 10 }, () => createUser()));

  const results = await Promise.allSettled(
    users.map((user) =>
      createBooking(user.id, { ...guest, sessionId: world.sessionId, quantity: 1 }),
    ),
  );

  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(5);
  expect(results.filter((r) => r.status === 'rejected')).toHaveLength(5);
  expect(await seatsBookedFor(world.sessionId)).toBe(5);
});
```

Ten people reach for the last five seats at once. Exactly five get them.

Other things the suite pins down: a wrong password and an unknown e-mail return
the *identical* message; a tampered JWT claiming `role: ADMIN` is rejected; a
booking reference belonging to someone else returns 404 rather than 403; a
search for `'; drop table events; --` returns nothing and the table survives; an
event with bookings is archived rather than deleted; the last administrator
cannot be demoted.

CI runs `typecheck → lint → test → build` on every push, with a PostgreSQL 16
service container.

---

## Screenshots

### Discovery

| Landing | Choose a country |
|---|---|
| ![Landing page](docs/screenshots/01-home.png) | ![Destinations](docs/screenshots/02-destinations.png) |

| Choose a city | Browse the city |
|---|---|
| ![Cities](docs/screenshots/03-cities.png) | ![Discovery](docs/screenshots/04-discovery.png) |

| Filtered results | Categories |
|---|---|
| ![Filtered](docs/screenshots/05-discovery-filtered.png) | ![Categories](docs/screenshots/06-categories.png) |

### Booking

![Event detail](docs/screenshots/07-event-detail.png)

| Checkout | Confirmation |
|---|---|
| ![Checkout](docs/screenshots/09-checkout.png) | ![Confirmation](docs/screenshots/10-confirmation.png) |

| My bookings | Account |
|---|---|
| ![My bookings](docs/screenshots/11-my-bookings.png) | ![Account](docs/screenshots/13-account.png) |

### Administration

![Admin overview](docs/screenshots/14-admin-overview.png)

| Events | Edit an event |
|---|---|
| ![Admin events](docs/screenshots/15-admin-events.png) | ![Edit event](docs/screenshots/16-admin-event-edit.png) |

| Bookings | Users |
|---|---|
| ![Admin bookings](docs/screenshots/17-admin-bookings.png) | ![Admin users](docs/screenshots/19-admin-users.png) |

### Responsive

<div align="center">
<img src="docs/screenshots/20-mobile-home.png" width="30%" alt="Mobile landing" />
<img src="docs/screenshots/21-mobile-discovery.png" width="30%" alt="Mobile discovery" />
<img src="docs/screenshots/22-mobile-event.png" width="30%" alt="Mobile event detail" />
</div>

> Every screenshot is captured from the running application by
> `npm run screenshots`, against the standard seed. Because the seed is
> deterministic, cloning this repository reproduces what you see here.

---

## Project structure

```
eventora/
├── .github/workflows/ci.yml    # type-check · lint · test · build
├── drizzle/                    # generated SQL migrations, checked in
├── docs/
│   ├── ARCHITECTURE.md         # layers, request lifecycles, trade-offs
│   ├── API.md                  # full endpoint reference
│   ├── DATABASE.md             # ER diagram, indexes, modelling decisions
│   ├── PORTFOLIO.md            # portfolio and LinkedIn copy
│   └── screenshots/
├── scripts/
│   ├── screenshots.mjs         # Playwright capture for the README
│   └── init-databases.sql      # creates the test database in Docker
├── src/
│   ├── app/                    # ROUTING
│   │   ├── api/                #   29 REST endpoints
│   │   ├── admin/              #   dashboard (role-checked in the layout)
│   │   ├── destinations/       #   country → city → discovery
│   │   ├── events/[slug]/      #   detail + booking flow
│   │   ├── bookings/           #   my bookings + confirmation
│   │   ├── covers/[seed]/      #   procedural SVG cover artwork
│   │   ├── layout.tsx          #   shell, metadata, skip link
│   │   ├── error.tsx           #   route error boundary
│   │   └── not-found.tsx
│   ├── components/             # PRESENTATION — no data access
│   │   ├── ui/                 #   Button, Field, Select, Notice
│   │   └── admin/              #   dashboard components
│   ├── lib/                    # PURE, ISOMORPHIC
│   │   ├── money.ts            #   minor units, currency formatting
│   │   ├── format.ts           #   dates, durations, availability wording
│   │   ├── timezone.ts         #   wall time ↔ instant
│   │   ├── slug.ts             #   URL slugs
│   │   ├── covers.ts           #   deterministic SVG generation
│   │   └── validation.ts       #   Zod schemas — shared with the server
│   ├── server/                 # SERVER-ONLY (guarded by `server-only`)
│   │   ├── db/                 #   schema, client, migrate, seed, reset
│   │   ├── auth/               #   bcrypt, JWT sessions
│   │   ├── api/                #   error vocabulary, HTTP helpers, rate limit
│   │   ├── services/           #   business logic
│   │   └── env.ts              #   fail-fast configuration validation
│   └── middleware.ts           # edge route gating
├── tests/
│   ├── unit/                   # pure functions
│   ├── integration/            # against a real PostgreSQL database
│   └── helpers/fixtures.ts     # per-test world builders
├── docker-compose.yml
├── drizzle.config.ts
└── vitest.config.mts
```

---

## Security considerations

Full detail and the disclosure process are in **[SECURITY.md](SECURITY.md)**.

| Concern | Control |
|---|---|
| **Password storage** | bcrypt, cost 12. Hashes never leave the server; plaintext is never logged. |
| **Session handling** | HS256 JWT in an `httpOnly`, `sameSite=lax`, `secure` cookie. Signature, issuer, audience and expiry verified on every read. |
| **CSRF** | `sameSite=lax` keeps the cookie off cross-site POSTs — the defence for every mutating route. |
| **Authorisation** | Every API route calls `requireUser()` or `requireAdmin()` **independently**. Edge middleware improves navigation but is never treated as the boundary. |
| **Input validation** | Zod at every boundary. Unknown fields are stripped, so a self-registration cannot set `role: ADMIN`. |
| **SQL injection** | All queries built with Drizzle's `sql` template, which emits bound parameters. Proven by a test that pushes `'; drop table events; --` through the search box. |
| **User enumeration** | Identical message *and* matched timing for a wrong password and an unknown address — bcrypt runs against a dummy hash when no account exists. |
| **Object-level access** | Another account's booking returns **404, not 403**: confirming a reference exists is itself a leak. |
| **Overselling** | Capacity arbitrated by the database inside a transaction, not by application code. |
| **Rate limiting** | Fixed-window limiter on login, registration, password change and booking. |
| **Open redirect** | The `next` parameter after sign-in is accepted only when it is a same-origin path. |
| **Error leakage** | Stack traces and driver messages are logged, never returned. Clients get a stable code and a human message. |
| **Headers** | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS. |
| **Fail-fast config** | Boot is refused on a missing or weak `AUTH_SECRET`. |

---

## Engineering decisions worth defending

The parts of this build where the obvious approach is the wrong one.

<details>
<summary><b>1. The database arbitrates capacity, not the application</b></summary>

<br>

The naive booking implementation reads `seats_booked`, compares it in
JavaScript, then writes. That is a time-of-check-to-time-of-use race: ten
concurrent requests all read *5 seats left*, all decide *1 is fine*, and the
session ends up five seats oversold.

The capacity test therefore lives in the `WHERE` clause:

```sql
UPDATE event_sessions
SET    seats_booked = seats_booked + $qty
WHERE  id = $sessionId
  AND  seats_booked + $qty <= capacity
RETURNING id;
```

PostgreSQL holds a row lock for the statement and re-evaluates the predicate
against the committed row, so a losing request matches zero rows and is told
so. The claim and the booking insert share one transaction; neither can exist
alone. Covered by a test that fires ten simultaneous bookings at a five-seat
session.

</details>

<details>
<summary><b>2. Money is an integer, and the exponent is not always 2</b></summary>

<br>

Every amount is an `INTEGER` in the currency's minor unit. `0.1 + 0.2 !== 0.3`
in IEEE-754, and the resulting error hides in the last decimal place until it
does not.

The part most implementations get wrong: **the Kuwaiti dinar has three decimal
places.** So does the Bahraini dinar and the Omani rial; the yen has none.
Hardcoding `× 100` produces prices that are wrong by a factor of ten across the
Gulf. `src/lib/money.ts` reads the exponent from `Intl.NumberFormat`, so
`KD 18.000` and `£18.50` are both stored and displayed correctly.

</details>

<details>
<summary><b>3. Times are shown in the event's zone, never the viewer's</b></summary>

<br>

A Dubai departure is displayed in Dubai time even when you are browsing from
London, because the alternative is people missing boats. Every city carries its
IANA zone, and `Intl.DateTimeFormat` formats against it.

This also applies to seeding: session times are generated as **local wall-clock
times** and converted to instants (`src/lib/timezone.ts`), so a sunset cruise is
stored at the moment that reads 17:30 in Dubai — not 17:30 UTC, which would
display as 21:30 and make the demo data nonsense.

</details>

<details>
<summary><b>4. Filter state lives in the URL</b></summary>

<br>

Discovery state is query-string state, not React state. That makes a filtered
view a real address: shareable, bookmarkable, openable in a new tab, restored
correctly by the back button, and renderable by the server with no client-side
fetch. The free-text box is debounced by 350 ms so typing does not push a
history entry per keystroke.

</details>

<details>
<summary><b>5. Middleware guards navigation; route handlers enforce access</b></summary>

<br>

Edge middleware redirects unauthenticated navigation before a page renders,
which is a user-experience improvement. Every API route independently calls
`requireUser()` or `requireAdmin()`, because a matcher is a routing rule and an
attacker calls the API directly rather than clicking a link. Defence in depth,
with the two layers doing different jobs.

</details>

<details>
<summary><b>6. Deleting an event with bookings archives it instead</b></summary>

<br>

`DELETE /api/admin/events/{id}` cascades to sessions and therefore to bookings.
An event with paying customers is set to `ARCHIVED` rather than removed, and the
response says which happened. Destroying booking history to tidy a list is not
an acceptable administrative action. Similarly, a session with active bookings
cannot be removed at all.

</details>

<details>
<summary><b>7. One validation schema, two consumers</b></summary>

<br>

`src/lib/validation.ts` is imported by both the form component and the route
handler. The client-side parse is a convenience that avoids a round trip; the
server-side parse is the one that is load-bearing. Because they are literally
the same object, they cannot drift apart — which is the failure mode of
hand-written duplicate rules.

</details>

<details>
<summary><b>8. No image host, no image dependency</b></summary>

<br>

Cover artwork is deterministic SVG generated from a seed string
(`src/lib/covers.ts`), served by a route handler with a one-year immutable cache.
The repository ships no binary image assets, works offline, and never depends on
a third-party image host that might rate-limit or change. Swapping in real
photography means storing a different URL in `events.hero_image_url` — the
schema already accepts any URL.

</details>

---

## Limitations

Stated plainly, because a portfolio project that pretends to be complete is less
credible than one that knows where it stops.

1. **No payment processing.** Confirming a booking writes a row; no money moves.
   Prices exist so that currency handling, minor-unit arithmetic and totals are
   modelled properly.
2. **Sessions cannot be revoked.** JWTs are stateless, so changing a password
   does not invalidate tokens already issued.
3. **The rate limiter is per-process.** Behind several replicas the effective
   limit multiplies by the replica count.
4. **No e-mail at all** — no verification, no password reset, no booking
   confirmation e-mail. Registration signs you straight in.
5. **Reviews are read-only.** They are seeded and displayed; there is no route
   to write one, and no "verified attendee" gate.
6. **No Content-Security-Policy header.** A genuinely strict CSP with Next.js
   needs nonce plumbing that is not wired up.
7. **Search is `to_tsvector` plus `ILIKE`.** Fine at this scale; it will not do
   fuzzy matching, stemming across languages, or typo tolerance.
8. **Single-language, LTR only.** No i18n layer and no RTL support, which the
   Gulf-heavy dataset would want in production.
9. **Cover artwork is procedural.** Handsome and consistent, but not photographs
   of real venues.
10. **The e-mail address on an account cannot be changed.**
11. **No audit log** of administrative actions.
12. **No end-to-end test suite.** Playwright drives the screenshot script, but
    there are no committed E2E assertions — the coverage is unit and
    integration.

## Future improvements

Roughly in the order they would actually be worth doing:

- **Payments** — a PSP integration with an idempotent order state machine and
  webhook reconciliation, plus a `PENDING → CONFIRMED` transition that the
  booking status enum already anticipates.
- **Transactional e-mail** — verification, password reset, booking confirmation
  and a reminder the day before.
- **Reviews from verified attendees only** — writable after a booking has
  completed, which makes the ratings mean something.
- **Redis** for shared rate limiting and session revocation, removing two of the
  limitations above in one move.
- **Organiser accounts** — a third role between customer and administrator, so
  a venue manages its own listings without full dashboard access.
- **Arabic and RTL** — the dataset is Gulf-heavy and the interface should be too.
- **Map-based discovery** — the coordinates are already modelled on every venue.
- **Seat maps** for venues where position matters, rather than a flat count.
- **A recommendation surface** built on favourites and booking history.
- **Waitlists** on sold-out sessions, notified when a cancellation frees seats.
- **An E2E suite** in Playwright covering the whole booking journey in CI.
- **Observability** — structured logs, traces on the booking transaction, and an
  error reporter.

---

## License

[MIT](LICENSE) — free to read, learn from, and build on.

<div align="center">
<br>
<sub>Built as a Web Engineering portfolio project.<br>
Next.js · TypeScript · PostgreSQL · Drizzle ORM · Tailwind CSS</sub>
</div>
