import { handleRoute, ok } from '@/server/api/http';
import { clearSessionCookie } from '@/server/auth/session';

export const POST = handleRoute(async () => {
  await clearSessionCookie();
  return ok({ signedOut: true });
});
