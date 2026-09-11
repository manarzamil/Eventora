# API reference

Eventora exposes a REST API under `/api`. Every endpoint returns JSON, uses the
same envelope, and authenticates with the session cookie set at sign-in.

- **Base URL (local):** `http://localhost:3000/api`
- **Auth:** `eventora_session` cookie — `httpOnly`, `sameSite=lax`. Browsers
  attach it automatically; `curl` needs `-c`/`-b` to persist a cookie jar.
- **Content type:** `application/json` on every request with a body.

---

## Response envelope

Success:

```json
{ "data": { }, "meta": { } }
```

`meta` appears only on collection endpoints, carrying pagination.

Failure:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Some fields need attention.",
    "details": { "quantity": "Book at least one ticket." }
  }
}
```

`details` is present on validation failures, keyed by field name so a form can
render errors inline.

### Error codes

| Code | Status | Meaning |
|---|---|---|
| `BAD_REQUEST` | 400 | Malformed request — unparseable JSON, or a rule the schema cannot express. |
| `UNAUTHENTICATED` | 401 | No valid session. |
| `FORBIDDEN` | 403 | Signed in, but the role is insufficient. |
| `NOT_FOUND` | 404 | No such resource — **also returned** when a resource exists but belongs to another account. |
| `CONFLICT` | 409 | The request contradicts current state (already cancelled, session started, category still in use). |
| `SOLD_OUT` | 409 | Not enough seats remain. `details.seatsLeft` says how many do. |
| `VALIDATION_FAILED` | 422 | A field failed validation. See `details`. |
| `RATE_LIMITED` | 429 | Too many attempts. `details.retryAfterSeconds`. |
| `INTERNAL` | 500 | Unexpected failure. Logged server-side; never leaks a stack trace. |

### Rate limits

| Endpoint | Limit |
|---|---|
| `POST /api/auth/login` | 10 per 15 minutes per IP |
| `POST /api/auth/register` | 5 per 15 minutes per IP |
| `POST /api/auth/password` | 5 per 15 minutes per user |
| `POST /api/bookings` | 20 per minute per user |

---

## Authentication

### `POST /api/auth/register`

Creates an account and signs it in. The `role` field cannot be set by the
caller — self-registration always produces a `USER`.

```jsonc
// request
{
  "fullName": "Sara Al-Harbi",
  "email": "sara@example.com",
  "password": "correct-horse-9",   // ≥ 10 chars, a letter, plus a digit or symbol
  "phone": "+965 5000 0000"        // optional
}
```

`201` → the public user object. `409` if the address is already registered.

### `POST /api/auth/login`

```jsonc
{ "email": "demo@eventora.demo", "password": "Demo!2345" }
```

`200` → the public user object, and a `Set-Cookie` header.
`401` for both a wrong password and an unknown address — deliberately identical,
with matched timing, so the endpoint cannot be used to enumerate accounts.

### `POST /api/auth/logout`

Clears the cookie. `200` regardless of whether one was set.

### `GET /api/auth/me`

`200` with the current user, or `200` with `"data": null` when signed out. This
is not an error — "who am I" has a valid answer for an anonymous caller.

### `PATCH /api/auth/me`

```jsonc
{ "fullName": "Sara Ahmed", "phone": "+965 5000 1111" }
```

Re-issues the session cookie, since the display name is carried in the token.
The e-mail address cannot be changed in this build.

### `POST /api/auth/password`

```jsonc
{
  "currentPassword": "…",
  "newPassword": "…",
  "confirmPassword": "…"
}
```

`400` if the current password is wrong, or if the new one matches the old.

---

## Discovery

### `GET /api/events`

The main search endpoint. All parameters are optional.

| Parameter | Type | Notes |
|---|---|---|
| `city` | string | City slug. Scopes the result set. |
| `country` | string | Country slug. |
| `q` | string | Full-text over title and summary, plus `ILIKE` over tags, venue and city. |
| `categories` | string | Comma-separated category slugs. |
| `minPrice`, `maxPrice` | number | **Major** units. Only applied when `city` or `country` fixes the currency. |
| `freeOnly` | boolean | Only events priced at zero. |
| `dateFrom`, `dateTo` | `YYYY-MM-DD` or ISO | Restricts to events with a bookable session in the window. |
| `sort` | enum | `recommended` (default), `soonest`, `price-asc`, `price-desc`, `rating`. |
| `page` | integer | Default 1. |
| `perPage` | integer | Default 12, maximum 48. |

Only `PUBLISHED` events with at least one future, non-full session are ever
returned.

```bash
curl "http://localhost:3000/api/events?city=dubai&categories=marine,outdoor&sort=price-asc&perPage=6"
```

```jsonc
{
  "data": [
    {
      "id": "mtv2w9k…",
      "slug": "marina-yacht-sunset-cruise-dubai",
      "title": "Marina Yacht Sunset Cruise",
      "summary": "A shared-charter sail out of the marina…",
      "heroImageUrl": "/covers/marine__marina-yacht-sunset-cruise-dubai.svg",
      "basePriceMinor": 24900,          // AED 249.00 — integer minor units
      "currency": "AED",
      "durationMinutes": 150,
      "minAge": 0,
      "tags": ["yacht", "sunset", "canapés"],
      "isFeatured": true,
      "category": { "name": "Marine Activities", "slug": "marine", "icon": "Waves" },
      "city":     { "name": "Dubai", "slug": "dubai" },
      "country":  { "name": "United Arab Emirates", "slug": "united-arab-emirates", "flagEmoji": "🇦🇪" },
      "venueName": "Dubai Marina Yacht Club",
      "nextSession": {
        "id": "mtv2w9m…",
        "startsAt": "2026-09-11T13:15:00.000Z",
        "priceMinor": 24900,
        "seatsLeft": 2
      },
      "rating": 4.0,
      "reviewCount": 5
    }
  ],
  "meta": { "total": 11, "page": 1, "perPage": 6, "pageCount": 2 }
}
```

### `GET /api/events/{slug}`

The full listing: description, gallery, venue with coordinates, the city's IANA
time zone, up to 60 upcoming sessions with live seat counts, and up to 12
reviews. `404` for an unknown slug **or** a non-published event.

### `GET /api/countries`

Every country with its ISO code, currency, city count and event count.

### `GET /api/cities?country={slug}`

Cities, newest-first by event count, each with its country, time zone and blurb.

### `GET /api/categories?city={slug}`

Categories with event counts. Passing `city` counts within that city only, so
filter facets show real numbers rather than global ones.

---

## Bookings

All booking endpoints require authentication.

### `POST /api/bookings`

```jsonc
{
  "sessionId": "mtv2w9m…",
  "quantity": 2,                    // 1–10
  "guestName": "Yousef Al-Sabah",
  "guestEmail": "yousef@example.com",
  "guestPhone": "+965 9000 3344",   // optional
  "notes": "Wheelchair access, please."  // optional, ≤ 500 chars
}
```

`201` → the full booking, including its `reference` (`EVT-XXXXXX`).

Failure modes worth knowing:

| Situation | Response |
|---|---|
| Fewer seats left than requested | `409 SOLD_OUT`, `details.seatsLeft` |
| Lost the race to a concurrent booking | `409 SOLD_OUT` |
| Session already started | `409 CONFLICT` |
| Event not published | `409 CONFLICT` |
| Unknown session id | `404 NOT_FOUND` |

The seat claim and the booking row are written in one transaction: neither can
exist without the other.

### `GET /api/bookings`

Every booking for the current user, newest session first.

### `GET /api/bookings/{reference}`

One booking. A reference belonging to another account returns `404`, not `403` —
confirming that a reference exists is itself a leak. Administrators can read any
booking.

### `POST /api/bookings/{reference}/cancel`

Cancels and returns the seats to inventory in one transaction.

- `409 CONFLICT` inside the 24-hour window before the start time.
- `400 BAD_REQUEST` if already cancelled.
- `403 FORBIDDEN` if it belongs to another account.
- Administrators may cancel inside the window.

---

## Favourites

### `GET /api/favorites`

The current user's saved events, as full event cards.

### `POST /api/favorites`

```jsonc
{ "eventId": "mtv2w9j…" }
```

Toggles, returning `{ "favorited": true | false }`. Idempotent per direction —
a double-tapped heart cannot create duplicate rows.

---

## Administration

Every endpoint below requires `role = ADMIN`; anything else gets `403`.

### `GET /api/admin/stats`

Dashboard aggregates: totals, revenue grouped by currency (never summed across
currencies — there is no rate source), bookings for each of the last 14 days
including empty ones, most-booked events, occupancy, and the latest bookings.

### Events

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/admin/events` | `q`, `status`, `cityId`, `page`, `perPage`. Includes drafts and archived. |
| `POST` | `/api/admin/events` | Creates a listing. Slug derived from the title, disambiguated on collision. |
| `PUT` | `/api/admin/events/{id}` | Updates. The slug is only regenerated when the title changes, so existing links keep working. |
| `DELETE` | `/api/admin/events/{id}` | Deletes if it has no bookings; **archives** it if it does. Returns `{ deleted, archived }`. |

The event body:

```jsonc
{
  "title": "Sunset Dhow Cruise",
  "summary": "…",                  // 20–320 chars
  "description": "…",              // ≥ 40 chars
  "categoryId": "…",
  "cityId": "…",
  "venueId": "…",                  // must belong to cityId, or 400
  "price": 18,                     // MAJOR units; converted using the city's currency
  "durationMinutes": 150,
  "minAge": 0,
  "tags": "sunset, boat",          // comma-separated or an array
  "isFeatured": false,
  "status": "DRAFT"                // DRAFT | PUBLISHED | ARCHIVED
}
```

### Sessions

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/admin/events/{id}/sessions` | All dates with booked counts. |
| `POST` | `/api/admin/events/{id}/sessions` | `{ startsAt, capacity, priceOverride? }`. End time derived from the event duration. |
| `DELETE` | `/api/admin/sessions/{id}` | `409` if the date has active bookings. |

### Geography and taxonomy

| Method | Path | Notes |
|---|---|---|
| `GET`/`POST` | `/api/admin/countries` | `{ name, code, currency, flagEmoji }` |
| `DELETE` | `/api/admin/countries/{id}` | `409` while any of its cities still hold events. |
| `GET`/`POST` | `/api/admin/cities` | `{ countryId, name, timezone, latitude, longitude, blurb }` |
| `DELETE` | `/api/admin/cities/{id}` | `409` while it still holds events. |
| `GET`/`POST` | `/api/admin/categories` | `{ name, icon, description, sortOrder }` |
| `PUT`/`DELETE` | `/api/admin/categories/{id}` | `409` on delete while events use it. |
| `GET`/`POST` | `/api/admin/venues` | `{ cityId, name, address, latitude, longitude }` |

### Users and bookings

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/admin/users` | `q` searches name and e-mail. Never returns password hashes. |
| `PATCH` | `/api/admin/users/{id}` | `{ "role": "ADMIN" \| "USER" }`. Refuses to demote the last administrator, and refuses to let an administrator demote themselves. |
| `GET` | `/api/admin/bookings` | `q`, `status`. Capped at 200, newest first. |

---

## A worked example

The whole customer journey with `curl`:

```bash
JAR=$(mktemp)

# 1. sign in
curl -s -c "$JAR" -X POST localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@eventora.demo","password":"Demo!2345"}'

# 2. find something in Kuwait City
SLUG=$(curl -s "localhost:3000/api/events?city=kuwait-city&perPage=1" \
  | jq -r '.data[0].slug')

# 3. take its first available date
SESSION=$(curl -s "localhost:3000/api/events/$SLUG" \
  | jq -r '.data.sessions[0].id')

# 4. book two places
REF=$(curl -s -b "$JAR" -X POST localhost:3000/api/bookings \
  -H 'Content-Type: application/json' \
  -d "{\"sessionId\":\"$SESSION\",\"quantity\":2,
       \"guestName\":\"Yousef Al-Sabah\",\"guestEmail\":\"demo@eventora.demo\"}" \
  | jq -r '.data.reference')

# 5. read it back, then cancel it
curl -s -b "$JAR" "localhost:3000/api/bookings/$REF" | jq '.data.status'
curl -s -b "$JAR" -X POST "localhost:3000/api/bookings/$REF/cancel" | jq '.data.status'
```
