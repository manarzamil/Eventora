import { handleRoute, ok, parseJson, requireAdmin } from '@/server/api/http';
import { adminEventSchema } from '@/lib/validation';
import { deleteEvent, updateEvent } from '@/server/services/admin-service';

type Context = { params: Promise<{ id: string }> };

export const PUT = handleRoute(async (request: Request, context: Context) => {
  await requireAdmin();
  const { id } = await context.params;
  const input = await parseJson(request, adminEventSchema);
  return ok(await updateEvent(id, input));
});

export const DELETE = handleRoute(async (_request: Request, context: Context) => {
  await requireAdmin();
  const { id } = await context.params;
  return ok(await deleteEvent(id));
});
