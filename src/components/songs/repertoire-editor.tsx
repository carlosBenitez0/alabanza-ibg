'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import { SongAutocomplete } from '@/components/privileges/song-autocomplete'
import { sameModeKeys } from '@/lib/chords'
import { DURATION, EASE, prefersReducedMotion } from '@/lib/motion'
import type { PrivilegeSongItem } from '@/types/privileges'
import { ArrowDown, ArrowUp, Music, Trash2 } from 'lucide-react'

gsap.registerPlugin(Flip)

const iconButton =
  'touch-target sm:min-h-8 sm:min-w-8 flex items-center justify-center rounded-[var(--radius)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:pointer-events-none transition-colors shrink-0'

let uidCounter = 0
const newUid = () => `song-row-${++uidCounter}`

/**
 * Ordered song list with a key per song: search/add from the catalog,
 * change the key, reorder and remove. Used by privileges and event repertoires.
 *
 * Rows keep a stable id while editing (never the index), so a row keeps its
 * identity when others move or disappear.
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
  // Row ids follow the list; when it is replaced from outside (reset, discard), start over
  const [ids, setIds] = useState<string[]>(() => songs.map(newUid))
  const [shownSongs, setShownSongs] = useState(songs)
  if (songs !== shownSongs) {
    setShownSongs(songs)
    if (songs.length !== ids.length) setIds(songs.map(newUid))
  }

  // Rows glide to their new place (FLIP): record where they are, change the list,
  // then animate from the old positions once React has rendered the new order
  const listRef = useRef<HTMLOListElement>(null)
  const flipState = useRef<Flip.FlipState | null>(null)
  const animate = !prefersReducedMotion()

  const commit = (nextSongs: PrivilegeSongItem[], nextIds: string[]) => {
    if (animate && listRef.current) flipState.current = Flip.getState(listRef.current.children)
    setIds(nextIds)
    onChange(nextSongs)
  }

  useLayoutEffect(() => {
    const state = flipState.current
    if (!state || !listRef.current) return
    flipState.current = null
    Flip.from(state, {
      targets: listRef.current.children,
      duration: DURATION.slow,
      ease: EASE.inOut,
      // A newly added row arrives from just above its slot
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: DURATION.base, ease: EASE.out }),
    })
  }, [ids])

  const move = (from: number, to: number) => {
    const nextSongs = [...songs]
    const nextIds = [...ids]
    const [song] = nextSongs.splice(from, 1)
    const [id] = nextIds.splice(from, 1)
    nextSongs.splice(to, 0, song)
    nextIds.splice(to, 0, id)
    commit(nextSongs, nextIds)
  }

  const remove = (idx: number) => {
    const apply = () =>
      commit(
        songs.filter((_, i) => i !== idx),
        ids.filter((_, i) => i !== idx)
      )
    const row = listRef.current?.querySelector<HTMLElement>(`[data-flip-id="${ids[idx]}"]`)
    if (!animate || !row) return apply()
    // The removed row slides out first; then the rest close the gap
    gsap.to(row, { opacity: 0, x: -16, duration: DURATION.fast, ease: EASE.in, onComplete: apply })
  }

  const add = (song: PrivilegeSongItem) => commit([...songs, song], [...ids, newUid()])

  const setKey = (idx: number, key: string) =>
    onChange(songs.map((s, i) => (i === idx ? { ...s, key: key || undefined } : s)))

  return (
    <div className="space-y-3">
      <SongAutocomplete onAddSong={add} disabled={disabled} selectedSongs={songs} />

      {songs.length === 0 ? (
        <p className="p-4 rounded-[var(--radius-md)] border border-dashed border-[var(--border-normal)] text-center text-sm text-[var(--text-tertiary)]">
          {emptyText}
        </p>
      ) : (
        <ol ref={listRef} className="space-y-2">
          {songs.map((song, idx) => (
            <li
              key={ids[idx] ?? idx}
              data-flip-id={ids[idx]}
              className="p-2.5 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3"
            >
              <span className="flex items-center gap-2 min-w-0 flex-1 basis-full sm:basis-auto">
                <span className="font-mono text-[var(--text-tertiary)] text-caption w-5 shrink-0 tabular-nums">{idx + 1}.</span>
                <Music className="w-4 h-4 text-[var(--text-secondary)] shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium text-[var(--text-primary)] truncate">{song.title}</span>
              </span>

              <label className="flex items-center gap-2 flex-1 sm:flex-none pl-7 sm:pl-0 min-w-0">
                <span className="text-caption font-mono text-[var(--text-tertiary)] uppercase">Tono</span>
                <select
                  value={song.key ?? ''}
                  disabled={disabled}
                  onChange={(e) => setKey(idx, e.target.value)}
                  className="flex-1 sm:flex-none min-w-0 h-11 sm:h-8 bg-[var(--bg-active)] border border-[var(--border-normal)] text-[var(--text-primary)] rounded-[var(--radius)] text-base sm:text-xs px-2 font-mono focus:outline-none focus:border-[var(--text-primary)]"
                >
                  <option value="" className="bg-[var(--bg-raised)] text-[var(--text-primary)]">
                    Sin tono
                  </option>
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
                  onClick={() => remove(idx)}
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
