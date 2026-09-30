'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { adminNavigation, isNavActive } from './nav-config'

const shortLabels: Record<string, string> = {
  '/admin': 'Panel',
  '/admin/events': 'Eventos',
  '/admin/assignments': 'Asignaciones',
  '/admin/users': 'Usuarios',
}

/**
 * Phones/tablets: the bottom bar is the member navigation, so admin sections
 * get their own row of tabs under the header (desktop has them in the sidebar).
 */
export function AdminSubNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Secciones de administración" className="lg:hidden mb-5">
      <ul className="scroll-x flex gap-1 p-1 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-raised)]">
        {adminNavigation.map((item) => {
          const active = isNavActive(pathname, item.href)
          return (
            <li key={item.href} className="flex-1 shrink-0">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center justify-center gap-1.5 min-h-10 px-3 rounded-[var(--radius)] text-sm font-medium whitespace-nowrap transition-colors',
                  active
                    ? 'bg-[var(--text-primary)] text-[var(--text-inverse)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:bg-[var(--bg-hover)]'
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                {shortLabels[item.href] ?? item.name}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
