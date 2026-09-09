'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'icon'
  loading?: boolean
  iconPosition?: 'left' | 'right'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'default',
      loading,
      disabled,
      children,
      iconPosition = 'left',
      ...props
    },
    ref
  ) => {
    const baseStyles = [
      'inline-flex items-center justify-center font-medium',
      'transition-all duration-150 ease-out',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--bg-page)]',
      'disabled:pointer-events-none disabled:opacity-30 disabled:cursor-not-allowed',
      'active:scale-[0.97]',
      'cursor-pointer',
    ].join(' ')

    const variants = {
      primary: [
        'bg-[var(--text-primary)] text-[var(--text-inverse)]',
        'hover:bg-[var(--color-gs-12)]',
        'shadow-none',
      ].join(' '),
      secondary: [
        'bg-[var(--bg-raised)] text-[var(--text-primary)]',
        'hover:bg-[var(--bg-hover)]',
        'border border-[var(--border-normal)]',
      ].join(' '),
      outline: [
        'bg-transparent text-[var(--text-secondary)]',
        'border border-[var(--border-strong)]',
        'hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]',
      ].join(' '),
      ghost: [
        'bg-transparent text-[var(--text-secondary)]',
        'hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]',
      ].join(' '),
      destructive: [
        'bg-[var(--color-error)] text-white',
        'hover:bg-[var(--color-error-dark)]',
      ].join(' '),
    }

    const sizes = {
      sm:      'h-8 px-3 text-xs gap-1.5 rounded-[var(--radius)]',
      default: 'h-9 px-4 text-sm gap-2 rounded-[var(--radius-md)]',
      lg:      'h-10 px-5 text-sm gap-2 rounded-[var(--radius-md)]',
      xl:      'h-12 px-6 text-base gap-2.5 rounded-[var(--radius-lg)]',
      icon:    'h-9 w-9 rounded-[var(--radius-md)]',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-3.5 w-3.5 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { Button }