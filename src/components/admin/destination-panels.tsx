'use client';

import { CreatePanel } from '@/components/admin/create-panel';
import { Field, Select, TextArea, TextInput } from '@/components/ui/field';

export function CreateCountryPanel() {
  return (
    <CreatePanel
      title="Add a country"
      description="ISO code and currency drive formatting everywhere else."
      endpoint="/api/admin/countries"
      submitLabel="Create country"
      fields={(errors) => (
        <>
          <Field label="Name" required error={errors.name}>
            {({ id, invalid }) => <TextInput id={id} name="name" invalid={invalid} />}
          </Field>
          <Field label="ISO code" required error={errors.code} hint="Two letters, e.g. QA.">
            {({ id, invalid }) => (
              <TextInput id={id} name="code" maxLength={2} placeholder="QA" invalid={invalid} />
            )}
          </Field>
          <Field label="Currency" required error={errors.currency} hint="Three letters, e.g. QAR.">
            {({ id, invalid }) => (
              <TextInput id={id} name="currency" maxLength={3} placeholder="QAR" invalid={invalid} />
            )}
          </Field>
          <Field label="Flag emoji" required error={errors.flagEmoji}>
            {({ id, invalid }) => (
              <TextInput id={id} name="flagEmoji" placeholder="🇶🇦" invalid={invalid} />
            )}
          </Field>
        </>
      )}
    />
  );
}

export function CreateCityPanel({ countries }: { countries: { id: string; name: string }[] }) {
  return (
    <CreatePanel
      title="Add a city"
      description="Coordinates and the IANA time zone are required — times are always shown locally."
      endpoint="/api/admin/cities"
      submitLabel="Create city"
      fields={(errors) => (
        <>
          <Field label="Country" required error={errors.countryId}>
            {({ id, invalid }) => (
              <Select id={id} name="countryId" invalid={invalid}>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Name" required error={errors.name}>
            {({ id, invalid }) => <TextInput id={id} name="name" invalid={invalid} />}
          </Field>
          <Field label="Time zone" required error={errors.timezone} hint="IANA, e.g. Asia/Qatar.">
            {({ id, invalid }) => (
              <TextInput id={id} name="timezone" placeholder="Asia/Qatar" invalid={invalid} />
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude" required error={errors.latitude}>
              {({ id, invalid }) => (
                <TextInput id={id} name="latitude" type="number" step="any" invalid={invalid} />
              )}
            </Field>
            <Field label="Longitude" required error={errors.longitude}>
              {({ id, invalid }) => (
                <TextInput id={id} name="longitude" type="number" step="any" invalid={invalid} />
              )}
            </Field>
          </div>
          <Field label="Introduction" required error={errors.blurb} className="sm:col-span-2">
            {({ id, invalid }) => <TextArea id={id} name="blurb" rows={2} invalid={invalid} />}
          </Field>
        </>
      )}
    />
  );
}

export function CreateVenuePanel({ cities }: { cities: { id: string; name: string }[] }) {
  return (
    <CreatePanel
      title="Add a venue"
      description="Events are attached to a venue, and a venue belongs to exactly one city."
      endpoint="/api/admin/venues"
      submitLabel="Create venue"
      fields={(errors) => (
        <>
          <Field label="City" required error={errors.cityId}>
            {({ id, invalid }) => (
              <Select id={id} name="cityId" invalid={invalid}>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Name" required error={errors.name}>
            {({ id, invalid }) => <TextInput id={id} name="name" invalid={invalid} />}
          </Field>
          <Field label="Address" required error={errors.address} className="sm:col-span-2">
            {({ id, invalid }) => <TextInput id={id} name="address" invalid={invalid} />}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude" required error={errors.latitude}>
              {({ id, invalid }) => (
                <TextInput id={id} name="latitude" type="number" step="any" invalid={invalid} />
              )}
            </Field>
            <Field label="Longitude" required error={errors.longitude}>
              {({ id, invalid }) => (
                <TextInput id={id} name="longitude" type="number" step="any" invalid={invalid} />
              )}
            </Field>
          </div>
        </>
      )}
    />
  );
}

export function CreateCategoryPanel({ iconNames }: { iconNames: string[] }) {
  return (
    <CreatePanel
      title="Add a category"
      description="The icon is stored by name and resolved on the client, so no deploy is needed."
      endpoint="/api/admin/categories"
      submitLabel="Create category"
      fields={(errors) => (
        <>
          <Field label="Name" required error={errors.name}>
            {({ id, invalid }) => <TextInput id={id} name="name" invalid={invalid} />}
          </Field>
          <Field label="Icon" required error={errors.icon}>
            {({ id, invalid }) => (
              <Select id={id} name="icon" invalid={invalid}>
                {iconNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Description" required error={errors.description} className="sm:col-span-2">
            {({ id, invalid }) => <TextArea id={id} name="description" rows={2} invalid={invalid} />}
          </Field>
          <Field label="Sort order" error={errors.sortOrder} hint="Lower numbers appear first.">
            {({ id, invalid }) => (
              <TextInput id={id} name="sortOrder" type="number" min="0" defaultValue={0} invalid={invalid} />
            )}
          </Field>
        </>
      )}
    />
  );
}
