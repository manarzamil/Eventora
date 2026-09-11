import { handleRoute, ok, requireAdmin } from '@/server/api/http';
import { listAllBookings } from '@/server/services/admin-service';

export const dynamic = 'force-dynamic';

export const GET = handleRoute(async (request: Request) => {
  await requireAdmin();
  const params = new URL(request.url).searchParams;
  return ok(
    await listAllBookings({
      q: params.get('q') ?? undefined,
      status: params.get('status') ?? undefined,
    }),
  );
});
