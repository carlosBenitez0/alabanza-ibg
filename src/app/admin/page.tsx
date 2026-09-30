'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { useCallback } from 'react'
import { useAsyncData } from '@/hooks/use-async-data'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, Badge, PageHeader, PageLoader, EmptyState, buttonVariants } from '@/components/ui'
import { Calendar, Users, Plus, Clock, ClipboardList, ChevronRight, MapPin, UserCog } from 'lucide-react'
import { formatDate, formatTime, getEventTypeLabel, getEventTypeColor, cn } from '@/lib/utils'
import { formatISOShortDate } from '@/lib/date-helpers'

interface AdminEvent {
  id: string
  title: string
  event_type: string
  date: string
  start_time?: string | null
  location?: string | null
}

function StatCard({ title, value, icon, href }: { title: string; value: number; icon: React.ReactNode; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-raised)] p-4 sm:p-5 hover:border-[var(--border-strong)] active:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--focus-ring)]"
    >
      <span className="flex items-start justify-between gap-2">
        <span className="text-xs sm:text-sm text-[var(--text-secondary)] leading-tight">{title}</span>
        <span className="text-[var(--text-tertiary)] [&>svg]:w-5 [&>svg]:h-5 shrink-0">{icon}</span>
      </span>
      <span className="block text-2xl sm:text-3xl font-semibold font-mono mt-2">{value}</span>
    </Link>
  )
}

const quickActions = [
  { href: '/admin/events/new', title: 'Nuevo Evento', description: 'Campamento, evento unido o invitación', icon: Plus },
  { href: '/admin/assignments', title: 'Gestionar Asignaciones', description: 'Voces, coros, músicos', icon: ClipboardList },
  { href: '/admin/users', title: 'Ver Usuarios', description: 'Miembros y roles', icon: UserCog },
  { href: '/admin/events', title: 'Eventos Especiales', description: 'Invitaciones y eventos fuera de los privilegios', icon: Calendar },
]

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = useSupabase()
  const fetchStats = useCallback(async () => {
    const today = formatISOShortDate(new Date())
    const [allRes, upcomingRes, usersRes, assignmentsRes] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase
        .from('events')
        .select('id, title, event_type, date, start_time, location', { count: 'exact' })
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(5),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('event_assignments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

    return {
      stats: {
        totalEvents: allRes.count || 0,
        upcomingEvents: upcomingRes.count || 0,
        totalUsers: usersRes.count || 0,
        pendingAssignments: assignmentsRes.count || 0,
      },
      upcoming: (upcomingRes.data || []) as AdminEvent[],
    }
  }, [supabase])

  // On failure stats stay at zero; the page still renders its actions
  const { data, loading } = useAsyncData(user ? fetchStats : null, {
    stats: { totalEvents: 0, upcomingEvents: 0, totalUsers: 0, pendingAssignments: 0 },
    upcoming: [] as AdminEvent[],
  })
  const { stats, upcoming } = data

  if (authLoading || loading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Panel de Administración"
        description="Gestión completa del ministerio de alabanza"
        actions={
          <Link href="/admin/events/new" className={buttonVariants()}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Nuevo Evento
          </Link>
        }
      />

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Eventos" value={stats.totalEvents} icon={<Calendar />} href="/admin/events" />
        <StatCard title="Próximos Eventos" value={stats.upcomingEvents} icon={<Clock />} href="/admin/events" />
        <StatCard title="Miembros" value={stats.totalUsers} icon={<Users />} href="/admin/users" />
        <StatCard title="Asignaciones Pendientes" value={stats.pendingAssignments} icon={<ClipboardList />} href="/admin/assignments" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base sm:text-lg">Próximos Eventos</CardTitle>
            <Link href="/admin/events" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Ver todos
            </Link>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <EmptyState
                className="border-dashed bg-transparent py-8 sm:py-8"
                icon={<Calendar />}
                title="No hay eventos próximos"
                action={
                  <Link href="/admin/events/new" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    Crear evento
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-2">
                {upcoming.map((event) => (
                  <li key={event.id}>
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <Badge size="sm" className={cn(getEventTypeColor(event.event_type))}>
                            {getEventTypeLabel(event.event_type)}
                          </Badge>
                          <span className="text-sm font-medium truncate">{event.title}</span>
                        </span>
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-[var(--text-tertiary)]">
                          <span className="font-mono">{formatDate(`${event.date}T00:00:00`)}</span>
                          {event.start_time && <span className="font-mono">{formatTime(event.start_time)}</span>}
                          {event.location && (
                            <span className="flex items-center gap-1 min-w-0">
                              <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                              <span className="truncate">{event.location}</span>
                            </span>
                          )}
                        </span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              {quickActions.map((action) => (
                <li key={action.href}>
                  <Link
                    href={action.href}
                    className="flex sm:flex-col items-center sm:items-start gap-3 min-h-16 p-3 sm:p-4 rounded-[var(--radius-md)] border border-[var(--border-strong)] hover:border-[var(--text-secondary)] active:bg-[var(--bg-hover)] transition-colors h-full"
                  >
                    <span className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-normal)] flex items-center justify-center shrink-0">
                      <action.icon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{action.title}</span>
                      <span className="block text-xs text-[var(--text-tertiary)]">{action.description}</span>
                    </span>
                    <ChevronRight className="sm:hidden w-4 h-4 text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
