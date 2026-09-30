'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  action?: React.ReactNode
  /** Playing its exit before being removed */
  leaving?: boolean
}

interface ToastContextType {
  toasts: Toast[]
  toast: (props: Omit<Toast, 'id' | 'leaving'>) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const TOAST_DURATION = 5000
const EXIT_MS = 200
const MAX_VISIBLE = 3

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  // Two steps: mark as leaving (exit + collapse animation), then remove
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), EXIT_MS)
  }, [])

  const toast = useCallback(
    ({ title, description, variant = 'default', action }: Omit<Toast, 'id' | 'leaving'>) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => {
        // Keep at most 3 on screen so a burst never covers the page on phones;
        // the oldest one leaves with its animation instead of vanishing
        const visible = prev.filter((t) => !t.leaving)
        if (visible.length >= MAX_VISIBLE) {
          const oldest = visible[0].id
          setTimeout(() => setToasts((p) => p.filter((t) => t.id !== oldest)), EXIT_MS)
          prev = prev.map((t) => (t.id === oldest ? { ...t, leaving: true } : t))
        }
        return [...prev, { id, title, description, variant, action }]
      })
      return id
    },
    []
  )

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div
      className={cn(
        'toast-viewport fixed z-[800] flex flex-col gap-2 pointer-events-none',
        // Phones: full width, above the bottom nav and home indicator
        'inset-x-3 bottom-[var(--toast-bottom)]',
        // Desktop: bottom-right stack
        'lg:inset-x-auto lg:right-4 lg:bottom-4 lg:w-96'
      )}
      aria-live="polite"
      aria-label="Notificaciones"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

/**
 * Auto-dismiss timer that pauses while the pointer or focus is on the toast,
 * so there is time to read it or reach its action.
 */
function useAutoDismiss(id: string, onDismiss: (id: string) => void) {
  const remaining = useRef(TOAST_DURATION)
  const startedAt = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    startedAt.current = Date.now()
    timer.current = setTimeout(() => onDismiss(id), remaining.current)
    return () => {
      if (timer.current) clearTimeout(timer.current)
      remaining.current = Math.max(1000, remaining.current - (Date.now() - startedAt.current))
    }
  }, [paused, id, onDismiss])

  return {
    onPointerEnter: () => setPaused(true),
    onPointerLeave: () => setPaused(false),
    onFocus: () => setPaused(true),
    onBlur: () => setPaused(false),
  }
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const pauseHandlers = useAutoDismiss(toast.id, onDismiss)
  const variantStyles = {
    default: 'border-[var(--border-strong)]',
    destructive: 'border-[var(--color-error)]/40',
    success: 'border-[var(--color-success)]/40',
    warning: 'border-[var(--color-warning)]/40',
  }

  const iconStyles = {
    default: 'text-[var(--text-secondary)]',
    destructive: 'text-[var(--color-error)]',
    success: 'text-[var(--color-success)]',
    warning: 'text-[var(--color-warning)]',
  }

  const icons = {
    default: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    destructive: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    success: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  }

  return (
    // The outer grid row collapses to 0 on exit, so the stack closes the gap smoothly
    <div
      className={cn(
        'grid transition-[grid-template-rows,opacity,transform] duration-200 ease-in',
        toast.leaving ? 'grid-rows-[0fr] opacity-0 translate-y-1' : 'grid-rows-[1fr]'
      )}
    >
    <div className="min-h-0">
    <div
      {...pauseHandlers}
      className={cn(
        'flex items-start gap-3 p-3 sm:p-4 w-full rounded-[var(--radius-lg)] border bg-[var(--bg-raised)] shadow-[var(--shadow-modal)] pointer-events-auto',
        'animate-slide-in',
        toast.leaving && 'pointer-events-none',
        variantStyles[toast.variant || 'default']
      )}
      role={toast.variant === 'destructive' ? 'alert' : 'status'}
    >
      <div className={cn('flex-shrink-0 mt-px', iconStyles[toast.variant || 'default'])}>
        {icons[toast.variant || 'default']}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-sm text-[var(--text-secondary)] break-words">{toast.description}</p>
        )}
        {toast.action && (
          // Acting on a toast (e.g. "Deshacer") also closes it
          <div className="mt-3" onClick={() => onDismiss(toast.id)}>
            {toast.action}
          </div>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 -m-2 touch-target sm:min-h-8 sm:min-w-8 flex items-center justify-center rounded-[var(--radius)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        aria-label="Cerrar notificación"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
    </div>
    </div>
  )
}