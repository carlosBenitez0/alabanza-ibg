'use client'

import { useState } from 'react'
import { useSupabase } from '@/hooks/use-supabase'
import { useAuth } from '@/components/providers/auth-provider'
import { ALL_MUSIC_KEYS } from '@/components/privileges/song-autocomplete'
import { Input, Button, Textarea, Modal } from '@/components/ui'
import { Music, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/components/providers/toast-provider'
import { saveLocalSong } from '@/lib/song-storage'

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Proponer / Agregar Alabanza"
      description="Añade una alabanza al catálogo general del ministerio"
      dismissible={!loading}
      icon={
        <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--text-primary)] text-[var(--text-inverse)] flex items-center justify-center">
          <Music className="w-4 h-4" aria-hidden="true" />
        </div>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="add-song-form" loading={loading}>
            <CheckCircle2 className="w-4 h-4" />
            Guardar en Catálogo
          </Button>
        </>
      }
    >
      <form id="add-song-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="song-title"
          label="Título de la alabanza"
          placeholder="Ej. La Bondad de Dios, Tu Fidelidad..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={loading}
          autoComplete="off"
          enterKeyHint="next"
          data-autofocus
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="song-key" className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Tono por defecto
            </label>
            <select
              id="song-key"
              value={defaultKey}
              onChange={(e) => setDefaultKey(e.target.value)}
              disabled={loading}
              className="w-full h-11 sm:h-10 bg-[var(--bg-raised)] border border-[var(--border-normal)] text-[var(--text-primary)] rounded-[var(--radius-md)] text-base sm:text-sm px-3 font-mono focus:outline-none focus:border-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)]"
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
            id="song-bpm"
            label="BPM / Tempo (opcional)"
            placeholder="Ej. 72, 128..."
            type="number"
            inputMode="numeric"
            min={20}
            max={300}
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            disabled={loading}
          />
        </div>

        <Textarea
          id="song-notes"
          label="Notas / Enlace de YouTube / Referencia (opcional)"
          placeholder="Ej. Versión en vivo de Bethel, o intro con piano..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={loading}
          className="min-h-[80px]"
        />
      </form>
    </Modal>
  )
}
