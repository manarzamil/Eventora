import { handleRoute, ok, parseJson, requireUser } from '@/server/api/http';
import { clientKey, rateLimit } from '@/server/api/rate-limit';
import { changePasswordSchema } from '@/lib/validation';
import { changePassword } from '@/server/services/auth-service';

export const POST = handleRoute(async (request: Request) => {
  const session = await requireUser();
  rateLimit(clientKey(request, `password:${session.sub}`), { limit: 5, windowMs: 15 * 60_000 });

  const input = await parseJson(request, changePasswordSchema);
  await changePassword(session.sub, input);

  return ok({ updated: true });
});
