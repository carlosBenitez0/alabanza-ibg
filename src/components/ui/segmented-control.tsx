'use client'

import { KeyboardEvent, ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export interface SegmentOption<T extends string> {
  value: T
  label: ReactNode
  icon?: ReactNode
}

/**
 * Two-to-four option toggle; full width on phones.
 * A radio group: one stop in the tab order, arrow keys move the choice.
 */
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
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const activeIndex = options.findIndex((o) => o.value === value)

  // One fill that slides to the chosen option (instead of each button painting its own),
  // so the change reads as the same selection moving
  const [pill, setPill] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const measure = () => {
      const btn = buttons.current[activeIndex]
      // Hidden (display: none) measures 0: fall back to the button's own fill until it shows
      setPill(btn && btn.offsetWidth ? { x: btn.offsetLeft, y: btn.offsetTop, w: btn.offsetWidth, h: btn.offsetHeight } : null)
    }
    measure()
    const container = buttons.current[0]?.parentElement
    if (!container || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    return () => ro.disconnect()
  }, [activeIndex, options.length])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step && e.key !== 'Home' && e.key !== 'End') return
    e.preventDefault()
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1 : (activeIndex + step + options.length) % options.length
    onChange(options[next].value)
    buttons.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        'relative grid auto-cols-fr grid-flow-col gap-1 p-1 rounded-[var(--radius-md)] bg-[var(--bg-raised)] border border-[var(--border-normal)] w-full sm:w-auto',
        className
      )}
    >
      {pill && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 rounded-[var(--radius)] bg-[var(--text-primary)] transition-[transform,width,height] duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
          style={{ width: pill.w, height: pill.h, transform: `translate(${pill.x}px, ${pill.y}px)` }}
        />
      )}
      {options.map((opt, i) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            ref={(el) => {
              buttons.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative inline-flex items-center justify-center gap-1.5 min-h-11 sm:min-h-8 px-3 rounded-[var(--radius)] text-sm sm:text-xs font-medium transition-colors duration-200 whitespace-nowrap',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--focus-ring)]',
              active
                ? cn('text-[var(--text-inverse)]', !pill && 'bg-[var(--text-primary)]')
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
