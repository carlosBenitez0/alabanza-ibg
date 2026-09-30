import { RotateCcw, WifiOff } from 'lucide-react'
import { EmptyState } from './empty-state'
import { Button } from './button'

/**
 * "Couldn't load" state: never let a failed request pass for an empty list.
 */
export function ErrorState({
  title = 'No se pudo cargar',
  description = 'Revisa tu conexión a internet e inténtalo de nuevo.',
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <EmptyState
      icon={<WifiOff />}
      title={title}
      description={description}
      className={className}
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry} fullWidthMobile>
            <RotateCcw className="w-4 h-4" />
            Reintentar
          </Button>
        )
      }
    />
  )
}
