'use client'

import { useState, useCallback } from 'react'
import { useAsyncData } from '@/hooks/use-async-data'
import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { PRIVILEGE_DEFINITIONS, PRIVILEGES_WITH_BACKING_VOCALS, PrivilegeKey, PrivilegeSongItem } from '@/types/privileges'
import { getAutoDateForPrivilege, getUpcomingServiceDate, formatFullSpanishDate, formatISOShortDate, getNextWeekDate } from '@/lib/date-helpers'
import { saveLocalPrivilege, getLocalPrivileges, addBackingVocal, removeBackingVocal } from '@/lib/privilege-storage'
import { SongAutocomplete, ALL_MUSIC_KEYS } from '@/components/privileges/song-autocomplete'
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
  const supabase = useSupabase()
  const { toast } = useToast()

  const [selectedPrivilege, setSelectedPrivilege] = useState<PrivilegeKey>(defaultPrivilegeKey)
  const [useNextWeek, setUseNextWeek] = useState(false)
  const [loading, setLoading] = useState(false)

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
    if (foundLocal) return { songs: foundLocal.songs || [], notes: foundLocal.notes || '', backing }
    if (remote) return { songs: remote.songs || [], notes: remote.notes || '', backing }
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

  const handleAddSong = (newSong: PrivilegeSongItem) => {
    // The new row in the list is the feedback; a toast would cover the next pick
    updateDraft({ songs: [...songs, newSong] })
  }

  const handleRemoveSong = (index: number) => {
    updateDraft({ songs: songs.filter((_, i) => i !== index) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    const newPrivilegeRecord = {
      id: `priv_${Date.now()}`,
      profile_id: user.id,
      profile_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Miembro',
      privilege_key: selectedPrivilege,
      assigned_date: isoShortDate,
      songs: songs,
      notes: notes.trim() || undefined,
      created_at: new Date().toISOString(),
    }

    // Save locally for instant persistence
    saveLocalPrivilege(newPrivilegeRecord)

    let backingErrors: string[] = []
    try {
      const { data: saved } = await supabase
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
      if (saved?.id && takesBackingVocals) backingErrors = await syncBackingVocals(saved.id)
      else if (!saved?.id && takesBackingVocals && backing.length !== existing.data.backing.length) {
        backingErrors = ['Las coristas se guardan cuando hay conexión.']
      }
    } catch {
      // Quiet failover
    }

    // Notify all users about the new privilege (safe to ignore failures)
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new_privilege',
          authorId: user.id,
          privilegeKey: selectedPrivilege,
          assignedDate: isoShortDate,
          songs,
        }),
      })
    } catch {
      // Email notification is best-effort
    }

    toast({
      title: 'Privilegio registrado',
      description: `Tu privilegio de "${currentDefinition.title}" para el ${formattedSpanishDate} fue registrado con éxito.`,
      variant: 'success',
    })
    if (backingErrors.length > 0) {
      toast({ title: 'Algunas coristas no se guardaron', description: backingErrors.join(' · '), variant: 'warning' })
    }
    setDraft(null)
    onSuccess()
    onClose()
    setLoading(false)
  }

  const handleChangeSongKey = (index: number, newKey: string) => {
    updateDraft({ songs: songs.map((s, i) => (i === index ? { ...s, key: newKey } : s)) })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Registrar Mi Privilegio"
      description="Agrega tus alabanzas y confirma tu participación"
      dismissible={!loading}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button form="privilege-modal-form" type="submit" loading={loading}>
            <CheckCircle2 className="w-4 h-4" />
            Guardar Privilegio
          </Button>
        </>
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
                  onClick={() => setSelectedPrivilege(def.key)}
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

          <SongAutocomplete onAddSong={handleAddSong} disabled={loading} />

          {songs.length === 0 ? (
            <p className="p-4 rounded-[var(--radius-md)] border border-dashed border-[var(--border-normal)] text-center text-sm text-[var(--text-tertiary)]">
              No has seleccionado canciones aún. Busca en el catálogo de arriba o propone una alabanza nueva.
            </p>
          ) : (
            <ol className="space-y-2">
              {songs.map((song, idx) => (
                <li
                  key={idx}
                  className="p-2.5 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3"
                >
                  <span className="flex items-center gap-2 min-w-0 flex-1 basis-full sm:basis-auto">
                    <span className="font-mono text-[var(--text-tertiary)] text-caption w-5 shrink-0">{idx + 1}.</span>
                    <Music className="w-4 h-4 text-[var(--text-secondary)] shrink-0" aria-hidden="true" />
                    <span className="text-sm font-medium text-[var(--text-primary)] truncate">{song.title}</span>
                  </span>

                  <label className="flex items-center gap-2 flex-1 sm:flex-none pl-7 sm:pl-0">
                    <span className="text-caption font-mono text-[var(--text-tertiary)] uppercase">Tono</span>
                    <select
                      value={song.key || 'C'}
                      onChange={(e) => handleChangeSongKey(idx, e.target.value)}
                      className="flex-1 sm:flex-none h-11 sm:h-8 bg-[var(--bg-active)] border border-[var(--border-normal)] text-[var(--text-primary)] rounded-[var(--radius)] text-base sm:text-xs px-2 font-mono focus:outline-none focus:border-[var(--text-primary)]"
                    >
                      {ALL_MUSIC_KEYS.map((k) => (
                        <option key={k.code} value={k.code} className="bg-[var(--bg-raised)] text-[var(--text-primary)]">
                          {k.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleRemoveSong(idx)}
                    className="touch-target sm:min-h-8 sm:min-w-8 flex items-center justify-center rounded-[var(--radius)] text-[var(--text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--bg-hover)] transition-colors shrink-0"
                    aria-label={`Quitar ${song.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ol>
          )}
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
