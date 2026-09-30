'use client'

import { useState, useCallback } from 'react'
import { useAsyncData } from '@/hooks/use-async-data'
import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { PRIVILEGE_DEFINITIONS, PRIVILEGES_WITH_BACKING_VOCALS, PrivilegeKey, PrivilegeSongItem } from '@/types/privileges'
import { getAutoDateForPrivilege, getUpcomingServiceDate, formatFullSpanishDate, formatISOShortDate, getNextWeekDate } from '@/lib/date-helpers'
import {
  saveLocalPrivilege,
  getLocalPrivileges,
  removeLocalPrivilege,
  addBackingVocal,
  removeBackingVocal,
} from '@/lib/privilege-storage'
import { useProfile } from '@/components/providers/profile-provider'
import { RepertoireEditor } from '@/components/songs/repertoire-editor'
import { Button, Badge, Textarea, Modal } from '@/components/ui'
import { Guitar, Mic, Users, Music, Calendar, Trash2, CheckCircle2, Clock, X } from 'lucide-react'
import { useToast } from '@/components/providers/toast-provider'
import { cn } from '@/lib/utils'

interface BackingDraft {
  /** Row id when it is already saved */
  id?: string
  profile_id: string
  name: string
}

interface PrivilegeForm {
  songs: PrivilegeSongItem[]
  notes: string
  backing: BackingDraft[]
  /** Database id when this privilege/date is already registered */
  savedId?: string | null
  /** Registered already, in the database or only on this device */
  exists?: boolean
}

interface RegisterPrivilegeModalProps {
  isOpen: boolean
  onClose: () => void
  defaultPrivilegeKey?: PrivilegeKey
  targetDate?: Date
  allowedDay?: 'saturday' | 'sunday'
  onSuccess: () => void
}

export function RegisterPrivilegeModal({
  isOpen,
  onClose,
  defaultPrivilegeKey = 'saturday_musician',
  targetDate,
  allowedDay,
  onSuccess,
}: RegisterPrivilegeModalProps) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const supabase = useSupabase()
  const { toast } = useToast()

  const [selectedPrivilege, setSelectedPrivilege] = useState<PrivilegeKey>(defaultPrivilegeKey)
  const [useNextWeek, setUseNextWeek] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Re-sync the selection each time the modal opens (adjusting state during render,
  // not in an effect, so the first open frame already shows the right privilege)
  const [draft, setDraft] = useState<({ key: string } & PrivilegeForm) | null>(null)
  const [openedWith, setOpenedWith] = useState<PrivilegeKey | null>(null)
  const openKey = isOpen ? defaultPrivilegeKey : null
  if (openKey !== openedWith) {
    setOpenedWith(openKey)
    if (openKey) {
      setSelectedPrivilege(openKey)
      setUseNextWeek(false)
      setConfirmDelete(false)
      setDraft(null) // discard unsaved edits from a cancelled session
    }
  }

  // Calculate automatic date based on targetDate (Weekly Matrix) or current date (Dashboard)
  let autoDate: Date
  if (targetDate) {
    autoDate = getAutoDateForPrivilege(selectedPrivilege, targetDate)
  } else {
    const baseDate = new Date()
    const upcomingDate = getUpcomingServiceDate(selectedPrivilege, baseDate)
    autoDate = useNextWeek ? getNextWeekDate(upcomingDate) : upcomingDate
  }
  const formattedSpanishDate = formatFullSpanishDate(autoDate)
  const isoShortDate = formatISOShortDate(autoDate)

  // Existing registration for this privilege/date (local first, then remote)
  const userId = user?.id
  const loadExisting = useCallback(async (): Promise<PrivilegeForm> => {
    const empty: PrivilegeForm = { songs: [], notes: '', backing: [] }
    let remote: { id: string; songs: PrivilegeSongItem[] | null; notes: string | null } | null = null
    try {
      const { data, error } = await supabase
        .from('weekly_privileges')
        .select('id, songs, notes')
        .eq('profile_id', userId)
        .eq('privilege_key', selectedPrivilege)
        .eq('assigned_date', isoShortDate)
        .maybeSingle()
      if (!error) remote = data
    } catch {
      // Offline: fall back to the local copy
    }

    let backing: BackingDraft[] = []
    if (remote) {
      const { data } = await supabase
        .from('privilege_backing_vocals')
        .select('id, profile_id, profile:profiles!privilege_backing_vocals_profile_id_fkey(full_name)')
        .eq('privilege_id', remote.id)
      backing = ((data || []) as { id: string; profile_id: string; profile: { full_name: string | null } | { full_name: string | null }[] | null }[]).map((row) => ({
        id: row.id,
        profile_id: row.profile_id,
        name: (Array.isArray(row.profile) ? row.profile[0] : row.profile)?.full_name || 'Miembro',
      }))
    }

    const foundLocal = getLocalPrivileges().find(
      (p) => p.profile_id === userId && p.privilege_key === selectedPrivilege && p.assigned_date === isoShortDate
    )
    const savedId = remote?.id ?? null
    if (foundLocal) return { songs: foundLocal.songs || [], notes: foundLocal.notes || '', backing, savedId, exists: true }
    if (remote) return { songs: remote.songs || [], notes: remote.notes || '', backing, savedId, exists: true }
    return empty
  }, [supabase, userId, selectedPrivilege, isoShortDate])

  const existing = useAsyncData<PrivilegeForm>(isOpen && user ? loadExisting : null, { songs: [], notes: '', backing: [] })

  // Members that can be picked as backing vocals
  const loadMembers = useCallback(async (): Promise<{ id: string; full_name: string }[]> => {
    const { data } = await supabase.from('profiles').select('id, full_name').order('full_name')
    return ((data || []) as { id: string; full_name: string | null }[])
      .filter((p) => p.id !== userId)
      .map((p) => ({ id: p.id, full_name: p.full_name || 'Miembro' }))
  }, [supabase, userId])
  const takesBackingVocals = PRIVILEGES_WITH_BACKING_VOCALS.includes(selectedPrivilege)
  const members = useAsyncData(isOpen && user && takesBackingVocals ? loadMembers : null, [])

  // User edits are tied to the privilege/date they were made for
  const draftKey = `${selectedPrivilege}|${isoShortDate}`
  const current = draft && draft.key === draftKey ? draft : existing.data
  const songs = current.songs
  const notes = current.notes
  const backing = current.backing
  const updateDraft = (patch: Partial<PrivilegeForm>) =>
    setDraft({ key: draftKey, songs, notes, backing, ...patch })

  const handleAddBacking = (profileId: string) => {
    const member = members.data.find((m) => m.id === profileId)
    if (!member || backing.some((b) => b.profile_id === profileId)) return
    updateDraft({ backing: [...backing, { profile_id: member.id, name: member.full_name }] })
  }

  const handleRemoveBacking = (profileId: string) => {
    updateDraft({ backing: backing.filter((b) => b.profile_id !== profileId) })
  }

  /** Applies backing vocal additions/removals once the privilege row exists. */
  const syncBackingVocals = async (privilegeId: string): Promise<string[]> => {
    const before = existing.data.backing
    const errors: string[] = []
    for (const b of backing.filter((b) => !before.some((x) => x.profile_id === b.profile_id))) {
      const error = await addBackingVocal(supabase, privilegeId, b.profile_id)
      if (error) errors.push(`${b.name}: ${error}`)
    }
    for (const b of before.filter((b) => !backing.some((x) => x.profile_id === b.profile_id))) {
      const error = b.id ? await removeBackingVocal(supabase, b.id) : null
      if (error) errors.push(`${b.name}: ${error}`)
    }
    return errors
  }

  const currentDefinition = PRIVILEGE_DEFINITIONS.find(p => p.key === selectedPrivilege)!

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Guitar': return <Guitar className="w-4 h-4" />
      case 'Mic': return <Mic className="w-4 h-4" />
      case 'Users': return <Users className="w-4 h-4" />
      case 'Music': default: return <Music className="w-4 h-4" />
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    let savedId: string | null = null
    let serverError = false
    try {
      const { data: saved, error } = await supabase
        .from('weekly_privileges')
        .upsert(
          {
            profile_id: user.id,
            privilege_key: selectedPrivilege,
            assigned_date: isoShortDate,
            songs: songs,
            notes: notes.trim() || null,
          },
          { onConflict: 'profile_id,privilege_key,assigned_date' }
        )
        .select('id')
        .single()
      if (error) serverError = true
      else savedId = saved?.id ?? null
    } catch {
      // Network failure: handled below as offline
    }

    // The server answered "no" (permissions, validation): nothing was saved anywhere
    if (serverError) {
      setLoading(false)
      toast({
        title: 'No se pudo registrar tu privilegio',
        description: 'Inténtalo de nuevo. Si el problema sigue, avísale a un líder.',
        variant: 'destructive',
      })
      return
    }

    // No connection: keep it on this phone so the work isn't lost, and say so
    const offline = !savedId
    if (offline) {
      saveLocalPrivilege({
        id: `priv_${Date.now()}`,
        profile_id: user.id,
        profile_name: profile?.full_name || user.email?.split('@')[0] || 'Miembro',
        privilege_key: selectedPrivilege,
        assigned_date: isoShortDate,
        songs,
        notes: notes.trim() || undefined,
        created_at: new Date().toISOString(),
      })
    } else {
      // The database is the source of truth now; drop any older offline copy
      removeLocalPrivilege(user.id, selectedPrivilege, isoShortDate)
    }

    let backingErrors: string[] = []
    if (savedId && takesBackingVocals) backingErrors = await syncBackingVocals(savedId)

    // Notify all users about the new privilege (best-effort, only once it is really saved)
    if (!offline) {
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new_privilege',
          authorId: user.id,
          privilegeKey: selectedPrivilege,
          assignedDate: isoShortDate,
          songs,
        }),
      }).catch(() => {})
    }

    toast(
      offline
        ? {
            title: 'Guardado solo en este teléfono',
            description: 'No hay conexión. Vuelve a guardarlo cuando tengas internet para que el equipo lo vea.',
            variant: 'warning',
          }
        : {
            title: 'Privilegio registrado',
            description: `"${currentDefinition.title}" para el ${formattedSpanishDate}.`,
            variant: 'success',
          }
    )
    if (backingErrors.length > 0) {
      toast({ title: 'Algunas coristas no se guardaron', description: backingErrors.join(' · '), variant: 'warning' })
    }
    setDraft(null)
    onSuccess()
    onClose()
    setLoading(false)
  }

  const alreadyRegistered = Boolean(existing.data.exists)

  const handleDelete = async () => {
    if (!user) return
    setLoading(true)
    const savedId = existing.data.savedId
    if (savedId) {
      const { error } = await supabase.from('weekly_privileges').delete().eq('id', savedId)
      if (error) {
        setLoading(false)
        toast({ title: 'No se pudo eliminar', description: 'Inténtalo de nuevo en un momento.', variant: 'destructive' })
        return
      }
    }
    removeLocalPrivilege(user.id, selectedPrivilege, isoShortDate)
    toast({ title: 'Privilegio eliminado', description: `"${currentDefinition.title}" del ${formattedSpanishDate}.`, variant: 'success' })
    setConfirmDelete(false)
    setDraft(null)
    setLoading(false)
    onSuccess()
    onClose()
  }


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={alreadyRegistered ? 'Editar mi privilegio' : 'Registrar mi privilegio'}
      description={alreadyRegistered ? 'Cambia tus alabanzas o elimina el registro' : 'Agrega tus alabanzas y confirma tu participación'}
      dismissible={!loading}
      footer={
        confirmDelete ? (
          <>
            <p className="text-sm text-[var(--text-primary)] sm:mr-auto" role="alert">
              ¿Eliminar tu privilegio del {formattedSpanishDate}?
            </p>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={loading}>
              No, conservarlo
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={loading}>
              <Trash2 className="w-4 h-4" />
              Sí, eliminar
            </Button>
          </>
        ) : (
          <>
            {alreadyRegistered && (
              <Button
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
                disabled={loading}
                className="sm:mr-auto text-[var(--color-error)] hover:text-[var(--color-error)]"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </Button>
            )}
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button form="privilege-modal-form" type="submit" loading={loading}>
              <CheckCircle2 className="w-4 h-4" />
              {alreadyRegistered ? 'Guardar cambios' : 'Registrar privilegio'}
            </Button>
          </>
        )
      }
    >
      <form id="privilege-modal-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Privilege selection */}
        <fieldset className="space-y-2">
          <legend className="block text-xs font-mono text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
            Privilegio seleccionado
          </legend>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {PRIVILEGE_DEFINITIONS.filter((def) => !allowedDay || def.day === allowedDay).map((def) => {
              const isSelected = selectedPrivilege === def.key
              return (
                <button
                  key={def.key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedPrivilege(def.key)
                    setConfirmDelete(false)
                  }}
                  className={cn(
                    'min-h-20 p-3 rounded-[var(--radius-md)] border text-left transition-colors cursor-pointer flex flex-col justify-between gap-2',
                    isSelected
                      ? 'bg-[var(--bg-raised)] border-[var(--text-primary)] ring-1 ring-[var(--text-primary)]'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                  )}
                >
                  <span className="flex items-center justify-between w-full gap-2">
                    <span
                      className={cn(
                        'w-7 h-7 rounded-md flex items-center justify-center',
                        isSelected ? 'bg-[var(--text-primary)] text-[var(--text-inverse)]' : 'bg-[var(--bg-active)] text-[var(--text-secondary)]'
                      )}
                    >
                      {getIconComponent(def.iconName)}
                    </span>
                    <Badge variant={def.day === 'saturday' ? 'brand' : 'secondary'} size="sm">
                      {def.dayLabel}
                    </Badge>
                  </span>
                  <span className={cn('font-semibold text-sm leading-tight', isSelected && 'text-[var(--text-primary)]')}>
                    {def.title}
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>

        {/* Auto date */}
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Calendar className="w-4 h-4 text-[var(--text-primary)] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <span className="text-caption font-mono text-[var(--text-tertiary)] uppercase tracking-wider block">Fecha asignada</span>
              <span className="text-sm font-semibold text-[var(--color-gs-12)]">{formattedSpanishDate}</span>
            </div>
          </div>

          {!targetDate && (
            <Button variant="outline" size="sm" onClick={() => setUseNextWeek(!useNextWeek)} fullWidthMobile>
              <Clock className="w-4 h-4" />
              {useNextWeek ? 'Usar esta semana' : 'Usar próxima semana'}
            </Button>
          )}
        </div>

        {/* Songs */}
        <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Mi listado de alabanzas ({songs.length})
          </p>

          <RepertoireEditor
            songs={songs}
            onChange={(next) => updateDraft({ songs: next })}
            disabled={loading}
            emptyText="No has seleccionado alabanzas aún. Busca en el catálogo de arriba o propone una nueva."
          />
        </div>

        {takesBackingVocals && (
          <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Coristas ({backing.length})</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                Quienes te acompañan en este privilegio. También pueden unirse desde la tabla semanal.
              </p>
            </div>

            <label className="block">
              <span className="sr-only">Añadir corista</span>
              <select
                value=""
                onChange={(e) => handleAddBacking(e.target.value)}
                disabled={loading || members.loading}
                className="w-full h-11 sm:h-9 bg-[var(--bg-surface)] border border-[var(--border-normal)] text-[var(--text-primary)] rounded-[var(--radius-md)] text-base sm:text-sm px-3 focus:outline-none focus:border-[var(--text-primary)] disabled:opacity-50"
              >
                <option value="" className="bg-[var(--bg-raised)]">
                  {members.loading ? 'Cargando miembros…' : '+ Añadir corista…'}
                </option>
                {members.data
                  .filter((m) => !backing.some((b) => b.profile_id === m.id))
                  .map((m) => (
                    <option key={m.id} value={m.id} className="bg-[var(--bg-raised)] text-[var(--text-primary)]">
                      {m.full_name}
                    </option>
                  ))}
              </select>
            </label>

            {backing.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {backing.map((b) => (
                  <li
                    key={b.profile_id}
                    className="inline-flex items-center gap-1 min-h-9 pl-3 pr-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm"
                  >
                    <span className="truncate max-w-[12rem]">{b.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBacking(b.profile_id)}
                      disabled={loading}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--bg-hover)] transition-colors"
                      aria-label={`Quitar a ${b.name} como corista`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <Textarea
          label="Notas (opcional)"
          placeholder="Ej. Ensayar intro, llevar guitarra acústica..."
          value={notes}
          onChange={(e) => updateDraft({ notes: e.target.value })}
          disabled={loading}
          className="min-h-[80px]"
        />
      </form>
    </Modal>
  )
}
