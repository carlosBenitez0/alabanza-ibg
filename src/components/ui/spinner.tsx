import { cn } from '@/lib/utils'

export function Spinner({ className, label = 'Cargando' }: { className?: string; label?: string }) {
  return (
    <div className={cn('relative w-8 h-8', className)} role="status" aria-label={label}>
      <div className="absolute inset-0 border-2 border-[var(--border-strong)] rounded-full" />
      <div className="absolute inset-0 border-2 border-[var(--text-primary)] rounded-full animate-spin border-t-transparent" />
    </div>
  )
}

/** A shimmering placeholder block */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-[var(--radius)]', className)} aria-hidden="true" />
}

function SkeletonRows({ rows }: { rows: number }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-raised)] divide-y divide-[var(--border-subtle)] overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 min-h-16 px-4 py-3">
          <Skeleton className="w-10 h-10 shrink-0 rounded-[var(--radius-md)]" />
          <div className="flex-1 space-y-2">
            {/* Varying widths read as real content, not a grid of bars */}
            <Skeleton className={cn('h-3.5', ['w-2/3', 'w-1/2', 'w-3/5', 'w-2/5'][i % 4])} />
            <Skeleton className={cn('h-3', ['w-1/3', 'w-1/4', 'w-2/5', 'w-1/5'][i % 4])} />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * What a page looks like while its data loads: the shape of the content
 * instead of a spinner, so the layout doesn't jump when it arrives.
 * - `page` (default): header + list, for pages that render nothing until loaded
 * - `list`: rows only, for a section under a header that is already visible
 * - `fullScreen`: spinner, only for the initial session check
 */
export function PageLoader({
  fullScreen,
  variant = 'page',
  rows = 4,
  className,
}: {
  fullScreen?: boolean
  variant?: 'page' | 'list'
  rows?: number
  className?: string
}) {
  if (fullScreen) {
    return (
      <div className={cn('flex items-center justify-center min-h-dvh bg-[var(--bg-page)]', className)}>
        <Spinner />
      </div>
    )
  }

  return (
    <div className={cn('space-y-5 sm:space-y-6', className)} role="status" aria-label="Cargando">
      {variant === 'page' && (
        <div className="space-y-2.5 border-b border-[var(--border-subtle)] pb-5 sm:pb-6">
          <Skeleton className="h-7 sm:h-8 w-48 sm:w-64" />
          <Skeleton className="h-4 w-64 sm:w-96 max-w-full" />
        </div>
      )}
      <SkeletonRows rows={rows} />
    </div>
  )
}
