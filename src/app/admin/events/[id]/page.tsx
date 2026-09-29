'use client'

import { useCallback, useState } from 'react'
import { useAsyncData } from '@/hooks/use-async-data'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, UserPlus, Users, MoreHorizontal } from 'lucide-react'
import { useSupabase } from '@/hooks/use-supabase'
import { useToast } from '@/components/providers/toast-provider'
import { Button, Modal, PageHeader, PageLoader, EmptyState, Select, buttonVariants } from '@/components/ui'
import { EventForm, toEventRow, type EventFormValues } from '@/components/admin/event-form'
import {
  ASSIGNMENT_ROLES,
  ASSIGNMENT_STATUSES,
  StatusBadge,
  getAssignmentRoleLabel,
  getAssignmentStatusLabel,
} from '@/components/admin/assignment-status'
import { cn } from '@/lib/utils'
import type { AssignmentRole, AssignmentStatus, EventType } from '@/types'

interface EventRecord {
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
  role: AssignmentRole
  status: AssignmentStatus
  profile_id: string
  profile: { full_name: string | null } | { full_name: string | null }[] | null
}

interface Member {
  id: string
  full_name: string | null
}

const profileName = (a: AssignmentRow) => {
  const p = Array.isArray(a.profile) ? a.profile[0] : a.profile
  return p?.full_name || 'Miembro'
}

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [saving, setSaving] = useState(false)

  const [showDelete, setShowDelete] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newMember, setNewMember] = useState('')
  const [newRole, setNewRole] = useState<AssignmentRole>('lead_vocal')
  const [editing, setEditing] = useState<AssignmentRow | null>(null)

  const loadBase = useCallback(async () => {
    const [eventRes, membersRes] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).maybeSingle(),
      supabase.from('profiles').select('id, full_name').order('full_name'),
    ])
    return { event: eventRes.data as EventRecord | null, members: (membersRes.data || []) as Member[] }
  }, [supabase, id])

  const loadAssignments = useCallback(async () => {
    const { data } = await supabase
      .from('event_assignments')
      .select('id, role, status, profile_id, profile:profiles(full_name)')
      .eq('event_id', id)
      .order('role')
    return (data as AssignmentRow[]) || []
  }, [supabase, id])

  const base = useAsyncData(loadBase, { event: null as EventRecord | null, members: [] as Member[] })
  const team = useAsyncData<AssignmentRow[]>(loadAssignments, [])
  const { event, members } = base.data
  const assignments = team.data
  const loading = base.loading || team.loading

  const handleUpdate = async (values: EventFormValues) => {
    setSaving(true)
    const { error } = await supabase.from('events').update(toEventRow(values)).eq('id', id)
    setSaving(false)
    if (error) {
      toast({ title: 'Error', description: 'No se pudo guardar el evento. Solo líderes y administradores pueden editarlo.', variant: 'destructive' })
      return false
    }
    toast({ title: 'Evento actualizado', variant: 'success' })
    base.reload()
    return true
  }

  const handleDelete = async () => {
    setSaving(true)
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) {
      setSaving(false)
      toast({ title: 'Error', description: 'No se pudo eliminar el evento', variant: 'destructive' })
      return
    }
    toast({ title: 'Evento eliminado', variant: 'success' })
    router.replace('/admin/events')
  }

  const handleAddAssignment = async () => {
    if (!newMember) return
    setSaving(true)
    const { error } = await supabase
      .from('event_assignments')
      .insert({ event_id: id, profile_id: newMember, role: newRole, status: 'pending' })
    setSaving(false)
    if (error) {
      const duplicate = error.code === '23505'
      toast({
        title: 'No se pudo asignar',
        description: duplicate ? 'Ese miembro ya tiene ese rol en este evento.' : 'Intenta de nuevo.',
        variant: 'destructive',
      })
      return
    }
    setShowAdd(false)
    setNewMember('')
    team.reload()
  }

  const handleStatusChange = async (assignment: AssignmentRow, status: AssignmentStatus) => {
    setSaving(true)
    await supabase
      .from('event_assignments')
      .update({ status, confirmed_at: status === 'confirmed' ? new Date().toISOString() : null })
      .eq('id', assignment.id)
    setSaving(false)
    setEditing(null)
    team.reload()
  }

  const handleRemoveAssignment = async (assignment: AssignmentRow) => {
    setSaving(true)
    await supabase.from('event_assignments').delete().eq('id', assignment.id)
    setSaving(false)
    setEditing(null)
    team.reload()
  }

  if (loading) return <PageLoader />

  if (!event) {
    return (
      <EmptyState
        title="Evento no encontrado"
        description="Puede que haya sido eliminado."
        action={
          <Link href="/admin/events" className={buttonVariants({ fullWidthMobile: true })}>
            Volver a eventos
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/events" className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-3' })}>
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Eventos
      </Link>

      <PageHeader
        title={event.title}
        description="Edita los datos del evento y gestiona quién participa."
        actions={
          <Button variant="outline" onClick={() => setShowDelete(true)} className="text-[var(--color-error)] border-[var(--color-error)]/40">
            <Trash2 className="w-4 h-4" />
            Eliminar
          </Button>
        }
      />

      {/* Assignments first on phones: it's the frequent task */}
      <section className="space-y-3" aria-labelledby="assignments-title">
        <div className="flex items-center justify-between gap-2">
          <h2 id="assignments-title" className="text-base font-bold flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--text-secondary)]" aria-hidden="true" />
            Equipo asignado ({assignments.length})
          </h2>
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
            <UserPlus className="w-4 h-4" />
            Asignar
          </Button>
        </div>

        {assignments.length === 0 ? (
          <p className="p-4 rounded-[var(--radius-md)] border border-dashed border-[var(--border-normal)] text-sm text-[var(--text-tertiary)] text-center">
            Nadie asignado todavía.
          </p>
        ) : (
          <ul className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-raised)] divide-y divide-[var(--border-subtle)] overflow-hidden">
            {assignments.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setEditing(a)}
                  className="w-full flex items-center gap-3 min-h-14 px-3 sm:px-4 py-2.5 text-left hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-[var(--bg-active)] border border-[var(--border-normal)] flex items-center justify-center text-xs font-semibold shrink-0">
                    {profileName(a).charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold truncate">{profileName(a)}</span>
                    <span className="block text-xs text-[var(--text-tertiary)]">{getAssignmentRoleLabel(a.role)}</span>
                  </span>
                  <StatusBadge status={a.status} />
                  <MoreHorizontal className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 pt-2 border-t border-[var(--border-subtle)]" aria-labelledby="details-title">
        <h2 id="details-title" className="text-base font-bold pt-4">Datos del evento</h2>
        <EventForm
          saving={saving}
          submitLabel="Guardar cambios"
          onSubmit={handleUpdate}
          defaultValues={{
            title: event.title,
            event_type: event.event_type,
            date: event.date,
            start_time: event.start_time?.slice(0, 5) ?? '',
            end_time: event.end_time?.slice(0, 5) ?? '',
            location: event.location ?? '',
            notes: event.notes ?? '',
          }}
        />
      </section>

      {/* Add assignment */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Asignar al equipo"
        description={event.title}
        dismissible={!saving}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAdd(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleAddAssignment} loading={saving} disabled={!newMember}>
              <Plus className="w-4 h-4" />
              Asignar
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Select
            id="assign-member"
            label="Miembro"
            placeholder="Selecciona un miembro"
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
            options={members.map((m) => ({ value: m.id, label: m.full_name || 'Sin nombre' }))}
          />
          <fieldset>
            <legend className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Rol</legend>
            <div className="grid grid-cols-2 gap-2">
              {ASSIGNMENT_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  aria-pressed={newRole === role}
                  onClick={() => setNewRole(role)}
                  className={cn(
                    'min-h-11 px-3 rounded-[var(--radius-md)] border text-sm font-medium transition-colors text-left',
                    newRole === role
                      ? 'bg-[var(--text-primary)] text-[var(--text-inverse)] border-[var(--text-primary)]'
                      : 'bg-[var(--bg-surface)] border-[var(--border-normal)] text-[var(--text-secondary)]'
                  )}
                >
                  {getAssignmentRoleLabel(role)}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </Modal>

      {/* Edit one assignment */}
      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        size="sm"
        title={editing ? profileName(editing) : ''}
        description={editing ? getAssignmentRoleLabel(editing.role) : undefined}
        dismissible={!saving}
      >
        {editing && (
          <div className="space-y-5">
            <fieldset>
              <legend className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Estado</legend>
              <div className="grid gap-2">
                {ASSIGNMENT_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={editing.status === status}
                    disabled={saving}
                    onClick={() => handleStatusChange(editing, status)}
                    className={cn(
                      'min-h-12 px-4 rounded-[var(--radius-md)] border text-sm font-medium flex items-center justify-between transition-colors',
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
            <Button
              variant="outline"
              className="w-full text-[var(--color-error)] border-[var(--color-error)]/40"
              onClick={() => handleRemoveAssignment(editing)}
              loading={saving}
            >
              <Trash2 className="w-4 h-4" />
              Quitar del evento
            </Button>
          </div>
        )}
      </Modal>

      {/* Delete event */}
      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        tone="danger"
        size="sm"
        title="Eliminar evento"
        dismissible={!saving}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowDelete(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={saving}>
              Sí, eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Se eliminará <strong className="text-[var(--text-primary)]">{event.title}</strong> y todas sus asignaciones. Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  )
}
