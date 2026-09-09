'use client'

import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
  trailingAction?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      hint,
      leadingIcon,
      trailingIcon,
      trailingAction,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5"
          >
            {label}
            {required && (
              <span className="text-[var(--color-error)] ml-0.5" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <div className="relative flex items-center">
          {leadingIcon && (
            <div
              className="absolute left-3 flex items-center justify-center pointer-events-none text-[var(--text-tertiary)] z-10"
              aria-hidden="true"
            >
              {leadingIcon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            ref={ref}
            disabled={disabled}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className={cn(
              'w-full bg-[var(--bg-raised)]',
              'border border-[var(--border-normal)]',
              'text-[var(--text-primary)]',
              'placeholder:text-[var(--text-tertiary)]',
              'transition-all duration-150 ease-out',
              'rounded-[var(--radius-md)]',
              'h-10 px-3 text-sm',
              'focus:outline-none focus:border-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)]',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-[var(--bg-surface)]',
              'read-only:cursor-default',
              error && 'border-[var(--color-error)] focus:ring-[var(--color-error)] focus:border-[var(--color-error)]',
              leadingIcon && 'pl-9',
              (trailingIcon || trailingAction) && 'pr-9',
              className
            )}
            {...props}
          />
          {trailingIcon && !trailingAction && (
            <div
              className="absolute right-3 flex items-center justify-center pointer-events-none text-[var(--text-tertiary)] z-10"
              aria-hidden="true"
            >
              {trailingIcon}
            </div>
          )}
          {trailingAction && (
            <div className="absolute right-3 flex items-center justify-center text-[var(--text-tertiary)] z-10">
              {trailingAction}
            </div>
          )}
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

Input.displayName = 'Input'
export { Input }