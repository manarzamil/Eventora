import { created, handleRoute, ok, parseJson, requireAdmin } from '@/server/api/http';
import { adminEventSchema } from '@/lib/validation';
import { createEvent, listAdminEvents } from '@/server/services/admin-service';

export const dynamic = 'force-dynamic';

export const GET = handleRoute(async (request: Request) => {
  await requireAdmin();
  const params = new URL(request.url).searchParams;
  const result = await listAdminEvents({
    q: params.get('q') ?? undefined,
    status: params.get('status') ?? undefined,
    cityId: params.get('cityId') ?? undefined,
    page: Number(params.get('page') ?? 1),
    perPage: Number(params.get('perPage') ?? 20),
  });
  return ok(result.items, { total: result.total, page: result.page, pageCount: result.pageCount });
});

export const POST = handleRoute(async (request: Request) => {
  await requireAdmin();
  const input = await parseJson(request, adminEventSchema);
  return created(await createEvent(input));
});
