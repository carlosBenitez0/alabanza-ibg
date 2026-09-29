'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SegmentOption<T extends string> {
  value: T
  label: ReactNode
  icon?: ReactNode
}

/** Two-to-four option toggle; full width on phones */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'grid auto-cols-fr grid-flow-col gap-1 p-1 rounded-[var(--radius-md)] bg-[var(--bg-raised)] border border-[var(--border-normal)] w-full sm:w-auto',
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 min-h-11 sm:min-h-8 px-3 rounded-[var(--radius)] text-sm sm:text-xs font-medium transition-colors whitespace-nowrap',
              active
                ? 'bg-[var(--text-primary)] text-[var(--text-inverse)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
