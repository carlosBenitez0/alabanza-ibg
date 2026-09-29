'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const fabClasses = cn(
  'lg:hidden fixed z-[250] right-4 bottom-[calc(var(--bottom-nav-h)+var(--safe-bottom)+1rem)]',
  'inline-flex items-center gap-2 h-14 pl-4 pr-5 rounded-full',
  'bg-[var(--text-primary)] text-[var(--text-inverse)] text-sm font-semibold',
  'shadow-[0_8px_24px_rgb(0_0_0/0.6)] active:scale-95 transition-transform touch-manipulation',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-page)]'
)

/**
 * Floating primary action above the bottom nav (phones/tablets only).
 * Pair it with the same action in the page header for `lg` screens.
 */
export function Fab({
  icon,
  label,
  href,
  className,
  ...props
}: { icon: ReactNode; label: string; href?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const content = (
    <>
      <span className="[&>svg]:w-5 [&>svg]:h-5" aria-hidden="true">{icon}</span>
      {label}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={cn(fabClasses, className)}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className={cn(fabClasses, className)} {...props}>
      {content}
    </button>
  )
}
