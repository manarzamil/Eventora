import { handleRoute, ok } from '@/server/api/http';
import { listCategories } from '@/server/services/event-service';

export const dynamic = 'force-dynamic';

export const GET = handleRoute(async (request: Request) => {
  const city = new URL(request.url).searchParams.get('city') ?? undefined;
  return ok(await listCategories(city));
});
