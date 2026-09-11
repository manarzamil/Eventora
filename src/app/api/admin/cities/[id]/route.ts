import { handleRoute, noContent, requireAdmin } from '@/server/api/http';
import { deleteCity } from '@/server/services/admin-service';

export const DELETE = handleRoute(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = await context.params;
    await deleteCity(id);
    return noContent();
  },
);
