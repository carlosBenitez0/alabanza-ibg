import { cn } from '@/lib/utils'

export function Spinner({ className, label = 'Cargando' }: { className?: string; label?: string }) {
  return (
    <div className={cn('relative w-8 h-8', className)} role="status" aria-label={label}>
      <div className="absolute inset-0 border-2 border-[var(--border-strong)] rounded-full" />
      <div className="absolute inset-0 border-2 border-[var(--text-primary)] rounded-full animate-spin border-t-transparent" />
    </div>
  )
}

/** Centered spinner for a page or section that is still loading */
export function PageLoader({ fullScreen, className }: { fullScreen?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        fullScreen ? 'min-h-dvh bg-[var(--bg-page)]' : 'min-h-[40dvh]',
        className
      )}
    >
      <Spinner />
    </div>
  )
}
