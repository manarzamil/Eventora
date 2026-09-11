import { handleRoute, ok, requireAdmin } from '@/server/api/http';
import { listUsers } from '@/server/services/admin-service';

export const dynamic = 'force-dynamic';

export const GET = handleRoute(async (request: Request) => {
  await requireAdmin();
  const q = new URL(request.url).searchParams.get('q') ?? undefined;
  return ok(await listUsers(q));
});
