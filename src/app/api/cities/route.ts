import { handleRoute, ok } from '@/server/api/http';
import { listCities } from '@/server/services/event-service';

export const dynamic = 'force-dynamic';

export const GET = handleRoute(async (request: Request) => {
  const country = new URL(request.url).searchParams.get('country') ?? undefined;
  return ok(await listCities(country));
});
