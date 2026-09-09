'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { PRIVILEGE_DEFINITIONS, PrivilegeKey, PrivilegeSongItem } from '@/types/privileges'
import { getAutoDateForPrivilege, getUpcomingServiceDate, formatFullSpanishDate, formatISOShortDate, getNextWeekDate } from '@/lib/date-helpers'
import { saveLocalPrivilege, getLocalPrivileges } from '@/lib/privilege-storage'
import { SongAutocomplete, ALL_MUSIC_KEYS } from '@/components/privileges/song-autocomplete'
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Textarea } from '@/components/ui'
import { Guitar, Mic, Users, Music, Calendar, Trash2, CheckCircle2, X, Clock } from 'lucide-react'
import { useToast } from '@/components/providers/toast-provider'
import { cn } from '@/lib/utils'

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
  const [songs, setSongs] = useState<PrivilegeSongItem[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

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

  // Sync default privilege key when modal opens or prop changes
  useEffect(() => {
    if (isOpen) {
      setSelectedPrivilege(defaultPrivilegeKey)
    }
  }, [isOpen, defaultPrivilegeKey])

  // Load existing privilege if it exists
  useEffect(() => {
    if (isOpen && user && selectedPrivilege && isoShortDate) {
      const loadExisting = async () => {
        // First try local storage
        const local = getLocalPrivileges()
        const foundLocal = local.find(
          p => p.profile_id === user.id && p.privilege_key === selectedPrivilege && p.assigned_date === isoShortDate
        )
        if (foundLocal) {
          setSongs(foundLocal.songs || [])
          setNotes(foundLocal.notes || '')
          return
        }

        // Then try remote database
        try {
          const { data, error } = await supabase
            .from('weekly_privileges')
            .select('songs, notes')
            .eq('profile_id', user.id)
            .eq('privilege_key', selectedPrivilege)
            .eq('assigned_date', isoShortDate)
            .maybeSingle()
          
          if (data && !error) {
            setSongs(data.songs || [])
            setNotes(data.notes || '')
          } else {
            setSongs([])
            setNotes('')
          }
        } catch {
          setSongs([])
          setNotes('')
        }
      }
      loadExisting()
    } else if (!isOpen) {
      setSongs([])
      setNotes('')
    }
  }, [isOpen, user, selectedPrivilege, isoShortDate, supabase])

  if (!isOpen) return null

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
    setSongs(prev => [...prev, newSong])
    toast({
      title: 'Alabanza agregada',
      description: `"${newSong.title}" [Tono: ${newSong.key}] añadida a la lista`,
      variant: 'success',
    })
  }

  const handleRemoveSong = (index: number) => {
    setSongs(prev => prev.filter((_, i) => i !== index))
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

    try {
      await supabase.from('weekly_privileges').upsert(
        {
          profile_id: user.id,
          privilege_key: selectedPrivilege,
          assigned_date: isoShortDate,
          songs: songs,
          notes: notes.trim() || null,
        },
        { onConflict: 'profile_id,privilege_key,assigned_date' }
      )
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
    onSuccess()
    onClose()
    setLoading(false)
  }

  const handleChangeSongKey = (index: number, newKey: string) => {
    setSongs(prev => prev.map((s, i) => i === index ? { ...s, key: newKey } : s))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] bg-[var(--bg-raised)] border border-[var(--border-normal)] rounded-[var(--radius-xl)] shadow-2xl flex flex-col overflow-hidden animate-scale-in text-[var(--text-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-page)]">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
              Registrar Mi Privilegio
            </h2>
            <p className="text-xs text-[var(--text-tertiary)]">
              Agrega tu alabanza y confirma tu participación
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-colors"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form id="privilege-modal-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Privilege Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
                Privilegio Seleccionado:
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PRIVILEGE_DEFINITIONS.filter((def) => !allowedDay || def.day === allowedDay).map((def) => {
                  const isSelected = selectedPrivilege === def.key
                  return (
                    <button
                      key={def.key}
                      type="button"
                      onClick={() => setSelectedPrivilege(def.key)}
                      className={cn(
                        'p-3 rounded-[var(--radius-md)] border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between gap-2',
                        isSelected
                          ? 'bg-[var(--bg-raised)] border-[var(--text-primary)] ring-1 ring-[var(--text-primary)]'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] opacity-60 hover:opacity-100 hover:border-[var(--border-strong)]'
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className={cn(
                          'w-6 h-6 rounded-md flex items-center justify-center text-xs',
                          isSelected ? 'bg-[var(--text-primary)] text-[var(--text-inverse)]' : 'bg-[var(--bg-active)] text-[var(--text-secondary)]'
                        )}>
                          {getIconComponent(def.iconName)}
                        </div>
                        <Badge variant={def.day === 'saturday' ? 'brand' : 'secondary'} size="sm">
                          {def.dayLabel}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-[var(--text-primary)] leading-tight">{def.title}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Auto Date Banner */}
            <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-[var(--text-primary)]" />
                <div>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider block">Fecha asignada:</span>
                  <span className="font-semibold text-[var(--color-gs-12)]">{formattedSpanishDate}</span>
                </div>
              </div>

              {!targetDate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUseNextWeek(!useNextWeek)}
                  className="text-[10px] h-7 px-2"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {useNextWeek ? 'Esta semana' : 'Próxima semana'}
                </Button>
              )}
            </div>

            {/* Song Autocomplete */}
            <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Mi Listado de Alabanzas ({songs.length}):
                </label>
              </div>

              <SongAutocomplete onAddSong={handleAddSong} disabled={loading} />

              {/* Selected Songs List */}
              <div className="space-y-1.5 mt-2">
                {songs.length === 0 ? (
                  <div className="p-4 rounded-[var(--radius-md)] border border-dashed border-[var(--border-normal)] text-center text-xs text-[var(--text-tertiary)]">
                    No has seleccionado canciones aún. Usa el panel de arriba para seleccionar del catálogo o proponer una alabanza.
                  </div>
                ) : (
                  songs.map((song, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="font-mono text-[var(--text-tertiary)] w-4 text-[10px]">{idx + 1}.</span>
                        <Music className="w-3.5 h-3.5 text-[var(--text-secondary)] flex-shrink-0" />
                        <span className="font-medium text-[var(--text-primary)] truncate">{song.title}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Per-singer Editable Key Dropdown */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono text-[var(--text-tertiary)] hidden sm:inline">Tono:</span>
                          <select
                            value={song.key || 'C'}
                            onChange={(e) => handleChangeSongKey(idx, e.target.value)}
                            className="bg-[var(--bg-active)] border border-[var(--border-normal)] text-[var(--text-primary)] rounded text-[10px] py-1 px-2 font-mono focus:outline-none focus:border-[var(--text-primary)]"
                          >
                            {ALL_MUSIC_KEYS.map((k) => (
                              <option key={k.code} value={k.code} className="bg-[var(--bg-raised)] text-[var(--text-primary)]">
                                {k.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSong(idx)}
                          className="text-[var(--text-tertiary)] hover:text-[var(--color-error)] transition-colors p-1"
                          aria-label="Eliminar canción"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Optional Notes */}
            <Textarea
              label="Notas (opcional)"
              placeholder="Ej. Ensayar intro, llevar guitarra acústica..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              className="min-h-[70px] text-xs"
            />
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-page)]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            size="sm"
          >
            Cancelar
          </Button>
          <Button
            form="privilege-modal-form"
            type="submit"
            size="sm"
            loading={loading}
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Guardar Privilegio
          </Button>
        </div>
      </div>
    </div>
  )
}
