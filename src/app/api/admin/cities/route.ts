import { created, handleRoute, ok, parseJson, requireAdmin } from '@/server/api/http';
import { adminCitySchema } from '@/lib/validation';
import { createCity } from '@/server/services/admin-service';
import { listCities } from '@/server/services/event-service';

export const dynamic = 'force-dynamic';

export const GET = handleRoute(async (request: Request) => {
  await requireAdmin();
  const country = new URL(request.url).searchParams.get('country') ?? undefined;
  return ok(await listCities(country));
});

export const POST = handleRoute(async (request: Request) => {
  await requireAdmin();
  return created(await createCity(await parseJson(request, adminCitySchema)));
});
