import { handleRoute, ok, requireAdmin } from '@/server/api/http';
import { getAdminStats } from '@/server/services/admin-service';

export const dynamic = 'force-dynamic';

export const GET = handleRoute(async () => {
  await requireAdmin();
  return ok(await getAdminStats());
});
