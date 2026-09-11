import { created, handleRoute, ok, parseJson, requireAdmin } from '@/server/api/http';
import { adminCategorySchema } from '@/lib/validation';
import { createCategory } from '@/server/services/admin-service';
import { listCategories } from '@/server/services/event-service';

export const dynamic = 'force-dynamic';

export const GET = handleRoute(async () => {
  await requireAdmin();
  return ok(await listCategories());
});

export const POST = handleRoute(async (request: Request) => {
  await requireAdmin();
  return created(await createCategory(await parseJson(request, adminCategorySchema)));
});
