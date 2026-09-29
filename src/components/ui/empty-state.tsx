import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-5 py-10 sm:py-14 text-center',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--bg-surface)] border border-[var(--border-normal)] flex items-center justify-center text-[var(--text-secondary)] [&>svg]:w-6 [&>svg]:h-6">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1 text-balance">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--text-tertiary)] max-w-sm mx-auto text-pretty">{description}</p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}
