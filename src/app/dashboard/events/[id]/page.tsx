'use client'

import { useCallback, useState } from 'react'
import { useAsyncData } from '@/hooks/use-async-data'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, Calendar, Check, Clock, MapPin, Users, X, FileText } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { useToast } from '@/components/providers/toast-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { Badge, Button, PageHeader, PageLoader, EmptyState, buttonVariants } from '@/components/ui'
import { StatusBadge, getAssignmentRoleLabel } from '@/components/admin/assignment-status'
import { formatTime, getEventTypeColor, getEventTypeLabel } from '@/lib/utils'
import type { AssignmentRole, AssignmentStatus, EventType } from '@/types'

interface EventDetail {
  id: string
  title: string
  event_type: EventType
  date: string
  start_time: string | null
  end_time: string | null
  location: string | null
  notes: string | null
}

interface AssignmentRow {
  id: string
  profile_id: string
  role: AssignmentRole
  status: AssignmentStatus
  profile: { full_name: string | null } | { full_name: string | null }[] | null
}

const nameOf = (a: AssignmentRow) => (Array.isArray(a.profile) ? a.profile[0] : a.profile)?.full_name || 'Miembro'

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const supabase = useSupabase()
  const { toast } = useToast()
  const [responding, setResponding] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [eventRes, assignRes] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('event_assignments')
        .select('id, profile_id, role, status, profile:profiles(full_name)')
        .eq('event_id', id)
        .order('role'),
    ])
    return {
      event: eventRes.data as EventDetail | null,
      assignments: (assignRes.data as AssignmentRow[]) || [],
    }
  }, [supabase, id])
  const { data, loading, reload } = useAsyncData(load, { event: null as EventDetail | null, assignments: [] as AssignmentRow[] })
  const { event, assignments } = data

  const respond = async (assignment: AssignmentRow, status: 'confirmed' | 'declined') => {
    setResponding(assignment.id)
    const { error } = await supabase
      .from('event_assignments')
      .update({ status, confirmed_at: status === 'confirmed' ? new Date().toISOString() : null })
      .eq('id', assignment.id)
    setResponding(null)
    if (error) {
      toast({ title: 'Error', description: 'No se pudo guardar tu respuesta', variant: 'destructive' })
      return
    }
    toast({
      title: status === 'confirmed' ? 'Participación confirmada' : 'Participación rechazada',
      variant: status === 'confirmed' ? 'success' : 'default',
    })
    reload()
  }

  if (loading) return <PageLoader />

  if (!event) {
    return (
      <EmptyState
        icon={<Calendar />}
        title="Evento no encontrado"
        description="Puede que haya sido eliminado o que el enlace sea incorrecto."
        action={
          <Link href="/dashboard/events" className={buttonVariants({ fullWidthMobile: true })}>
            Ver mis eventos
          </Link>
        }
      />
    )
  }

  const [y, m, d] = event.date.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const mine = assignments.filter((a) => a.profile_id === user?.id)

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/dashboard/events" className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-3' })}>
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Mis eventos
      </Link>

      <PageHeader
        title={event.title}
        description={
          <Badge size="sm" className={getEventTypeColor(event.event_type)}>
            {getEventTypeLabel(event.event_type)}
          </Badge>
        }
      />

      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-raised)] border border-[var(--border-subtle)]">
          <dt className="text-caption font-mono uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" /> Fecha
          </dt>
          <dd className="text-sm font-semibold mt-1 first-letter:uppercase">{format(date, "EEEE d 'de' MMMM", { locale: es })}</dd>
        </div>
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-raised)] border border-[var(--border-subtle)]">
          <dt className="text-caption font-mono uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Hora
          </dt>
          <dd className="text-sm font-semibold mt-1 font-mono">
            {event.start_time ? formatTime(event.start_time) : 'Por definir'}
            {event.end_time && ` – ${formatTime(event.end_time)}`}
          </dd>
        </div>
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-raised)] border border-[var(--border-subtle)]">
          <dt className="text-caption font-mono uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> Lugar
          </dt>
          <dd className="text-sm font-semibold mt-1 break-words">{event.location || 'Por definir'}</dd>
        </div>
      </dl>

      {mine.length > 0 && (
        <section className="space-y-3" aria-labelledby="mine-title">
          <h2 id="mine-title" className="text-base font-bold">Mi participación</h2>
          {mine.map((a) => (
            <div key={a.id} className="p-4 rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-raised)] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{getAssignmentRoleLabel(a.role)}</span>
                <StatusBadge status={a.status} />
              </div>
              {a.status === 'pending' ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => respond(a, 'declined')} loading={responding === a.id}>
                    <X className="w-4 h-4" />
                    No puedo
                  </Button>
                  <Button onClick={() => respond(a, 'confirmed')} loading={responding === a.id}>
                    <Check className="w-4 h-4" />
                    Confirmar
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => respond(a, a.status === 'confirmed' ? 'declined' : 'confirmed')}
                  loading={responding === a.id}
                >
                  {a.status === 'confirmed' ? 'Ya no puedo asistir' : 'Sí puedo asistir'}
                </Button>
              )}
            </div>
          ))}
        </section>
      )}

      {event.notes && (
        <section className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-raised)] border border-[var(--border-subtle)] space-y-1.5">
          <h2 className="text-caption font-mono uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Notas
          </h2>
          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line break-words">{event.notes}</p>
        </section>
      )}

      <section className="space-y-3" aria-labelledby="team-title">
        <h2 id="team-title" className="text-base font-bold flex items-center gap-2">
          <Users className="w-4 h-4 text-[var(--text-secondary)]" aria-hidden="true" />
          Equipo ({assignments.length})
        </h2>
        {assignments.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)]">Aún no hay nadie asignado.</p>
        ) : (
          <ul className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-raised)] divide-y divide-[var(--border-subtle)]">
            {assignments.map((a) => (
              <li key={a.id} className="flex items-center gap-3 min-h-12 px-3 sm:px-4 py-2.5">
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{nameOf(a)}</span>
                  <span className="block text-xs text-[var(--text-tertiary)]">{getAssignmentRoleLabel(a.role)}</span>
                </span>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
