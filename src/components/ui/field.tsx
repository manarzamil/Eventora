'use client';

import clsx from 'clsx';
import { useId, type ComponentProps, type ReactNode } from 'react';

const CONTROL =
  'w-full rounded-xl border bg-white px-3.5 text-[0.9375rem] text-ink-950 transition-colors ' +
  'placeholder:text-mist-400 focus:outline-none focus:ring-4 focus:ring-brand-100 ' +
  'focus:border-brand-500 disabled:bg-mist-100 disabled:text-mist-500';

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={clsx('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink-900">
        {label}
        {required && <span className="ml-0.5 text-danger-600">*</span>}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-mist-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput({
  invalid,
  className,
  ...rest
}: ComponentProps<'input'> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={clsx(CONTROL, 'h-11', invalid ? 'border-danger-500' : 'border-mist-300', className)}
      {...rest}
    />
  );
}

export function TextArea({
  invalid,
  className,
  ...rest
}: ComponentProps<'textarea'> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={clsx(
        CONTROL,
        'min-h-24 py-2.5 leading-relaxed',
        invalid ? 'border-danger-500' : 'border-mist-300',
        className,
      )}
      {...rest}
    />
  );
}

export function Select({
  invalid,
  className,
  children,
  ...rest
}: ComponentProps<'select'> & { invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={clsx(
        CONTROL,
        'h-11 appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-9',
        invalid ? 'border-danger-500' : 'border-mist-300',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%235b6a7f' stroke-width='2'%3E%3Cpath d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
      }}
      {...rest}
    >
      {children}
    </select>
  );
}

/** Non-blocking inline message used for form-level success and failure. */
export function Notice({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'success' | 'info';
  children: ReactNode;
}) {
  const styles = {
    error: 'bg-danger-50 text-danger-700 border-danger-500/25',
    success: 'bg-success-50 text-success-700 border-success-500/25',
    info: 'bg-brand-50 text-brand-800 border-brand-500/20',
  }[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={clsx('rounded-xl border px-4 py-3 text-sm font-medium', styles)}
    >
      {children}
    </div>
  );
}
