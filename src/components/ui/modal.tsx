'use client'

import { ReactNode, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  /** Extra content rendered in the header row, before the close button */
  headerActions?: ReactNode
  /** Leading visual (icon tile) shown next to the title */
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: ModalSize
  /** Takes the whole viewport on every breakpoint */
  fullscreen?: boolean
  /** Takes the whole viewport on phones only (sheet from `sm` up) */
  fullscreenMobile?: boolean
  tone?: 'default' | 'danger'
  /** Disable closing via backdrop / Escape (e.g. while saving) */
  dismissible?: boolean
  bodyClassName?: string
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Bottom sheet on phones, centered dialog from `sm` up.
 * Handles Escape, backdrop tap, scroll lock, focus trap and focus return.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  headerActions,
  icon,
  children,
  footer,
  size = 'md',
  fullscreen,
  fullscreenMobile,
  tone = 'default',
  dismissible = true,
  bodyClassName,
}: ModalProps) {
  const titleId = useId()
  const descId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const dismissibleRef = useRef(dismissible)
  useEffect(() => {
    onCloseRef.current = onClose
    dismissibleRef.current = dismissible
  }, [onClose, dismissible])

  useBodyScrollLock(isOpen)

  // Stay mounted while the exit animation plays, then unmount
  const [present, setPresent] = useState(isOpen)
  if (isOpen && !present) setPresent(true)
  const closing = present && !isOpen
  useEffect(() => {
    if (!closing) return
    // Safety net in case animationend never fires (tab hidden, element detached)
    const fallback = setTimeout(() => setPresent(false), 400)
    return () => clearTimeout(fallback)
  }, [closing])

  useEffect(() => {
    if (!isOpen) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const panel = panelRef.current

    // Focus the first field (or the panel) once mounted
    const first = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel
    first?.focus({ preventScroll: true })

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissibleRef.current) {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      )
      if (focusables.length === 0) return
      const firstEl = focusables[0]
      const lastEl = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus?.({ preventScroll: true })
    }
  }, [isOpen])

  if (!present || typeof document === 'undefined') return null

  const isFull = fullscreen
  const danger = tone === 'danger'

  // Enter: sheet rises on phones, dialog scales in from `sm`. Exit mirrors it, faster.
  const panelMotion = closing
    ? isFull || fullscreenMobile
      ? 'animate-fade-out'
      : 'animate-sheet-down sm:animate-scale-out'
    : isFull || fullscreenMobile
      ? 'animate-fade-in sm:animate-scale-in'
      : 'animate-sheet-up sm:animate-scale-in'

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[500] flex',
        closing ? 'animate-fade-out pointer-events-none' : 'animate-fade-in',
        isFull ? 'items-stretch' : 'items-end sm:items-center sm:justify-center sm:p-4',
        'bg-black/80 backdrop-blur-sm'
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && dismissible && !closing) onClose()
      }}
      onAnimationEnd={(e) => {
        if (closing && e.target === e.currentTarget) setPresent(false)
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={closing ? undefined : true}
        aria-hidden={closing || undefined}
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex flex-col w-full bg-[var(--bg-raised)] text-[var(--text-primary)] outline-none',
          'border border-[var(--border-normal)] shadow-[var(--shadow-modal)] overflow-hidden',
          danger && 'border-[var(--color-error)]/30',
          panelMotion,
          isFull
            ? 'h-dvh max-h-dvh rounded-none border-0'
            : fullscreenMobile
              ? cn('h-dvh max-h-dvh rounded-none border-0 sm:h-auto sm:max-h-[min(90dvh,56rem)] sm:rounded-[var(--radius-xl)] sm:border', sizeClasses[size])
              : cn(
                  'max-h-[calc(100dvh-var(--safe-top)-0.75rem)] rounded-t-[var(--radius-xl)] border-b-0',
                  'sm:max-h-[min(90dvh,56rem)] sm:rounded-[var(--radius-xl)] sm:border-b',
                  sizeClasses[size]
                )
        )}
      >
        {/* Grab handle (phones, sheet mode only) */}
        {!isFull && !fullscreenMobile && (
          <div className="sm:hidden flex justify-center pt-2 pb-0.5 bg-[var(--bg-page)]" aria-hidden="true">
            <span className="h-1 w-10 rounded-full bg-[var(--border-strong)]" />
          </div>
        )}

        {/* Header */}
        <div
          className={cn(
            'flex items-start gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b bg-[var(--bg-page)] shrink-0',
            danger ? 'border-[var(--color-error)]/20' : 'border-[var(--border-subtle)]',
            (isFull || fullscreenMobile) && 'pt-[calc(0.75rem+var(--safe-top))]',
            fullscreenMobile && 'sm:pt-4'
          )}
        >
          {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className={cn(
                'text-base sm:text-lg font-bold tracking-tight leading-tight break-words',
                danger ? 'text-[var(--color-error)]' : 'text-[var(--text-primary)]'
              )}
            >
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 -mr-2 -my-1.5">
            {headerActions}
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                className="touch-target sm:min-h-9 sm:min-w-9 flex items-center justify-center rounded-[var(--radius)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div
          className={cn(
            'flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 sm:py-5',
            !footer && 'pb-[calc(1rem+var(--safe-bottom))] sm:pb-5',
            bodyClassName
          )}
        >
          {children}
        </div>

        {/* Footer: stacked full-width actions on phones */}
        {footer && (
          <div
            className={cn(
              'shrink-0 flex flex-col-reverse gap-2 px-4 sm:px-6 pt-3 pb-[calc(0.75rem+var(--safe-bottom))] sm:py-4',
              'sm:flex-row sm:items-center sm:justify-end sm:gap-3',
              '[&>button]:w-full sm:[&>button]:w-auto',
              'border-t bg-[var(--bg-page)]',
              danger ? 'border-[var(--color-error)]/20' : 'border-[var(--border-subtle)]'
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
