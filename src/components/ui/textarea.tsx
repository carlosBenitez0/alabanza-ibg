'use client'

import { forwardRef, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
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
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const errorId = `${textareaId}-error`
    const hintId = `${textareaId}-hint`

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5"
          >
            {label}
            {required && (
              <span className="text-[var(--color-error)] ml-0.5" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <textarea
          id={textareaId}
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
            'p-3 text-sm',
            'focus:outline-none focus:border-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)]',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-[var(--bg-surface)]',
            'read-only:cursor-default',
            'resize-y min-h-[100px]',
            error && 'border-[var(--color-error)] focus:ring-[var(--color-error)] focus:border-[var(--color-error)]',
            className
          )}
          {...props}
        />
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

Textarea.displayName = 'Textarea'
export { Textarea }