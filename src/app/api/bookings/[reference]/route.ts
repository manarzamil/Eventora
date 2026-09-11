import { handleRoute, ok, requireUser } from '@/server/api/http';
import { getBookingByReference } from '@/server/services/booking-service';

export const dynamic = 'force-dynamic';

export const GET = handleRoute(
  async (_request: Request, context: { params: Promise<{ reference: string }> }) => {
    const session = await requireUser();
    const { reference } = await context.params;
    return ok(await getBookingByReference(reference, session.sub, session.role === 'ADMIN'));
  },
);
