'use client'

import { useCallback, useMemo, useState } from 'react'
import { useAsyncData } from '@/hooks/use-async-data'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ClipboardList, ChevronRight, Plus } from 'lucide-react'
import { useSupabase } from '@/hooks/use-supabase'
import { Modal, PageHeader, PageLoader, EmptyState, ErrorState, buttonVariants } from '@/components/ui'
import { useToast } from '@/components/providers/toast-provider'
import {
  ASSIGNMENT_STATUSES,
  StatusBadge,
  getAssignmentRoleLabel,
  getAssignmentStatusLabel,
} from '@/components/admin/assignment-status'
import { formatISOShortDate } from '@/lib/date-helpers'
import { cn } from '@/lib/utils'
import type { AssignmentRole, AssignmentStatus } from '@/types'

interface AssignmentRow {
  id: string
  role: AssignmentRole
  status: AssignmentStatus
  profile: { full_name: string | null } | { full_name: string | null }[] | null
}

interface EventWithAssignments {
  id: string
  title: string
  date: string
  event_assignments: AssignmentRow[]
}

type StatusFilter = 'all' | AssignmentStatus

const nameOf = (a: AssignmentRow) => (Array.isArray(a.profile) ? a.profile[0] : a.profile)?.full_name || 'Miembro'

function parseLocalDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export default function AdminAssignmentsPage() {
  const supabase = useSupabase()
  const { toast } = useToast()
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [editing, setEditing] = useState<AssignmentRow | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('events')
      .select('id, title, date, event_assignments(id, role, status, profile:profiles(full_name))')
      .gte('date', formatISOShortDate(new Date()))
      .order('date', { ascending: true })
      .limit(30)
    if (error) throw error
    return (data as EventWithAssignments[]) || []
  }, [supabase])
  const { data: events, loading, error, reload } = useAsyncData<EventWithAssignments[]>(load, [])

  const counts = useMemo(() => {
    const all = events.flatMap((e) => e.event_assignments)
    return {
      all: all.length,
      pending: all.filter((a) => a.status === 'pending').length,
      confirmed: all.filter((a) => a.status === 'confirmed').length,
      declined: all.filter((a) => a.status === 'declined').length,
    }
  }, [events])

  const changeStatus = async (assignment: AssignmentRow, status: AssignmentStatus) => {
    setSaving(true)
    const { error: updateError } = await supabase
      .from('event_assignments')
      .update({ status, confirmed_at: status === 'confirmed' ? new Date().toISOString() : null })
      .eq('id', assignment.id)
    setSaving(false)
    if (updateError) {
      toast({ title: 'No se pudo cambiar el estado', description: 'Inténtalo de nuevo.', variant: 'destructive' })
      return
    }
    toast({ title: `${nameOf(assignment)}: ${getAssignmentStatusLabel(status).toLowerCase()}`, variant: 'success' })
    setEditing(null)
    reload()
  }

  if (loading) return <PageLoader />
  if (error && events.length === 0) return <ErrorState title="No se pudieron cargar las asignaciones" onRetry={reload} />

  const filters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: `Todas (${counts.all})` },
    ...ASSIGNMENT_STATUSES.map((s) => ({ value: s, label: `${getAssignmentStatusLabel(s)} (${counts[s]})` })),
  ]

  const visible = events
    .map((e) => ({
      ...e,
      event_assignments: filter === 'all' ? e.event_assignments : e.event_assignments.filter((a) => a.status === filter),
    }))
    .filter((e) => filter === 'all' || e.event_assignments.length > 0)

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Asignaciones" description="Quién participa en los próximos eventos especiales y si ya confirmó." />

      <div className="scroll-x flex gap-2 -mx-4 px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filtrar por estado">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'shrink-0 min-h-11 sm:min-h-8 px-4 rounded-full border text-sm sm:text-xs font-medium transition-colors whitespace-nowrap',
              filter === f.value
                ? 'bg-[var(--text-primary)] text-[var(--text-inverse)] border-[var(--text-primary)]'
                : 'border-[var(--border-normal)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<ClipboardList />}
          title={events.length === 0 ? 'No hay eventos próximos' : 'Nada con este estado'}
          description={events.length === 0 ? 'Cuando nos inviten a un campamento o evento especial, créalo para asignar al equipo.' : undefined}
          action={
            events.length === 0 ? (
              <Link href="/admin/events/new" className={buttonVariants({ fullWidthMobile: true })}>
                <Plus className="w-4 h-4" aria-hidden="true" />
                Nuevo Evento
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-5">
          {visible.map((event) => (
            <section key={event.id} className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-raised)] overflow-hidden">
              <Link
                href={`/admin/events/${event.id}`}
                className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3 bg-[var(--bg-page)] border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold truncate">{event.title}</span>
                  <span className="block text-xs font-mono text-[var(--text-tertiary)] first-letter:uppercase">
                    {format(parseLocalDate(event.date), "EEEE d 'de' MMMM", { locale: es })}
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />
              </Link>
              {event.event_assignments.length === 0 ? (
                <p className="px-4 py-3 text-sm text-[var(--text-tertiary)]">Sin asignaciones.</p>
              ) : (
                <ul className="divide-y divide-[var(--border-subtle)]">
                  {event.event_assignments.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => setEditing(a)}
                        className="w-full flex items-center gap-3 min-h-12 px-3 sm:px-4 py-2 text-left hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors"
                      >
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium truncate">{nameOf(a)}</span>
                          <span className="block text-xs text-[var(--text-tertiary)]">{getAssignmentRoleLabel(a.role)}</span>
                        </span>
                        <StatusBadge status={a.status} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        size="sm"
        title={editing ? nameOf(editing) : ''}
        description={editing ? getAssignmentRoleLabel(editing.role) : undefined}
        dismissible={!saving}
      >
        {editing && (
          <fieldset>
            <legend className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Cambiar estado</legend>
            <div className="grid gap-2">
              {ASSIGNMENT_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  aria-pressed={editing.status === status}
                  disabled={saving}
                  onClick={() => changeStatus(editing, status)}
                  className={cn(
                    'min-h-12 px-4 rounded-[var(--radius-md)] border text-sm font-medium flex items-center justify-between transition-colors disabled:opacity-50',
                    editing.status === status
                      ? 'border-[var(--text-primary)] bg-[var(--bg-hover)]'
                      : 'border-[var(--border-normal)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)]'
                  )}
                >
                  {getAssignmentStatusLabel(status)}
                  <StatusBadge status={status} />
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </Modal>
    </div>
  )
}
