import { handleRoute, ok, parseQuery } from '@/server/api/http';
import { eventQuerySchema } from '@/lib/validation';
import { listEvents } from '@/server/services/event-service';

export const dynamic = 'force-dynamic';

export const GET = handleRoute(async (request: Request) => {
  const query = parseQuery(request, eventQuerySchema);
  const result = await listEvents(query);
  return ok(result.items, {
    total: result.total,
    page: result.page,
    perPage: result.perPage,
    pageCount: result.pageCount,
  });
});
