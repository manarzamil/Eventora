import { handleRoute, noContent, ok, parseJson, requireAdmin } from '@/server/api/http';
import { adminCategorySchema } from '@/lib/validation';
import { deleteCategory, updateCategory } from '@/server/services/admin-service';

type Context = { params: Promise<{ id: string }> };

export const PUT = handleRoute(async (request: Request, context: Context) => {
  await requireAdmin();
  const { id } = await context.params;
  return ok(await updateCategory(id, await parseJson(request, adminCategorySchema)));
});

export const DELETE = handleRoute(async (_request: Request, context: Context) => {
  await requireAdmin();
  const { id } = await context.params;
  await deleteCategory(id);
  return noContent();
});
