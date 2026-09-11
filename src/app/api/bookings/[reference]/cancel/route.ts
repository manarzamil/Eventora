import { handleRoute, ok, requireUser } from '@/server/api/http';
import { cancelBooking, getBookingByReference } from '@/server/services/booking-service';

export const POST = handleRoute(
  async (_request: Request, context: { params: Promise<{ reference: string }> }) => {
    const session = await requireUser();
    const { reference } = await context.params;
    const isAdmin = session.role === 'ADMIN';

    // Resolve by reference first so that ownership is checked before anything
    // is mutated, and so a stranger's reference reads as "not found".
    const booking = await getBookingByReference(reference, session.sub, isAdmin);
    return ok(await cancelBooking(booking.id, session.sub, isAdmin));
  },
);
