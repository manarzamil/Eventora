import { created, handleRoute, ok, parseJson, requireAdmin } from '@/server/api/http';
import { adminCountrySchema } from '@/lib/validation';
import { createCountry } from '@/server/services/admin-service';
import { listCountries } from '@/server/services/event-service';

export const dynamic = 'force-dynamic';

export const GET = handleRoute(async () => {
  await requireAdmin();
  return ok(await listCountries());
});

export const POST = handleRoute(async (request: Request) => {
  await requireAdmin();
  return created(await createCountry(await parseJson(request, adminCountrySchema)));
});
