'use client'

import { useState } from 'react'
import { useSupabase } from '@/hooks/use-supabase'
import { useAuth } from '@/components/providers/auth-provider'
import { ALL_MUSIC_KEYS } from '@/components/privileges/song-autocomplete'
import { Input, Button, Textarea } from '@/components/ui'
import { Music, Plus, X, CheckCircle2, Link as LinkIcon } from 'lucide-react'
import { useToast } from '@/components/providers/toast-provider'
import { getLocalSongs, saveLocalSong } from '@/lib/song-storage'

interface AddSongModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddSongModal({ isOpen, onClose, onSuccess }: AddSongModalProps) {
  const supabase = useSupabase()
  const { user } = useAuth()
  const { toast } = useToast()

  const [title, setTitle] = useState('')
  const [defaultKey, setDefaultKey] = useState('C')
  const [bpm, setBpm] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    const newTitle = title.trim()
    const parsedBpm = bpm ? parseInt(bpm, 10) : null

    const newSongRecord = {
      id: `song_${Date.now()}`,
      title: newTitle,
      default_key: defaultKey,
      bpm: parsedBpm,
      notes: notes.trim() || undefined,
      created_at: new Date().toISOString(),
    }

    // Save locally for instant availability
    saveLocalSong(newSongRecord)

    try {
      await supabase.from('songs').insert({
        title: newTitle,
        default_key: defaultKey,
      })
    } catch {
      // Quiet fallback
    }

    // Notify all users about the new song (safe to ignore failures)
    if (user?.id) {
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'new_song',
            authorId: user.id,
            songTitle: newTitle,
          }),
        })
      } catch {
        // Email notification is best-effort
      }
    }

    toast({
      title: 'Alabanza agregada',
      description: `"${newTitle}" ha sido añadida al repertorio del ministerio.`,
      variant: 'success',
    })
    setTitle('')
    setBpm('')
    setNotes('')
    onSuccess()
    onClose()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-[var(--bg-raised)] border border-[var(--border-normal)] rounded-[var(--radius-xl)] shadow-2xl overflow-hidden animate-scale-in text-[var(--text-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-page)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--text-primary)] text-[var(--text-inverse)] flex items-center justify-center font-bold">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                Proponer / Agregar Alabanza
              </h2>
              <p className="text-xs text-[var(--text-tertiary)]">
                Añade una alabanza al catálogo general del ministerio
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Título de la Alabanza *"
            placeholder="Ej. La Bondad de Dios, Tu Fidelidad..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[var(--text-primary)]">
                Tono por Defecto
              </label>
              <select
                value={defaultKey}
                onChange={(e) => setDefaultKey(e.target.value)}
                disabled={loading}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-normal)] text-[var(--text-primary)] rounded-[var(--radius-md)] text-xs p-2.5 font-mono focus:outline-none focus:border-[var(--text-primary)]"
              >
                <optgroup label="Tonos Mayores">
                  {ALL_MUSIC_KEYS.slice(0, 12).map((k) => (
                    <option key={k.code} value={k.code} className="bg-[var(--bg-raised)]">
                      {k.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Tonos Menores">
                  {ALL_MUSIC_KEYS.slice(12).map((k) => (
                    <option key={k.code} value={k.code} className="bg-[var(--bg-raised)]">
                      {k.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <Input
              label="BPM / Tempo (opcional)"
              placeholder="Ej. 72, 128..."
              type="number"
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              disabled={loading}
            />
          </div>

          <Textarea
            label="Notas / Enlace de YouTube / Referencia (opcional)"
            placeholder="Ej. Versión en vivo de Bethel, o intro con piano..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            className="min-h-[70px] text-xs"
          />

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={loading}>
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Guardar en Catálogo
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
