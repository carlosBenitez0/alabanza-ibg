'use client'

import { forwardRef, InputHTMLAttributes, ReactNode, useId } from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  description?: ReactNode
}

/** Checkbox styled as a switch; the whole row is the tap target */
const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, className, id, disabled, ...props }, ref) => {
    const autoId = useId()
    const inputId = id || autoId

    return (
      <label
        htmlFor={inputId}
        className={cn(
          'flex items-center justify-between gap-4 py-2 min-h-11 cursor-pointer select-none',
          disabled && 'opacity-40 cursor-not-allowed',
          className
        )}
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium text-[var(--text-primary)]">{label}</span>
          {description && (
            <span className="block text-xs sm:text-sm text-[var(--text-tertiary)] mt-0.5">{description}</span>
          )}
        </span>
        <span className="relative inline-flex shrink-0 items-center">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            role="switch"
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <span
            aria-hidden="true"
            className={cn(
              'h-7 w-12 sm:h-6 sm:w-11 rounded-full border border-[var(--border-strong)] bg-[var(--bg-active)] transition-colors',
              'peer-checked:bg-[var(--text-primary)] peer-checked:border-[var(--text-primary)]',
              'peer-focus-visible:ring-1 peer-focus-visible:ring-[var(--focus-ring)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--bg-page)]'
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute left-0.5 top-1/2 -translate-y-1/2 h-6 w-6 sm:h-5 sm:w-5 rounded-full bg-[var(--text-secondary)] transition-transform',
              'peer-checked:translate-x-5 peer-checked:bg-[var(--text-inverse)]'
            )}
          />
        </span>
      </label>
    )
  }
)

Switch.displayName = 'Switch'
export { Switch }
