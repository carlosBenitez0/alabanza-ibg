'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Calendar, Music, Clock, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDate, getEventTypeLabel, getEventTypeColor, getAssignmentRoleLabel, getAssignmentStatusLabel, getAssignmentStatusColor, cn } from '@/lib/utils'
import Link from 'next/link'
import { Button, Badge } from '@/components/ui'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

interface Event {
  id: string
  title: string
  event_type: string
  date: string
  start_time?: string
  location?: string
}

interface EventWithAssignment extends Event {
  assignment?: {
    role: string
    status: string
  }
}

export default function EventsPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = useSupabase()
  const [events, setEvents] = useState<EventWithAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [view, setView] = useState<'calendar' | 'list'>('calendar')

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
          role,
          status,
          event:events (
            id,
            title,
            event_type,
            date,
            start_time,
            location
          )
        `)
        .eq('profile_id', user.id)
        .order('event(date)', { ascending: true })

      if (error) throw error
      const mapped = (data || []).map((item) => {
        const event = Array.isArray(item.event) ? item.event[0] : item.event
        return {
          ...event,
          assignment: { role: item.role, status: item.status },
        } as EventWithAssignment
      })
      setEvents(mapped)
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

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = format(new Date(event.date), 'yyyy-MM-dd')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(event)
    return acc
  }, {} as Record<string, EventWithAssignment[]>)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Eventos</h1>
          <p className="text-muted-foreground mt-1">Calendario y lista de tus asignaciones</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setView('calendar')}>
            <Calendar className="w-4 h-4 mr-2" /> Calendario
          </Button>
          <Button variant="outline" onClick={() => setView('list')}>
            Lista
          </Button>
        </div>
      </div>

      {view === 'calendar' ? (
        <CalendarView
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          eventsByDate={eventsByDate}
          days={days}
        />
      ) : (
        <ListView events={events} />
      )}
    </div>
  )
}

function CalendarView({
  currentMonth,
  onMonthChange,
  eventsByDate,
  days,
}: {
  currentMonth: Date
  onMonthChange: (date: Date) => void
  eventsByDate: Record<string, EventWithAssignment[]>
  days: Date[]
}) {
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => onMonthChange(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onMonthChange(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onMonthChange(new Date())}>
            Hoy
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 border-t border-l border-border">
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground border-r border-b border-border bg-secondary/50">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayEvents = eventsByDate[dateKey] || []
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isTodayDate = isToday(day)

            return (
              <div
                key={dateKey}
                className={cn(
                  'min-h-[100px] p-2 border-r border-b border-border relative',
                  !isCurrentMonth && 'bg-secondary/30 text-muted-foreground',
                  isTodayDate && 'bg-primary/10'
                )}
              >
                <span className={cn('text-sm font-medium', isTodayDate && 'text-primary')}>
                  {format(day, 'd')}
                </span>
                {dayEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/dashboard/events/${event.id}`}
                    className="block mt-1 truncate text-xs px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: getEventTypeColor(event.event_type).replace('bg-', '').replace(' text-', '') + '20' }}
                  >
                    <Badge variant="outline" className={cn('text-xs', getEventTypeColor(event.event_type))}>
                      {getEventTypeLabel(event.event_type)}
                    </Badge>
                    <span className="ml-1 truncate block">{event.title}</span>
                  </Link>
                ))}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function ListView({ events }: { events: EventWithAssignment[] }) {
  const upcoming = events.filter(e => new Date(e.date) >= new Date())
  const past = events.filter(e => new Date(e.date) < new Date())

  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Próximos ({upcoming.length})</h2>
          <div className="space-y-3">
            {upcoming.map((event) => (
              <EventListItem key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Pasados ({past.length})</h2>
          <div className="space-y-3">
            {past.map((event) => (
              <EventListItem key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {events.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No tienes eventos asignados</h3>
            <p className="text-muted-foreground">Cuando un líder te asigne a un evento, aparecerá aquí.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function EventListItem({ event }: { event: EventWithAssignment }) {
  const isPast = new Date(event.date) < new Date()

  return (
    <Link href={`/dashboard/events/${event.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={cn('text-xs', getEventTypeColor(event.event_type))}>
                  {getEventTypeLabel(event.event_type)}
                </Badge>
                {event.assignment && (
                  <Badge variant="outline" className={getAssignmentStatusColor(event.assignment.status)}>
                    {getAssignmentStatusLabel(event.assignment.status)}
                  </Badge>
                )}
              </div>
              <h3 className="font-medium text-foreground truncate">{event.title}</h3>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(event.date)}
                </span>
                {event.start_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {event.start_time}
                  </span>
                )}
                {event.location && (
                  <span className="flex items-center gap-1 truncate">
                    <span>📍</span>
                    {event.location}
                  </span>
                )}
                {event.assignment && (
                  <span className="flex items-center gap-1">
                    <Music className="w-4 h-4" />
                    {getAssignmentRoleLabel(event.assignment.role)}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}