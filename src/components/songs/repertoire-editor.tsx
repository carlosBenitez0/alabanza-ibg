'use client'

import { SongAutocomplete } from '@/components/privileges/song-autocomplete'
import { sameModeKeys } from '@/lib/chords'
import type { PrivilegeSongItem } from '@/types/privileges'
import { ArrowDown, ArrowUp, Music, Trash2 } from 'lucide-react'

const iconButton =
  'touch-target sm:min-h-8 sm:min-w-8 flex items-center justify-center rounded-[var(--radius)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:pointer-events-none transition-colors shrink-0'

/**
 * Ordered song list with a key per song: search/add from the catalog,
 * change the key, reorder and remove. Used for event repertoires.
 */
export function RepertoireEditor({
  songs,
  onChange,
  disabled,
  emptyText = 'Aún no hay alabanzas. Búscalas en el catálogo de arriba.',
}: {
  songs: PrivilegeSongItem[]
  onChange: (songs: PrivilegeSongItem[]) => void
  disabled?: boolean
  emptyText?: string
}) {
  const move = (from: number, to: number) => {
    const next = [...songs]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <SongAutocomplete onAddSong={(song) => onChange([...songs, song])} disabled={disabled} selectedSongs={songs} />

      {songs.length === 0 ? (
        <p className="p-4 rounded-[var(--radius-md)] border border-dashed border-[var(--border-normal)] text-center text-sm text-[var(--text-tertiary)]">
          {emptyText}
        </p>
      ) : (
        <ol className="space-y-2">
          {songs.map((song, idx) => (
            <li
              key={`${song.song_id ?? song.title}-${idx}`}
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
                  disabled={disabled}
                  onChange={(e) => onChange(songs.map((s, i) => (i === idx ? { ...s, key: e.target.value } : s)))}
                  className="flex-1 sm:flex-none h-11 sm:h-8 bg-[var(--bg-active)] border border-[var(--border-normal)] text-[var(--text-primary)] rounded-[var(--radius)] text-base sm:text-xs px-2 font-mono focus:outline-none focus:border-[var(--text-primary)]"
                >
                  {sameModeKeys(song.key).map((k) => (
                    <option key={k.code} value={k.code} className="bg-[var(--bg-raised)] text-[var(--text-primary)]">
                      {k.label}
                    </option>
                  ))}
                </select>
              </label>

              <span className="flex items-center">
                <button
                  type="button"
                  className={iconButton}
                  onClick={() => move(idx, idx - 1)}
                  disabled={disabled || idx === 0}
                  aria-label={`Subir ${song.title}`}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className={iconButton}
                  onClick={() => move(idx, idx + 1)}
                  disabled={disabled || idx === songs.length - 1}
                  aria-label={`Bajar ${song.title}`}
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className={`${iconButton} hover:text-[var(--color-error)]`}
                  onClick={() => onChange(songs.filter((_, i) => i !== idx))}
                  disabled={disabled}
                  aria-label={`Quitar ${song.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
