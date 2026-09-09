'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useState, useEffect } from 'react'
import { SupabaseProvider } from '@/components/providers/supabase-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ToastProvider } from '@/components/providers/toast-provider'

const adminNavigation = [
  { name: 'Panel Admin', href: '/admin', icon: Shield },
  { name: 'Eventos', href: '/admin/events', icon: Calendar },
  { name: 'Asignaciones', href: '/admin/assignments', icon: Users },
  { name: 'Usuarios', href: '/admin/users', icon: Settings },
]

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, session, loading: authLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<{ role: string } | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchProfile()
    } else {
      setProfileLoading(false)
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const supabase = useSupabase()
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single()
      setProfile(data)
    } catch {
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'leader'

  const handleSignOut = async () => {
    const supabase = useSupabase()
    await supabase.auth.signOut()
  }

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 border-3 border-brand-200 dark:border-brand-800 rounded-full" />
          <div className="absolute inset-0 border-3 border-brand-500 rounded-full animate-spin border-t-transparent" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-error" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">Acceso denegado</h1>
          <p className="text-neutral-500 dark:text-neutral-400">No tienes permisos de administrador</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800',
          'transform transition-transform duration-300 ease-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Navegación de administración"
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-neutral-900 dark:text-white hidden sm:block">
              Admin IBG
            </span>
          </Link>
          <button
            className="lg:hidden p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Navegación admin">
          {adminNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                pathname === item.href
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
              )}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                {user?.user_metadata?.full_name || user?.email}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Administrador</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start mt-2" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64 flex flex-col min-h-screen w-full">
        <header className="sticky top-0 z-40 h-16 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            <button
              className="lg:hidden p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 lg:flex-none" />
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </AuthProvider>
    </SupabaseProvider>
  )
}