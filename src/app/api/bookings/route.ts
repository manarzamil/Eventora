import { created, handleRoute, ok, parseJson, requireUser } from '@/server/api/http';
import { clientKey, rateLimit } from '@/server/api/rate-limit';
import { createBookingSchema } from '@/lib/validation';
import { createBooking, listBookingsForUser } from '@/server/services/booking-service';

export const dynamic = 'force-dynamic';

export const GET = handleRoute(async () => {
  const session = await requireUser();
  return ok(await listBookingsForUser(session.sub));
});

export const POST = handleRoute(async (request: Request) => {
  const session = await requireUser();
  rateLimit(clientKey(request, `booking:${session.sub}`), { limit: 20, windowMs: 60_000 });

  const input = await parseJson(request, createBookingSchema);
  const booking = await createBooking(session.sub, input);

  return created(booking);
});
