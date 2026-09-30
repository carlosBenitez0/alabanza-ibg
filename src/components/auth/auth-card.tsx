'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Check, X } from 'lucide-react'
import { useGsapMountReveal } from '@/hooks/use-gsap-reveal'
import { getPasswordCriteria } from '@/lib/password'

/** Shared frame for the signed-out screens: logo, title and form card */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  const cardRef = useGsapMountReveal<HTMLDivElement>({ yOffset: 12 })

  return (
    <div className="min-h-dvh flex items-start sm:items-center justify-center bg-[var(--bg-page)] px-4 pt-[calc(2rem+var(--safe-top))] pb-[calc(2rem+var(--safe-bottom))] sm:py-12 text-[var(--text-primary)]">
      <div ref={cardRef} className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/login" className="inline-flex items-center gap-3 mb-4 min-h-11">
            <Image src="/ibglogo.png" alt="" width={28} height={48} priority className="h-10 w-auto" />
            <span className="text-2xl font-bold tracking-tight">Alabanza IBG</span>
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-[var(--text-tertiary)] mt-1">{subtitle}</p>}
        </div>

        <div className="bg-[var(--bg-raised)] rounded-[var(--radius-xl)] border border-[var(--border-normal)] p-5 sm:p-8 space-y-5 sm:space-y-6">
          {children}
          {footer && <div className="pt-2 text-center text-sm text-[var(--text-tertiary)]">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

export function PasswordChecklist({ password }: { password: string }) {
  return (
    <div className="mt-2.5 p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
      <p className="text-caption font-mono text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
        Requisitos de contraseña:
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {getPasswordCriteria(password).map((c) => (
          <li key={c.label} className="flex items-center gap-1.5 text-sm sm:text-xs">
            {c.met ? (
              <Check className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0" aria-hidden="true" />
            ) : (
              <X className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />
            )}
            <span className={c.met ? 'text-[var(--color-success)] font-medium' : 'text-[var(--text-tertiary)]'}>
              {c.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const authLinkClass =
  'inline-flex items-center min-h-11 px-1 text-[var(--text-primary)] underline-offset-4 hover:underline font-medium transition-colors'

export function AuthAlert({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  const error = tone === 'error'
  return (
    <div
      role={error ? 'alert' : 'status'}
      className={
        error
          ? 'p-3 rounded-[var(--radius-md)] bg-[var(--color-error-dark)]/20 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)]'
          : 'p-3 rounded-[var(--radius-md)] bg-[var(--color-success-dark)]/20 border border-[var(--color-success)]/30 text-sm text-[var(--color-success)]'
      }
    >
      {children}
    </div>
  )
}
