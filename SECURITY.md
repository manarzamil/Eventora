# Security Policy

## Scope and status

Eventora is an academic Web Engineering portfolio project. It is **not** a
production service, holds no real customer data, takes no payments, and should
not be deployed as-is to handle anyone's personal information.

That said, the security work in it is real rather than decorative, and this
document states plainly what is implemented, what is deliberately out of scope,
and how to report a problem.

## Reporting a vulnerability

Open a **private security advisory** through the repository's Security tab
(`Security → Report a vulnerability`) rather than a public issue. Please
include:

- what the issue is and where in the codebase it lives,
- the steps to reproduce it,
- what an attacker gains from it.

You can expect an acknowledgement within a few days. Because this is a personal
project rather than a funded service, there is no bounty programme.

## What is implemented

| Area | Control |
|---|---|
| Password storage | bcrypt, cost factor 12. Plaintext passwords are never logged or returned. |
| Sessions | HS256 JWT in an `httpOnly`, `sameSite=lax`, `secure` (in production) cookie. Signature, issuer, audience and expiry are all verified on every read. |
| CSRF | `sameSite=lax` prevents the session cookie from riding along on cross-site POST requests, which is the attack every mutating route would otherwise be open to. |
| Authorisation | Every API route calls `requireUser()` or `requireAdmin()` independently. Edge middleware redirects unauthenticated navigation, but is treated as a routing convenience, never as the boundary. |
| Input validation | Every request body and query string is parsed by a Zod schema before it reaches a service. Unknown fields are stripped; a self-registration cannot set its own role. |
| SQL injection | All queries are built with Drizzle's `sql` template, which emits bound parameters. No user input is ever concatenated into SQL. |
| User enumeration | Login returns one message for both a wrong password and an unknown address, and runs bcrypt against a dummy hash when the account does not exist so the two paths take the same time. |
| Object-level access | A booking belonging to another account returns `404`, not `403` — confirming that a reference exists is itself a leak. |
| Rate limiting | Fixed-window limiter on login, registration, password change and booking creation. |
| Overselling | Seats are claimed by a conditional `UPDATE … WHERE seats_booked + n <= capacity` inside a transaction, so the database — not application code — arbitrates capacity under concurrency. |
| Open redirect | The `next` parameter after sign-in is accepted only when it is a same-origin path. |
| Error responses | Stack traces and driver messages are logged server-side and never returned; clients get a generic message and a stable error code. |
| Transport headers | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and HSTS are set for every response. |
| Configuration | The application refuses to boot with a missing or under-length `AUTH_SECRET` rather than signing sessions with a predictable key. |

## Known limitations

These are deliberate scope decisions for an academic project, documented rather
than hidden:

1. **Sessions are stateless.** There is no server-side session store, so
   changing a password does not invalidate tokens already issued. A revocation
   list or short-lived access tokens with refresh would be the production fix.
2. **The rate limiter is per-process.** Behind multiple replicas the effective
   limit multiplies by the replica count. The interface is narrow enough that
   swapping the in-memory map for Redis is a change to one file.
3. **No e-mail verification and no password reset.** Registration signs you
   straight in; there is no way to prove ownership of an address.
4. **No two-factor authentication.**
5. **No Content-Security-Policy header.** Next.js's inline bootstrap scripts
   require a nonce-based CSP to be genuinely strict, which is not wired up here.
6. **No audit log.** Administrator actions are not recorded.
7. **No payment processing of any kind**, and therefore none of the compliance
   surface that would come with it.

## Demonstration credentials

The seeded accounts (`admin@eventora.demo` / `demo@eventora.demo`) exist to make
the demo explorable. They are published in this repository, are attached to
fictional data, and must never be reused anywhere else or carried into a real
deployment.
