import { created, handleRoute, ok, parseJson, requireAdmin } from '@/server/api/http';
import { adminSessionSchema } from '@/lib/validation';
import { createEventSession, listEventSessions } from '@/server/services/admin-service';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export const GET = handleRoute(async (_request: Request, context: Context) => {
  await requireAdmin();
  const { id } = await context.params;
  return ok(await listEventSessions(id));
});

export const POST = handleRoute(async (request: Request, context: Context) => {
  await requireAdmin();
  const { id } = await context.params;
  const input = await parseJson(request, adminSessionSchema);
  return created(await createEventSession(id, input));
});
