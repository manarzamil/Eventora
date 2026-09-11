import { handleRoute, ok, parseJson } from '@/server/api/http';
import { clientKey, rateLimit } from '@/server/api/rate-limit';
import { loginSchema } from '@/lib/validation';
import { login } from '@/server/services/auth-service';
import { setSessionCookie, signSession } from '@/server/auth/session';

export const POST = handleRoute(async (request: Request) => {
  // Ten attempts per quarter hour per address: generous for a person who has
  // forgotten which password they used, useless for a credential-stuffing run.
  rateLimit(clientKey(request, 'login'), { limit: 10, windowMs: 15 * 60_000 });

  const input = await parseJson(request, loginSchema);
  const user = await login(input);

  await setSessionCookie(
    await signSession({ sub: user.id, email: user.email, name: user.fullName, role: user.role }),
  );

  return ok(user);
});
