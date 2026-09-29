'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mainNavigation, bottomTabHrefs, isNavActive } from './nav-config'

const tabs = bottomTabHrefs.map((href) => mainNavigation.find((i) => i.href === href)!)

const tabClasses =
  'relative flex flex-1 flex-col items-center justify-center gap-1 min-h-11 pt-1.5 pb-1 text-caption font-medium leading-none transition-colors touch-manipulation'

/** Thumb-reach tab bar for phones and tablets (hidden from `lg`) */
export function BottomNav({
  unreadCount,
  moreOpen,
  onOpenMore,
}: {
  unreadCount: number
  moreOpen: boolean
  onOpenMore: () => void
}) {
  const pathname = usePathname()
  const inTab = tabs.some((t) => isNavActive(pathname, t.href))

  return (
    <nav
      aria-label="Navegación inferior"
      className="lg:hidden fixed inset-x-0 bottom-0 z-[300] border-t border-[var(--border-subtle)] bg-[var(--bg-page)]/95 backdrop-blur-md pb-safe pl-safe pr-safe"
    >
      <ul className="flex h-[var(--bottom-nav-h)] items-stretch px-1">
        {tabs.map((item) => {
          const active = isNavActive(pathname, item.href)
          const showBadge = item.badge && unreadCount > 0
          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  tabClasses,
                  active ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
                )}
              >
                {active && (
                  <span className="absolute top-0 inset-x-5 h-0.5 rounded-b-full bg-[var(--text-primary)]" aria-hidden="true" />
                )}
                <span className="relative">
                  <item.icon className="w-6 h-6" aria-hidden="true" strokeWidth={active ? 2.25 : 1.75} />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--text-primary)] text-[var(--text-inverse)] text-caption font-bold leading-[18px] text-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
                <span>{item.short ?? item.name}</span>
                {showBadge && <span className="sr-only">({unreadCount} sin leer)</span>}
              </Link>
            </li>
          )
        })}
        <li className="flex flex-1">
          <button
            type="button"
            onClick={onOpenMore}
            aria-expanded={moreOpen}
            aria-controls="app-drawer"
            className={cn(
              tabClasses,
              !inTab || moreOpen ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
            )}
          >
            {!inTab && (
              <span className="absolute top-0 inset-x-5 h-0.5 rounded-b-full bg-[var(--text-primary)]" aria-hidden="true" />
            )}
            <Menu className="w-6 h-6" aria-hidden="true" />
            <span>Más</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}
