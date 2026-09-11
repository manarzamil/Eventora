import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getEnv } from '@/server/env';
import type { Role } from '@/server/db/schema';

export const SESSION_COOKIE = 'eventora_session';

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(getEnv().AUTH_SECRET);
}

/** Signs a short-lived HS256 token carrying the caller's identity and role. */
export async function signSession(payload: SessionPayload): Promise<string> {
  const ttl = getEnv().AUTH_SESSION_TTL_SECONDS;
  return new SignJWT({ email: payload.email, name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setIssuer('eventora')
    .setAudience('eventora-web')
    .setExpirationTime(`${ttl}s`)
    .sign(secretKey());
}

/** Returns the payload if the token is valid and unexpired, otherwise null. */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: 'eventora',
      audience: 'eventora-web',
      algorithms: ['HS256'],
    });
    if (typeof payload.sub !== 'string') return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ''),
      name: String(payload.name ?? ''),
      role: (payload.role === 'ADMIN' ? 'ADMIN' : 'USER') as Role,
    };
  } catch {
    // Signature failure, expiry, wrong issuer — all are simply "not signed in".
    return null;
  }
}

/**
 * Writes the session cookie.
 *
 * `httpOnly` keeps the token out of reach of any script on the page, which is
 * what makes an XSS bug non-fatal for sessions. `sameSite: 'lax'` blocks the
 * cookie from riding along on cross-site POSTs, which is the CSRF defence for
 * every mutating route in this application.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: getEnv().AUTH_SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/** Reads and verifies the session cookie on the current request. */
export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}
