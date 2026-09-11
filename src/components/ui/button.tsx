import Link from 'next/link';
import clsx from 'clsx';
import type { ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse';
type Size = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 ' +
  'disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-[0_1px_2px_rgb(15_37_71/0.16)] hover:bg-brand-700 ' +
    'active:bg-brand-800 active:translate-y-px',
  secondary:
    'bg-white text-ink-900 border border-mist-300 hover:border-mist-400 hover:bg-mist-50 ' +
    'active:translate-y-px',
  ghost: 'text-ink-800 hover:bg-mist-100 active:bg-mist-200',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 active:translate-y-px',
  inverse:
    'bg-white/10 text-white border border-white/25 backdrop-blur-sm hover:bg-white/20 ' +
    'active:translate-y-px',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-lg',
  md: 'h-11 px-5 text-[0.9375rem] rounded-xl',
  lg: 'h-13 px-7 text-base rounded-xl',
};

export interface ButtonBaseProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}

export function buttonClass({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: Omit<ButtonBaseProps, 'children'>) {
  return clsx(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className);
}

export function Button({
  variant,
  size,
  fullWidth,
  className,
  children,
  ...rest
}: ButtonBaseProps & ComponentProps<'button'>) {
  return (
    <button className={buttonClass({ variant, size, fullWidth, className })} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  children,
  ...rest
}: ButtonBaseProps & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass({ variant, size, fullWidth, className })} {...rest}>
      {children}
    </Link>
  );
}
