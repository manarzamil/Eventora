import { z } from 'zod';
import { handleRoute, ok, parseJson, requireUser } from '@/server/api/http';
import { listFavorites, toggleFavorite } from '@/server/services/favorite-service';

export const dynamic = 'force-dynamic';

const toggleSchema = z.object({ eventId: z.string().min(1).max(30) });

export const GET = handleRoute(async () => {
  const session = await requireUser();
  return ok(await listFavorites(session.sub));
});

export const POST = handleRoute(async (request: Request) => {
  const session = await requireUser();
  const { eventId } = await parseJson(request, toggleSchema);
  return ok(await toggleFavorite(session.sub, eventId));
});
