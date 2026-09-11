import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

export function StatTile({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: LucideIcon;
  tone?: 'default' | 'brand' | 'warn';
}) {
  return (
    <div className="rounded-2xl border border-mist-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-mist-500">{label}</p>
          <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums text-ink-950">
            {value}
          </p>
          {sublabel && <p className="mt-1 truncate text-xs text-mist-500">{sublabel}</p>}
        </div>
        <span
          className={clsx(
            'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
            tone === 'brand' && 'bg-brand-50 text-brand-600',
            tone === 'warn' && 'bg-warn-50 text-warn-700',
            tone === 'default' && 'bg-mist-100 text-mist-600',
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden />
        </span>
      </div>
    </div>
  );
}

/**
 * A minimal column chart drawn with divs.
 *
 * A charting library would be ~50 kB of JavaScript for fourteen bars whose
 * only interaction is a native tooltip. The accessible fallback is a real
 * table, visually hidden, so the data is available to a screen reader rather
 * than being locked inside decorative markup.
 */
export function MiniBarChart({
  data,
  label,
}: {
  data: { day: string; bookings: number }[];
  label: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.bookings));
  // Bar heights are computed in pixels rather than percentages: a percentage
  // height inside a stretched flex item is under-specified in CSS and collapses
  // to zero in some engines, which silently renders an empty chart.
  const PLOT_HEIGHT = 128;

  return (
    <figure>
      <div
        className="flex items-end gap-1.5"
        style={{ height: `${PLOT_HEIGHT}px` }}
        role="presentation"
      >
        {data.map((point) => {
          const height =
            point.bookings === 0
              ? 2
              : Math.max(8, Math.round((point.bookings / max) * PLOT_HEIGHT));
          return (
            <div
              key={point.day}
              className={
                point.bookings === 0
                  ? 'flex-1 rounded-t-md bg-mist-200'
                  : 'flex-1 rounded-t-md bg-brand-500 transition-colors hover:bg-brand-600'
              }
              // A zero day still shows a 2px stub, so the axis reads as a
              // continuous series rather than a gap in the data.
              style={{ height: `${height}px` }}
              title={`${point.day}: ${point.bookings}`}
            />
          );
        })}
      </div>

      <div className="mt-1.5 flex gap-1.5" aria-hidden>
        {data.map((point) => (
          <span
            key={point.day}
            className="flex-1 text-center text-[0.625rem] tabular-nums text-mist-400"
          >
            {point.day.slice(8)}
          </span>
        ))}
      </div>

      <figcaption className="sr-only">
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Bookings</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.day}>
                <th scope="row">{point.day}</th>
                <td>{point.bookings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
