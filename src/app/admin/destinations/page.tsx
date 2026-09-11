import { listVenues } from '@/server/services/admin-service';
import { listCities, listCountries } from '@/server/services/event-service';
import {
  CreateCityPanel,
  CreateCountryPanel,
  CreateVenuePanel,
} from '@/components/admin/destination-panels';
import { ApiActionButton } from '@/components/admin/api-action-button';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Destinations' };

export default async function AdminDestinationsPage() {
  const [countries, cities, venues] = await Promise.all([
    listCountries(),
    listCities(),
    listVenues(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-ink-950">Destinations</h2>
        <p className="mt-0.5 text-sm text-mist-600">
          Countries, cities and venues. A record with events attached cannot be deleted — move the
          events first.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <CreateCountryPanel />
        <CreateCityPanel countries={countries.map((c) => ({ id: c.id, name: c.name }))} />
        <CreateVenuePanel
          cities={cities.map((c) => ({ id: c.id, name: `${c.name} — ${c.country.name}` }))}
        />
      </div>

      {/* Countries */}
      <section className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
        <h3 className="border-b border-mist-200 px-5 py-3.5 text-sm font-semibold text-ink-950">
          Countries ({countries.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-mist-200 bg-mist-50 text-xs uppercase tracking-wide text-mist-500">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-semibold">Country</th>
                <th scope="col" className="px-5 py-2.5 font-semibold">Code</th>
                <th scope="col" className="px-5 py-2.5 font-semibold">Currency</th>
                <th scope="col" className="px-5 py-2.5 text-right font-semibold">Cities</th>
                <th scope="col" className="px-5 py-2.5 text-right font-semibold">Events</th>
                <th scope="col" className="px-5 py-2.5 text-right font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist-200">
              {countries.map((country) => (
                <tr key={country.id}>
                  <td className="px-5 py-3 font-medium text-ink-900">
                    <span className="mr-2" aria-hidden>{country.flagEmoji}</span>
                    {country.name}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-mist-600">{country.code}</td>
                  <td className="px-5 py-3 font-mono text-xs text-mist-600">{country.currency}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-mist-700">
                    {country.cityCount}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-mist-700">
                    {country.eventCount}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <ApiActionButton
                      endpoint={`/api/admin/countries/${country.id}`}
                      method="DELETE"
                      label="Delete"
                      variant="ghost"
                      confirmLabel="Delete"
                      confirmMessage="Delete this country and its cities?"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Cities */}
      <section className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
        <h3 className="border-b border-mist-200 px-5 py-3.5 text-sm font-semibold text-ink-950">
          Cities ({cities.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="border-b border-mist-200 bg-mist-50 text-xs uppercase tracking-wide text-mist-500">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-semibold">City</th>
                <th scope="col" className="px-5 py-2.5 font-semibold">Country</th>
                <th scope="col" className="px-5 py-2.5 font-semibold">Time zone</th>
                <th scope="col" className="px-5 py-2.5 text-right font-semibold">Events</th>
                <th scope="col" className="px-5 py-2.5 text-right font-semibold">Venues</th>
                <th scope="col" className="px-5 py-2.5 text-right font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist-200">
              {cities.map((city) => (
                <tr key={city.id}>
                  <td className="px-5 py-3 font-medium text-ink-900">{city.name}</td>
                  <td className="px-5 py-3 text-mist-700">{city.country.name}</td>
                  <td className="px-5 py-3 font-mono text-xs text-mist-600">{city.timezone}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-mist-700">
                    {city.eventCount}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-mist-700">
                    {venues.filter((v) => v.cityId === city.id).length}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <ApiActionButton
                      endpoint={`/api/admin/cities/${city.id}`}
                      method="DELETE"
                      label="Delete"
                      variant="ghost"
                      confirmLabel="Delete"
                      confirmMessage="Delete this city and its venues?"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Venues */}
      <section className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
        <h3 className="border-b border-mist-200 px-5 py-3.5 text-sm font-semibold text-ink-950">
          Venues ({venues.length})
        </h3>
        <ul className="divide-y divide-mist-200">
          {venues.map((venue) => (
            <li key={venue.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink-900">{venue.name}</span>
                <span className="block truncate text-xs text-mist-500">{venue.address}</span>
              </span>
              <span className="shrink-0 rounded-full bg-mist-100 px-2.5 py-1 text-xs text-mist-600">
                {venue.cityName}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
