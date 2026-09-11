import clsx from 'clsx';

/**
 * The wordmark. The glyph is a stylised pin whose "pulse" rings double as a
 * calendar's ruled lines — place and time, which is the whole product in one
 * mark. Drawn inline as SVG so it inherits colour and never needs a raster.
 */
export function Logo({
  className,
  tone = 'dark',
}: {
  className?: string;
  tone?: 'dark' | 'light';
}) {
  return (
    <span className={clsx('inline-flex items-center gap-2', className)}>
      <span
        aria-hidden
        className={clsx(
          'grid h-8 w-8 place-items-center rounded-[0.6rem]',
          tone === 'dark'
            ? 'bg-gradient-to-br from-brand-500 to-brand-700'
            : 'bg-white/12 ring-1 ring-inset ring-white/25 backdrop-blur-sm',
        )}
      >
        <svg viewBox="0 0 24 24" className="h-[1.15rem] w-[1.15rem]" fill="none">
          <path
            d="M12 21s7-5.686 7-11a7 7 0 1 0-14 0c0 5.314 7 11 7 11Z"
            stroke="#fff"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M8.6 8.6h6.8M8.6 11.6h4.2" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </span>
      <span
        className={clsx(
          'text-[1.0625rem] font-semibold tracking-[-0.02em]',
          tone === 'dark' ? 'text-ink-950' : 'text-white',
        )}
      >
        Eventora
      </span>
    </span>
  );
}
