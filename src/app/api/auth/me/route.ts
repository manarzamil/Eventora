import { handleRoute, ok, parseJson, requireUser } from '@/server/api/http';
import { updateProfileSchema } from '@/lib/validation';
import { getUserById, updateProfile } from '@/server/services/auth-service';
import { readSession, setSessionCookie, signSession } from '@/server/auth/session';

export const GET = handleRoute(async () => {
  const session = await readSession();
  if (!session) return ok(null);
  return ok(await getUserById(session.sub));
});

export const PATCH = handleRoute(async (request: Request) => {
  const session = await requireUser();
  const input = await parseJson(request, updateProfileSchema);
  const user = await updateProfile(session.sub, input);

  // The display name lives in the token, so re-issue it after a name change.
  await setSessionCookie(
    await signSession({ sub: user.id, email: user.email, name: user.fullName, role: user.role }),
  );

  return ok(user);
});
