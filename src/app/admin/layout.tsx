'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Calendar, Users, Settings, Shield, LogOut, Menu, X } from 'lucide-react'
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acceso denegado</h1>
          <p className="text-muted-foreground">No tienes permisos de administrador</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Sidebar de administración"
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2">
            <img src="/ibglogo.png" alt="IBG Logo" className="h-8 w-auto" />
            <span className="text-xl font-bold text-primary hidden sm:block">Admin IBG</span>
          </Link>
          <button
            className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
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
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.user_metadata?.full_name || user?.email}</p>
              <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start mt-2" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64 flex flex-col min-h-screen w-full">
        <header className="sticky top-0 z-40 h-16 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border">
          <div className="flex h-full items-center justify-between px-4">
            <button
              className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
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
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
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
        <ToastProvider>
          <AdminLayoutInner>{children}</AdminLayoutInner>
        </ToastProvider>
      </AuthProvider>
    </SupabaseProvider>
  )
}