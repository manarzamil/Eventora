import { handleRoute, ok } from '@/server/api/http';
import { listCountries } from '@/server/services/event-service';

export const dynamic = 'force-dynamic';

export const GET = handleRoute(async () => ok(await listCountries()));
