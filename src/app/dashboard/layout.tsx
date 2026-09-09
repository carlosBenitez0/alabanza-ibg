'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Shield,
  Music,
  ListMusic,
  PlusCircle,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useState, useEffect, useCallback } from 'react'
import { SupabaseProvider } from '@/components/providers/supabase-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ToastProvider } from '@/components/providers/toast-provider'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tabla de la Semana', href: '/dashboard/weekly-schedule', icon: ListMusic },
  { name: 'Repertorio', href: '/dashboard/songs', icon: Music },
  { name: 'Mis Eventos', href: '/dashboard/events', icon: Calendar },
  { name: 'Equipo', href: '/dashboard/users', icon: Users },
  { name: 'Notificaciones', href: '/dashboard/notifications', icon: Bell, badge: true },
  { name: 'Mi Perfil', href: '/dashboard/profile', icon: Settings },
]

const adminNavigation = [
  { name: 'Panel Admin', href: '/admin', icon: Shield },
  { name: 'Eventos', href: '/admin/events', icon: Calendar },
  { name: 'Asignaciones', href: '/admin/assignments', icon: Users },
  { name: 'Usuarios', href: '/admin/users', icon: Settings },
]

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = useSupabase()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<{ role: string } | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id)
        .eq('read', false)
      setUnreadCount(count || 0)
    } catch {
      setUnreadCount(0)
    }
  }, [supabase, user])

  const fetchProfile = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      setProfile(data)
    } catch {
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }, [supabase, user])

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchUnreadCount()
    } else {
      setProfileLoading(false)
    }
  }, [user, fetchProfile, fetchUnreadCount])

  const isAdmin = profile?.role === 'admin' || profile?.role === 'leader'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 border-2 border-[var(--border-strong)] rounded-full" />
          <div className="absolute inset-0 border-2 border-[var(--text-primary)] rounded-full animate-spin border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex text-[var(--text-primary)]">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-page)] border-r border-[var(--border-subtle)]',
          'transform transition-transform duration-300 ease-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Navegación principal"
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-[var(--border-subtle)]">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--text-primary)] text-[var(--text-inverse)] flex items-center justify-center font-bold">
              <Music className="w-4 h-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              Alabanza IBG
            </span>
          </Link>
          <button
            className="lg:hidden p-1.5 rounded-[var(--radius)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Menú principal">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150 relative',
                  isActive
                    ? 'bg-[var(--bg-raised)] text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[var(--text-primary)] rounded-r-full" />
                )}
                <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")} aria-hidden="true" />
                {item.name}
                {item.badge && unreadCount > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 text-[10px] font-mono rounded bg-[var(--bg-active)] text-[var(--text-secondary)] border border-[var(--border-normal)]">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )
          })}

          {isAdmin && (
            <>
              <div className="pt-6 pb-2 px-3">
                <p className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest">
                  Administración
                </p>
              </div>
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150 relative',
                      isActive
                        ? 'bg-[var(--bg-raised)] text-[var(--text-primary)] font-semibold'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[var(--text-primary)] rounded-r-full" />
                    )}
                    <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")} aria-hidden="true" />
                    {item.name}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-[var(--bg-active)] border border-[var(--border-normal)] flex items-center justify-center text-[var(--text-primary)] font-medium text-xs">
              {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                {user?.user_metadata?.full_name || user?.email}
              </p>
              <p className="text-[10px] font-mono text-[var(--text-tertiary)] capitalize">
                {profile?.role || 'singer'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start mt-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col min-h-screen w-full">
        {/* Top Header */}
        <header className="sticky top-0 z-40 h-16 bg-[var(--bg-page)]/80 backdrop-blur-md border-b border-[var(--border-subtle)]">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            <button
              className="lg:hidden p-2 rounded-[var(--radius)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1 lg:flex-none" />

            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-raised)] border border-[var(--border-subtle)] text-xs">
                <span className="text-[var(--text-tertiary)] font-mono">Rol:</span>
                <span className="font-medium capitalize text-[var(--text-primary)]">
                  {profile?.role || 'singer'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </AuthProvider>
    </SupabaseProvider>
  )
}