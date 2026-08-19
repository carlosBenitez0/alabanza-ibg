'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Calendar, Users, Plus, TrendingUp, Clock, Music } from 'lucide-react'
import { formatDate, getEventTypeLabel, getEventTypeColor, cn } from '@/lib/utils'
import Link from 'next/link'
import { Button, Badge } from '@/components/ui'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  href?: string
}

function StatCard({ title, value, icon, color, href }: StatCardProps) {
  const content = (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
      </div>
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
        {icon}
      </div>
    </div>
  )

  return (
    <Card>
      <CardContent className="p-6">
        {href ? <Link href={href} className="block">{content}</Link> : content}
      </CardContent>
    </Card>
  )
}

interface Event {
  id: string
  title: string
  event_type: string
  date: string
  start_time?: string
  location?: string
  _count?: { event_assignments: number }
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = useSupabase()
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalUsers: 0,
    pendingAssignments: 0,
  })
  const [recentEvents, setRecentEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchStats()
  }, [user])

  const fetchStats = async () => {
    if (!user) return
    try {
      setLoading(true)

      const [eventsRes, usersRes, assignmentsRes] = await Promise.all([
        supabase.from('events').select('id, title, event_type, date, start_time, location', { count: 'exact' }).order('date', { ascending: false }).limit(5),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('event_assignments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ])

      const upcomingCount = eventsRes.data?.filter(e => new Date(e.date) >= new Date()).length || 0

      setStats({
        totalEvents: eventsRes.count || 0,
        upcomingEvents: upcomingCount,
        totalUsers: usersRes.count || 0,
        pendingAssignments: assignmentsRes.count || 0,
      })

      setRecentEvents(eventsRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Panel de Administración</h1>
        <p className="text-muted-foreground mt-1">Gestión completa del ministerio de alabanza</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Eventos"
          value={stats.totalEvents}
          icon={<Calendar className="w-6 h-6" />}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          href="/admin/events"
        />
        <StatCard
          title="Próximos Eventos"
          value={stats.upcomingEvents}
          icon={<Clock className="w-6 h-6" />}
          color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          href="/admin/events"
        />
        <StatCard
          title="Miembros"
          value={stats.totalUsers}
          icon={<Users className="w-6 h-6" />}
          color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          href="/admin/users"
        />
        <StatCard
          title="Asignaciones Pendientes"
          value={stats.pendingAssignments}
          icon={<Music className="w-6 h-6" />}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          href="/admin/assignments"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Próximos Eventos</CardTitle>
            <Link href="/admin/events">
              <Button variant="ghost" size="sm">Ver todos</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay eventos creados</p>
                <Link href="/admin/events/new" className="text-primary hover:underline mt-2 inline-block">
                  Crear primer evento
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.slice(0, 5).map((event) => (
                  <Link key={event.id} href={`/admin/events/${event.id}`} className="block">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors">
                      <div className="flex items-center gap-3">
                        <Badge className={cn(getEventTypeColor(event.event_type))}>
                          {getEventTypeLabel(event.event_type)}
                        </Badge>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(event.date)}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {event.start_time && <p>{event.start_time}</p>}
                        {event.location && <p>{event.location}</p>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/admin/events/new">
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Plus className="w-8 h-8" />
                  <span>Nuevo Evento</span>
                </Button>
              </Link>
              <Link href="/admin/assignments">
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Users className="w-8 h-8" />
                  <span>Gestionar Asignaciones</span>
                </Button>
              </Link>
              <Link href="/admin/users">
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Users className="w-8 h-8" />
                  <span>Ver Usuarios</span>
                </Button>
              </Link>
              <Link href="/admin/events">
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Calendar className="w-8 h-8" />
                  <span>Ver Calendario</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}