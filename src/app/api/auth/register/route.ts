import { created, handleRoute, parseJson } from '@/server/api/http';
import { clientKey, rateLimit } from '@/server/api/rate-limit';
import { registerSchema } from '@/lib/validation';
import { register } from '@/server/services/auth-service';
import { setSessionCookie, signSession } from '@/server/auth/session';

export const POST = handleRoute(async (request: Request) => {
  rateLimit(clientKey(request, 'register'), { limit: 5, windowMs: 15 * 60_000 });

  const input = await parseJson(request, registerSchema);
  const user = await register(input);

  // Registering signs you straight in — there is no e-mail verification step in
  // this build, which is called out under Limitations in the README.
  await setSessionCookie(
    await signSession({ sub: user.id, email: user.email, name: user.fullName, role: user.role }),
  );

  return created(user);
});
