'use client'

import { useCallback, useMemo, useState } from 'react'
import { useAsyncData } from '@/hooks/use-async-data'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, ChevronRight, MapPin, Plus, Clock } from 'lucide-react'
import { useSupabase } from '@/hooks/use-supabase'
import { Badge, PageHeader, PageLoader, EmptyState, ErrorState, Fab, SegmentedControl, buttonVariants } from '@/components/ui'
import { formatTime, getEventTypeColor, getEventTypeLabel, cn } from '@/lib/utils'
import { formatISOShortDate } from '@/lib/date-helpers'
import type { EventType } from '@/types'

interface EventRow {
  id: string
  title: string
  event_type: EventType
  date: string
  end_date: string | null
  start_time: string | null
  location: string | null
  organizer: string | null
  event_assignments: { count: number }[]
}

type TypeFilter = 'all' | EventType
type WhenFilter = 'upcoming' | 'past'

const typeFilters: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'camp', label: 'Campamentos' },
  { value: 'united', label: 'Eventos unidos' },
  { value: 'invitation', label: 'Invitaciones' },
  { value: 'other', label: 'Otros' },
]

function parseLocalDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

interface EventsListProps {
  /** Where each event opens */
  detailHref: (id: string) => string
  newHref: string
}

/** Special events grouped by month; shared by the team section and the admin panel */
export function EventsList({ detailHref, newHref }: EventsListProps) {
  const supabase = useSupabase()
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [when, setWhen] = useState<WhenFilter>('upcoming')

  const load = useCallback(async () => {
    const today = formatISOShortDate(new Date())
    let query = supabase
      .from('events')
      .select('id, title, event_type, date, end_date, start_time, location, organizer, event_assignments(count)')
    // A camp that already started but hasn't ended is still upcoming
    query = when === 'upcoming'
      ? query.or(`date.gte.${today},end_date.gte.${today}`).order('date', { ascending: true })
      : query.lt('date', today).or(`end_date.is.null,end_date.lt.${today}`).order('date', { ascending: false }).limit(60)
    const { data, error } = await query
    if (error) throw error
    return (data as EventRow[]) || []
  }, [supabase, when])
  const { data: events, loading, error, reload } = useAsyncData<EventRow[]>(load, [])

  const grouped = useMemo(() => {
    const filtered = typeFilter === 'all' ? events : events.filter((e) => e.event_type === typeFilter)
    const groups = new Map<string, EventRow[]>()
    for (const e of filtered) {
      const key = format(parseLocalDate(e.date), 'MMMM yyyy', { locale: es })
      groups.set(key, [...(groups.get(key) || []), e])
    }
    return Array.from(groups.entries())
  }, [events, typeFilter])

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Eventos"
        description="Invitaciones y eventos especiales: campamentos, eventos con otras iglesias y más. Los cultos y ensayos van en los privilegios semanales."
        actionsDesktopOnly
        actions={
          <Link href={newHref} className={buttonVariants()}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Nuevo Evento
          </Link>
        }
      />
      <Fab icon={<Plus />} label="Evento" href={newHref} />

      <div className="space-y-3">
        <SegmentedControl
          label="Periodo"
          value={when}
          onChange={setWhen}
          options={[
            { value: 'upcoming', label: 'Próximos' },
            { value: 'past', label: 'Pasados' },
          ]}
        />
        <div className="scroll-x flex gap-2 -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filtrar por tipo">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={typeFilter === f.value}
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                'shrink-0 min-h-11 sm:min-h-8 px-4 rounded-full border text-sm sm:text-xs font-medium transition-colors',
                typeFilter === f.value
                  ? 'bg-[var(--text-primary)] text-[var(--text-inverse)] border-[var(--text-primary)]'
                  : 'border-[var(--border-normal)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <PageLoader variant="list" />
      ) : error && events.length === 0 ? (
        <ErrorState title="No se pudieron cargar los eventos" onRetry={reload} />
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={<Calendar />}
          title={when === 'upcoming' ? 'No hay eventos especiales próximos' : 'No hay eventos pasados'}
          description="Cuando nos inviten a un campamento o a un evento con otras iglesias, créalo aquí para que el equipo se apunte y prepare el repertorio."
          action={
            <Link href={newHref} className={buttonVariants({ fullWidthMobile: true })}>
              <Plus className="w-4 h-4" aria-hidden="true" />
              Nuevo Evento
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([month, items]) => (
            <section key={month} aria-labelledby={`m-${month}`}>
              <h2 id={`m-${month}`} className="text-xs font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-2 capitalize">
                {month}
              </h2>
              <ul className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-raised)] divide-y divide-[var(--border-subtle)] overflow-hidden">
                {items.map((event) => {
                  const date = parseLocalDate(event.date)
                  const assigned = event.event_assignments?.[0]?.count ?? 0
                  return (
                    <li key={event.id}>
                      <Link
                        href={detailHref(event.id)}
                        className="flex items-center gap-3 sm:gap-4 min-h-16 px-3 sm:px-4 py-3 hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors"
                      >
                        <span className="w-12 shrink-0 text-center rounded-[var(--radius-md)] border border-[var(--border-normal)] bg-[var(--bg-surface)] py-1">
                          <span className="block text-caption font-mono uppercase text-[var(--text-tertiary)]">
                            {format(date, 'EEE', { locale: es })}
                          </span>
                          <span className="block text-lg font-bold leading-tight font-mono">{format(date, 'd')}</span>
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold truncate min-w-0 max-w-full">{event.title}</span>
                            <Badge size="sm" className={getEventTypeColor(event.event_type)}>
                              {getEventTypeLabel(event.event_type)}
                            </Badge>
                          </span>
                          <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-[var(--text-tertiary)]">
                            {event.end_date && (
                              <span className="font-mono">
                                hasta {format(parseLocalDate(event.end_date), "d 'de' MMM", { locale: es })}
                              </span>
                            )}
                            {event.organizer && <span className="truncate min-w-0 max-w-full">{event.organizer}</span>}
                            {event.start_time && (
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" aria-hidden="true" />
                                {formatTime(event.start_time)}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1 min-w-0">
                                <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                                <span className="truncate">{event.location}</span>
                              </span>
                            )}
                            <span>{assigned} {assigned === 1 ? 'participante' : 'participantes'}</span>
                          </span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
