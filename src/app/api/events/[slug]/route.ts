import { handleRoute, ok } from '@/server/api/http';
import { getEventBySlug } from '@/server/services/event-service';

export const dynamic = 'force-dynamic';

export const GET = handleRoute(
  async (_request: Request, context: { params: Promise<{ slug: string }> }) => {
    const { slug } = await context.params;
    return ok(await getEventBySlug(slug));
  },
);
