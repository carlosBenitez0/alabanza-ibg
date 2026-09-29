'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Music, X, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/auth-provider'
import { useProfile } from '@/components/providers/profile-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock'
import { buttonVariants, PageLoader } from '@/components/ui'
import { BottomNav } from './bottom-nav'
import { mainNavigation, adminNavigation, isNavActive, getRouteTitle, type NavItem } from './nav-config'

function NavLink({ item, pathname, unreadCount }: { item: NavItem; pathname: string; unreadCount: number }) {
  const active = isNavActive(pathname, item.href)
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-3 px-3 min-h-11 lg:min-h-9 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
        active
          ? 'bg-[var(--bg-raised)] text-[var(--text-primary)] font-semibold'
          : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
      )}
    >
      {active && (
        <span className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--text-primary)] rounded-r-full" aria-hidden="true" />
      )}
      <item.icon
        className={cn('w-5 h-5 lg:w-4 lg:h-4 flex-shrink-0', active ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]')}
        aria-hidden="true"
      />
      <span className="truncate">{item.name}</span>
      {item.badge && unreadCount > 0 && (
        <span className="ml-auto px-1.5 py-0.5 text-caption font-mono rounded bg-[var(--bg-active)] text-[var(--text-secondary)] border border-[var(--border-normal)]">
          {unreadCount}
        </span>
      )}
    </Link>
  )
}

function NavContents({ onClose, onSignOut }: { onClose?: () => void; onSignOut: () => void }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { profile, isAdmin, unreadCount } = useProfile()
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email
  const initial = (displayName || 'U').charAt(0).toUpperCase()

  return (
    <>
      {/* Logo */}
      <div className="flex h-[var(--header-h)] lg:h-16 items-center justify-between px-4 lg:px-5 border-b border-[var(--border-subtle)] shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 min-h-11">
          <span className="w-8 h-8 rounded-[var(--radius)] bg-[var(--text-primary)] text-[var(--text-inverse)] flex items-center justify-center">
            <Music className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">Alabanza IBG</span>
        </Link>
        {onClose && (
          <button
            type="button"
            className="touch-target flex items-center justify-center -mr-2 rounded-[var(--radius)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-colors"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Links */}
      <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 lg:p-4 space-y-1" aria-label="Menú principal">
        {mainNavigation.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} unreadCount={unreadCount} />
        ))}

        {isAdmin && (
          <>
            <p className="pt-6 pb-2 px-3 text-caption font-mono text-[var(--text-tertiary)] uppercase tracking-widest">
              Administración
            </p>
            {adminNavigation.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} unreadCount={0} />
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="shrink-0 p-3 lg:p-4 border-t border-[var(--border-subtle)] pb-[calc(0.75rem+var(--safe-bottom))] lg:pb-4">
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 px-2 py-1.5 min-h-11 rounded-[var(--radius-md)] hover:bg-[var(--bg-surface)] transition-colors"
        >
          <span className="w-8 h-8 rounded-full bg-[var(--bg-active)] border border-[var(--border-normal)] flex items-center justify-center text-[var(--text-primary)] font-medium text-xs shrink-0">
            {initial}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm lg:text-xs font-medium text-[var(--text-primary)] truncate">{displayName}</span>
            <span className="block text-caption font-mono text-[var(--text-tertiary)] capitalize">
              {profile?.role || 'singer'}
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className={buttonVariants({
            variant: 'ghost',
            size: 'sm',
            className: 'w-full justify-start mt-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]',
          })}
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    </>
  )
}

/**
 * Authenticated app chrome: fixed sidebar on desktop, compact header +
 * bottom tab bar + slide-in drawer on phones and tablets.
 */
export function AppShell({ children, requireAdmin }: { children: ReactNode; requireAdmin?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useSupabase()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading, isAdmin, unreadCount } = useProfile()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerPath, setDrawerPath] = useState(pathname)

  useBodyScrollLock(drawerOpen)

  // Close the drawer whenever the route changes
  if (drawerPath !== pathname) {
    setDrawerPath(pathname)
    setDrawerOpen(false)
  }

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  // Auth errors come back from Supabase email links as query/hash params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const hasError =
      urlParams.get('error') || hashParams.get('error') || urlParams.get('error_code') || hashParams.get('error_code')
    if (hasError) {
      const errCode = urlParams.get('error_code') || hashParams.get('error_code') || 'otp_expired'
      router.replace(`/login?error=${encodeURIComponent(errCode)}`)
      return
    }
    if (!authLoading && !user) {
      router.replace(`/login?redirectTo=${encodeURIComponent(pathname)}`)
    }
  }, [authLoading, user, router, pathname])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (authLoading || profileLoading || !user) {
    return <PageLoader fullScreen />
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg-page)] px-6 pt-safe pb-safe">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 flex items-center justify-center">
            <Shield className="w-7 h-7 text-[var(--color-error)]" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">Acceso denegado</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Esta sección es solo para líderes y administradores del ministerio.
          </p>
          <Link href="/dashboard" className={buttonVariants({ fullWidthMobile: true })}>
            Volver a mi panel
          </Link>
        </div>
      </div>
    )
  }

  const initial = (profile?.full_name || user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()

  return (
    <div className="min-h-dvh bg-[var(--bg-page)] text-[var(--text-primary)]">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex fixed inset-y-0 left-0 z-[300] w-64 flex-col bg-[var(--bg-page)] border-r border-[var(--border-subtle)]"
        aria-label="Navegación principal"
      >
        <NavContents onSignOut={handleSignOut} />
      </aside>

      {/* Phone/tablet drawer */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-[400] bg-black/80 transition-opacity duration-300',
          drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        id="app-drawer"
        inert={!drawerOpen}
        aria-label="Menú"
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-[450] flex flex-col w-[85vw] max-w-72 h-dvh',
          'bg-[var(--bg-page)] border-r border-[var(--border-subtle)] pt-safe pl-safe',
          'transition-transform duration-300 ease-out',
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContents onClose={() => setDrawerOpen(false)} onSignOut={handleSignOut} />
      </aside>

      <div className="lg:pl-64 flex flex-col min-h-dvh">
        {/* Header */}
        <header className="sticky top-0 z-[200] bg-[var(--bg-page)]/85 backdrop-blur-md border-b border-[var(--border-subtle)] pt-safe">
          <div className="flex h-[var(--header-h)] lg:h-16 items-center gap-3 px-4 lg:px-8 pl-[max(1rem,var(--safe-left))] pr-[max(1rem,var(--safe-right))]">
            <Link href="/dashboard" className="lg:hidden shrink-0 touch-target -ml-2 flex items-center justify-center" aria-label="Ir a mi panel">
              <span className="w-8 h-8 rounded-[var(--radius)] bg-[var(--text-primary)] text-[var(--text-inverse)] flex items-center justify-center">
                <Music className="w-4 h-4" aria-hidden="true" />
              </span>
            </Link>
            <p className="lg:hidden flex-1 min-w-0 truncate text-base font-semibold tracking-tight">
              {getRouteTitle(pathname)}
            </p>
            <div className="hidden lg:block flex-1" />

            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-raised)] border border-[var(--border-subtle)] text-xs">
              <span className="text-[var(--text-tertiary)] font-mono">Rol:</span>
              <span className="font-medium capitalize text-[var(--text-primary)]">{profile?.role || 'singer'}</span>
            </div>

            <Link
              href="/dashboard/profile"
              className="lg:hidden shrink-0 touch-target -mr-2 flex items-center justify-center"
              aria-label="Mi perfil"
            >
              <span className="w-8 h-8 rounded-full bg-[var(--bg-active)] border border-[var(--border-normal)] flex items-center justify-center text-xs font-medium">
                {initial}
              </span>
            </Link>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'flex-1 w-full max-w-6xl mx-auto outline-none',
            'pt-5 sm:pt-6 lg:pt-8 px-4 sm:px-6 lg:px-8',
            'pl-[max(1rem,var(--safe-left))] pr-[max(1rem,var(--safe-right))] sm:pl-6 sm:pr-6 lg:pl-8 lg:pr-8',
            'pb-[calc(var(--bottom-nav-h)+var(--safe-bottom)+6rem)] lg:pb-10'
          )}
        >
          {children}
        </main>
      </div>

      <BottomNav unreadCount={unreadCount} moreOpen={drawerOpen} onOpenMore={() => setDrawerOpen(true)} />
    </div>
  )
}
