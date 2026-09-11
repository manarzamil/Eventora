/**
 * A single error vocabulary shared by every route handler.
 *
 * Throwing a typed `ApiError` from deep inside a service and translating it at
 * the edge (see `handleRoute`) keeps HTTP concerns out of the domain layer while
 * still producing precise status codes.
 */

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SOLD_OUT'
  | 'RATE_LIMITED'
  | 'INTERNAL';

const STATUS: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_FAILED: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SOLD_OUT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = STATUS[code];
    this.details = details;
  }
}

export const badRequest = (m: string, d?: unknown) => new ApiError('BAD_REQUEST', m, d);
export const unauthenticated = (m = 'You must be signed in to do that.') =>
  new ApiError('UNAUTHENTICATED', m);
export const forbidden = (m = 'You do not have access to this resource.') =>
  new ApiError('FORBIDDEN', m);
export const notFound = (m = 'Not found.') => new ApiError('NOT_FOUND', m);
export const conflict = (m: string, d?: unknown) => new ApiError('CONFLICT', m, d);
export const soldOut = (m: string, d?: unknown) => new ApiError('SOLD_OUT', m, d);
