import { created, handleRoute, ok, parseJson, requireAdmin } from '@/server/api/http';
import { adminVenueSchema } from '@/lib/validation';
import { createVenue, listVenues } from '@/server/services/admin-service';

export const dynamic = 'force-dynamic';

export const GET = handleRoute(async (request: Request) => {
  await requireAdmin();
  const cityId = new URL(request.url).searchParams.get('cityId') ?? undefined;
  return ok(await listVenues(cityId));
});

export const POST = handleRoute(async (request: Request) => {
  await requireAdmin();
  return created(await createVenue(await parseJson(request, adminVenueSchema)));
});
