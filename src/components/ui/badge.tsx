'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'brand'
  size?: 'sm' | 'default' | 'lg'
  dot?: boolean
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'default', dot, children, ...props }, ref) => {
    const variants = {
      default: 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]',
      secondary: 'bg-[var(--bg-active)] text-[var(--text-primary)] border border-[var(--border-normal)]',
      brand: 'bg-[var(--color-gs-3)] text-[var(--color-gs-11)] border border-[var(--color-gs-5)]',
      outline: 'text-[var(--text-secondary)] border border-[var(--border-normal)] bg-transparent',
      destructive: 'bg-[var(--color-error-dark)]/30 text-[var(--color-error)] border border-[var(--color-error)]/40',
      success: 'bg-[var(--color-success-dark)]/30 text-[var(--color-success)] border border-[var(--color-success)]/40',
      warning: 'bg-[var(--color-warning-dark)]/30 text-[var(--color-warning)] border border-[var(--color-warning)]/40',
      info: 'bg-[var(--color-info-dark)]/30 text-[var(--color-info)] border border-[var(--color-info)]/40',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs gap-1',
      default: 'px-2.5 py-0.5 text-xs gap-1.5',
      lg: 'px-3 py-1 text-sm gap-2',
    }

    const dotColors = {
      default: 'bg-[var(--text-tertiary)]',
      secondary: 'bg-[var(--text-primary)]',
      brand: 'bg-[var(--color-gs-11)]',
      outline: 'bg-[var(--text-tertiary)]',
      destructive: 'bg-[var(--color-error)]',
      success: 'bg-[var(--color-success)]',
      warning: 'bg-[var(--color-warning)]',
      info: 'bg-[var(--color-info)]',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          'transition-colors duration-150',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full flex-shrink-0',
              dotColors[variant]
            )}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
export { Badge }