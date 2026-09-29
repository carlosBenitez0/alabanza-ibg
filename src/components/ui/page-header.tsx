import { ReactNode, Ref } from 'react'
import { cn } from '@/lib/utils'

/**
 * Page title + description + actions. On phones actions stack full width
 * under the title; from `md` up they sit to the right.
 */
export function PageHeader({
  title,
  description,
  actions,
  icon,
  actionsDesktopOnly,
  className,
  ref,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  icon?: ReactNode
  /** Hide actions below `lg` (when a Fab carries the primary action on phones) */
  actionsDesktopOnly?: boolean
  className?: string
  ref?: Ref<HTMLDivElement>
}) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-[var(--border-subtle)] pb-5 sm:pb-6',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2 text-balance">
          {icon}
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[var(--text-secondary)] mt-1 text-pretty">{description}</p>
        )}
      </div>
      {actions && (
        <div
          className={cn(
            'flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center md:justify-end [&>*]:w-full sm:[&>*]:w-auto',
            actionsDesktopOnly && 'hidden lg:flex'
          )}
        >
          {actions}
        </div>
      )}
    </div>
  )
}
