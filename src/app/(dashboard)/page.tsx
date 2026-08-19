'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Calendar, Music, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { formatDate, getEventTypeLabel, getEventTypeColor, getAssignmentRoleLabel, getAssignmentStatusLabel, getAssignmentStatusColor, cn } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui'

interface DashboardEvent {
  event: {
    id: string
    title: string
    event_type: string
    date: string
    start_time?: string
    location?: string
  }
  assignment: {
    id: string
    role: string
    status: string
  }
  song_list?: {
    id: string
    status: string
  }
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = useSupabase()
  const [events, setEvents] = useState<DashboardEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) fetchEvents()
  }, [user])

  const fetchEvents = async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('event_assignments')
        .select(`
          id,
          role,
          status,
          event:events (
            id,
            title,
            event_type,
            date,
            start_time,
            location
          ),
          song_list:song_lists!event_assignments_event_id_profile_id_role_fkey (
            id,
            status
          )
        `)
        .eq('profile_id', user.id)
        .order('event(date)', { ascending: true })

      if (error) throw error
      const mapped = (data || []).map((item) => ({
        event: Array.isArray(item.event) ? item.event[0] : item.event,
        assignment: { id: item.id, role: item.role, status: item.status },
        song_list: Array.isArray(item.song_list) ? item.song_list[0] : item.song_list,
      }))
      setEvents(mapped as DashboardEvent[])
    } catch (err) {
      setError('Error al cargar eventos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const upcomingEvents = events.filter(e => new Date(e.event.date) >= new Date())
  const pastEvents = events.filter(e => new Date(e.event.date) < new Date())

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenido, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
          </p>
        </div>
        <Link href="/dashboard/events">
          <Button>
            <Calendar className="w-4 h-4 mr-2" />
            Ver todos los eventos
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No tienes eventos asignados</h3>
            <p className="text-muted-foreground mb-6">
              Cuando un líder te asigne a un evento, aparecerá aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcomingEvents.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Próximos eventos ({upcomingEvents.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.map((item) => (
                  <EventCard key={item.event.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {pastEvents.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                Eventos pasados ({pastEvents.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastEvents.map((item) => (
                  <EventCard key={item.event.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function EventCard({ item }: { item: DashboardEvent }) {
  const { event, assignment, song_list } = item
  const hasSongList = song_list && song_list.status !== 'draft'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getEventTypeColor(event.event_type))}>
              {getEventTypeLabel(event.event_type)}
            </span>
            <h3 className="mt-2 font-semibold text-foreground">{event.title}</h3>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(event.date)}</span>
          </div>
          {event.start_time && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{event.start_time}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1 flex-1 truncate">
              <span className="w-4 h-4" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', getAssignmentStatusColor(assignment.status))}>
            <span className="mr-1">
              {assignment.status === 'confirmed' && <CheckCircle className="w-3 h-3" />}
              {assignment.status === 'declined' && <XCircle className="w-3 h-3" />}
              {assignment.status === 'pending' && <AlertCircle className="w-3 h-3" />}
            </span>
            {getAssignmentStatusLabel(assignment.status)}
          </span>
          <span className="text-sm text-muted-foreground">{getAssignmentRoleLabel(assignment.role)}</span>
        </div>

        {hasSongList && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
            <Music className="w-4 h-4" />
            <span>Lista de alabanzas enviada</span>
          </div>
        )}

        <Link href={`/dashboard/events/${event.id}`} className="block w-full text-center">
          <Button variant="outline" className="w-full" size="sm">
            Ver detalles
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}