'use client'

import { useCallback, useState } from 'react'
import { useAsyncData } from '@/hooks/use-async-data'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, Building2, Calendar, Check, Clock, MapPin, Users, X, FileText, ListMusic, Pencil, UserPlus, LogOut } from 'lucide-react'
import { RepertoireList } from '@/components/songs/repertoire-list'
import type { PrivilegeSongItem } from '@/types/privileges'
import { useAuth } from '@/components/providers/auth-provider'
import { useProfile } from '@/components/providers/profile-provider'
import { useToast } from '@/components/providers/toast-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { Badge, Button, Modal, PageHeader, PageLoader, EmptyState, buttonVariants } from '@/components/ui'
import { ASSIGNMENT_ROLES, StatusBadge, getAssignmentRoleLabel } from '@/components/admin/assignment-status'
import { cn, formatTime, getEventTypeColor, getEventTypeLabel } from '@/lib/utils'
import type { AssignmentRole, AssignmentStatus, EventType } from '@/types'

interface EventDetail {
  id: string
  title: string
  event_type: EventType
  organizer: string | null
  date: string
  end_date: string | null
  arrival_time: string | null
  start_time: string | null
  end_time: string | null
  location: string | null
  notes: string | null
  songs: PrivilegeSongItem[] | null
  created_by: string | null
}

const parseLocalDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
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
  const { isAdmin } = useProfile()
  const supabase = useSupabase()
  const { toast } = useToast()
  const [responding, setResponding] = useState<string | null>(null)
  const [showJoin, setShowJoin] = useState(false)
  const [joinRole, setJoinRole] = useState<AssignmentRole>('choir')
  const [joining, setJoining] = useState(false)

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

  const join = async () => {
    if (!user) return
    setJoining(true)
    // Signing yourself up is already a yes
    const { error } = await supabase.from('event_assignments').insert({
      event_id: id,
      profile_id: user.id,
      role: joinRole,
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    setJoining(false)
    if (error) {
      toast({ title: 'No se pudo apuntarte', description: 'Inténtalo de nuevo en un momento.', variant: 'destructive' })
      return
    }
    toast({ title: 'Te apuntaste', description: `Participas como ${getAssignmentRoleLabel(joinRole)}.`, variant: 'success' })
    setShowJoin(false)
    reload()
  }

  const leave = async (assignment: AssignmentRow) => {
    setResponding(assignment.id)
    const { error } = await supabase.from('event_assignments').delete().eq('id', assignment.id)
    setResponding(null)
    if (error) {
      toast({ title: 'No se pudo quitar tu participación', description: 'Inténtalo de nuevo.', variant: 'destructive' })
      return
    }
    toast({ title: 'Ya no participas en este evento' })
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
          <Link href="/dashboard/special-events" className={buttonVariants({ fullWidthMobile: true })}>
            Ver eventos
          </Link>
        }
      />
    )
  }

  const date = parseLocalDate(event.date)
  const endDate = event.end_date ? parseLocalDate(event.end_date) : null
  const mine = assignments.filter((a) => a.profile_id === user?.id)
  const canEdit = isAdmin || (!!user && event.created_by === user.id)

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/dashboard/special-events" className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-3' })}>
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Eventos
      </Link>

      <PageHeader
        title={event.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge size="sm" className={getEventTypeColor(event.event_type)}>
              {getEventTypeLabel(event.event_type)}
            </Badge>
            {event.organizer && (
              <span className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                {event.organizer}
              </span>
            )}
          </span>
        }
        actions={
          canEdit ? (
            <Link href={`/dashboard/special-events/${event.id}/edit`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <Pencil className="w-4 h-4" aria-hidden="true" />
              Editar
            </Link>
          ) : undefined
        }
      />

      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-raised)] border border-[var(--border-subtle)]">
          <dt className="text-caption font-mono uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" /> {endDate ? 'Fechas' : 'Fecha'}
          </dt>
          <dd className="text-sm font-semibold mt-1 first-letter:uppercase">
            {endDate
              ? `${format(date, "EEE d 'de' MMM", { locale: es })} – ${format(endDate, "EEE d 'de' MMM", { locale: es })}`
              : format(date, "EEEE d 'de' MMMM", { locale: es })}
          </dd>
        </div>
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-raised)] border border-[var(--border-subtle)]">
          <dt className="text-caption font-mono uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" /> Hora
          </dt>
          <dd className="text-sm font-semibold mt-1 font-mono">
            {event.start_time ? formatTime(event.start_time) : 'Por definir'}
            {event.end_time && ` – ${formatTime(event.end_time)}`}
          </dd>
          {event.arrival_time && (
            <dd className="text-xs text-[var(--text-secondary)] mt-1">
              Llegada: <span className="font-mono">{formatTime(event.arrival_time)}</span>
            </dd>
          )}
        </div>
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-raised)] border border-[var(--border-subtle)]">
          <dt className="text-caption font-mono uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" /> Lugar
          </dt>
          <dd className="text-sm font-semibold mt-1 break-words">{event.location || 'Por definir'}</dd>
        </div>
      </dl>

      <section className="space-y-3" aria-labelledby="mine-title">
        <h2 id="mine-title" className="text-base font-bold">Mi participación</h2>
        {mine.length === 0 ? (
          <div className="p-4 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-normal)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-[var(--text-secondary)]">Aún no participas en este evento.</p>
            <Button onClick={() => setShowJoin(true)} fullWidthMobile>
              <UserPlus className="w-4 h-4" />
              Me apunto
            </Button>
          </div>
        ) : (
          mine.map((a) => (
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
              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:w-auto text-[var(--text-tertiary)]"
                onClick={() => leave(a)}
                disabled={responding === a.id}
              >
                <LogOut className="w-4 h-4" />
                Salirme del evento
              </Button>
            </div>
          ))
        )}
      </section>

      {event.songs && event.songs.length > 0 && (
        <section className="space-y-3" aria-labelledby="repertoire-title">
          <h2 id="repertoire-title" className="text-base font-bold flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-[var(--text-secondary)]" aria-hidden="true" />
            Repertorio ({event.songs.length})
          </h2>
          <RepertoireList songs={event.songs} />
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
          <p className="text-sm text-[var(--text-tertiary)]">Aún no se ha apuntado nadie.</p>
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

      <Modal
        isOpen={showJoin}
        onClose={() => setShowJoin(false)}
        size="sm"
        title="Me apunto"
        description={event.title}
        dismissible={!joining}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowJoin(false)} disabled={joining}>
              Cancelar
            </Button>
            <Button onClick={join} loading={joining}>
              <Check className="w-4 h-4" />
              Apuntarme
            </Button>
          </>
        }
      >
        <fieldset>
          <legend className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">¿Cómo participas?</legend>
          <div className="grid grid-cols-2 gap-2">
            {ASSIGNMENT_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                aria-pressed={joinRole === role}
                onClick={() => setJoinRole(role)}
                className={cn(
                  'min-h-11 px-3 rounded-[var(--radius-md)] border text-sm font-medium transition-colors text-left',
                  joinRole === role
                    ? 'bg-[var(--text-primary)] text-[var(--text-inverse)] border-[var(--text-primary)]'
                    : 'bg-[var(--bg-surface)] border-[var(--border-normal)] text-[var(--text-secondary)]'
                )}
              >
                {getAssignmentRoleLabel(role)}
              </button>
            ))}
          </div>
        </fieldset>
      </Modal>
    </div>
  )
}
