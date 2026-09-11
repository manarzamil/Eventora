import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';
import { ApiError, badRequest, forbidden, unauthenticated } from '@/server/api/errors';
import { readSession, type SessionPayload } from '@/server/auth/session';

/* -------------------------------------------------------------------------- */
/* Response envelope                                                          */
/* -------------------------------------------------------------------------- */

export interface ApiSuccess<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  error: { code: string; message: string; details?: unknown };
}

export function ok<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json<ApiSuccess<T>>(meta ? { data, meta } : { data }, { status });
}

export function created<T>(data: T) {
  return ok(data, undefined, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

/* -------------------------------------------------------------------------- */
/* Route wrapper                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Wraps a route handler so that every thrown error becomes a consistent JSON
 * body with the right status. Unexpected errors are logged server-side and
 * reported to the client as a generic 500 — stack traces and driver messages
 * never cross the network, because they leak schema details.
 */
export function handleRoute<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json<ApiFailure>(
          { error: { code: error.code, message: error.message, details: error.details } },
          { status: error.status },
        );
      }

      if (error instanceof ZodError) {
        return NextResponse.json<ApiFailure>(
          {
            error: {
              code: 'VALIDATION_FAILED',
              message: 'Some fields need attention.',
              details: fieldErrors(error),
            },
          },
          { status: 422 },
        );
      }

      console.error('[api] unhandled error', error);
      return NextResponse.json<ApiFailure>(
        { error: { code: 'INTERNAL', message: 'Something went wrong on our side.' } },
        { status: 500 },
      );
    }
  };
}

/** Flattens a ZodError into `{ fieldName: "first message" }` for form display. */
export function fieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Input parsing                                                              */
/* -------------------------------------------------------------------------- */

/** Parses and validates a JSON request body. Never trusts `Content-Type`. */
export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw badRequest('Request body must be valid JSON.');
  }
  return schema.parse(raw);
}

/** Parses and validates the query string. */
export function parseQuery<T>(request: Request, schema: ZodType<T>): T {
  const url = new URL(request.url);
  const raw: Record<string, string | string[]> = {};
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    raw[key] = values.length > 1 ? values : values[0]!;
  }
  return schema.parse(raw);
}

/* -------------------------------------------------------------------------- */
/* Access control                                                             */
/* -------------------------------------------------------------------------- */

/** Requires any signed-in user. */
export async function requireUser(): Promise<SessionPayload> {
  const session = await readSession();
  if (!session) throw unauthenticated();
  return session;
}

/** Requires a signed-in user whose role is ADMIN. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireUser();
  if (session.role !== 'ADMIN') throw forbidden('Administrator access is required.');
  return session;
}
