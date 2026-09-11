import { handleRoute, ok, parseJson, requireAdmin } from '@/server/api/http';
import { adminUserUpdateSchema } from '@/lib/validation';
import { setUserRole } from '@/server/services/admin-service';

export const PATCH = handleRoute(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const session = await requireAdmin();
    const { id } = await context.params;
    const { role } = await parseJson(request, adminUserUpdateSchema);
    return ok(await setUserRole(id, role, session.sub));
  },
);
