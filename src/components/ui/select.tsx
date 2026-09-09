'use client'

import { forwardRef, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
  placeholder?: string
  label?: string
  error?: string
  hint?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      options,
      placeholder,
      label,
      error,
      hint,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const errorId = `${selectId}-error`
    const hintId = `${selectId}-hint`

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5"
          >
            {label}
            {required && (
              <span className="text-[var(--color-error)] ml-0.5" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className={cn(
              'w-full bg-[var(--bg-raised)]',
              'border border-[var(--border-normal)]',
              'text-[var(--text-primary)]',
              'transition-all duration-150 ease-out',
              'rounded-[var(--radius-md)]',
              'py-2 pl-3 pr-10 text-sm',
              'appearance-none',
              'focus:outline-none focus:border-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)]',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-[var(--bg-surface)]',
              error && 'border-[var(--color-error)] focus:ring-[var(--color-error)] focus:border-[var(--color-error)]',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="bg-[var(--bg-surface)] text-[var(--text-tertiary)]">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value} 
                disabled={option.disabled}
                className="bg-[var(--bg-raised)] text-[var(--text-primary)]"
              >
                {option.label}
              </option>
            ))}
          </select>
          <div
            className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[var(--text-tertiary)]"
            aria-hidden="true"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
            </svg>
          </div>
        </div>
        {error && (
          <p
            id={errorId}
            className="mt-1.5 text-xs text-[var(--color-error)] flex items-center gap-1"
            role="alert"
          >
            <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-xs text-[var(--text-tertiary)]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
export { Select }