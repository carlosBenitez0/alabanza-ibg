'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAsyncData } from '@/hooks/use-async-data'
import { useSupabase } from '@/hooks/use-supabase'
import { CatalogSong, PrivilegeSongItem } from '@/types/privileges'
import { getLocalSongs, mergeSongs } from '@/lib/song-storage'
import { ALL_MUSIC_KEYS } from '@/lib/music-keys'
import { normalizeSongTitle } from '@/lib/song-links'
import { Search, Plus, Music, Loader2, Music2, Check } from 'lucide-react'
import { Input, Badge } from '@/components/ui'

interface SongAutocompleteProps {
  onAddSong: (song: PrivilegeSongItem) => void
  disabled?: boolean
  /** Songs already in the list: shown as "Añadida" and can't be picked again */
  selectedSongs?: PrivilegeSongItem[]
}

export { ALL_MUSIC_KEYS }

export function SongAutocomplete({ onAddSong, disabled, selectedSongs = [] }: SongAutocompleteProps) {
  // Songs already in the list can't be added twice (matched by id, or by title for songs without one)
  const selectedIds = new Set(selectedSongs.map((s) => s.song_id).filter(Boolean))
  const selectedTitles = new Set(selectedSongs.map((s) => normalizeSongTitle(s.title)))
  const isSelected = (song: { id?: string; title: string }) =>
    (song.id ? selectedIds.has(song.id) : false) || selectedTitles.has(normalizeSongTitle(song.title))

  const supabase = useSupabase()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [selectedKey, setSelectedKey] = useState('C')
  const [isExpanded, setIsExpanded] = useState(true)

  // Debounce catalog lookups so typing on a phone does not fire a request per key
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => clearTimeout(handle)
  }, [query])

  const fetchCatalogSongs = useCallback(async (): Promise<CatalogSong[]> => {
    const term = debouncedQuery.toLowerCase()
    const localAll = getLocalSongs()
    const localMatches = term ? localAll.filter((s) => s.title.toLowerCase().includes(term)) : localAll
    try {
      let queryBuilder = supabase.from('songs').select('*').limit(15)
      if (debouncedQuery) queryBuilder = queryBuilder.ilike('title', `%${debouncedQuery}%`)
      const { data, error } = await queryBuilder
      if (error || !data) return localMatches
      return mergeSongs(data, localMatches)
    } catch {
      return localMatches
    }
  }, [supabase, debouncedQuery])

  const { data: suggestions, loading: searching } = useAsyncData<CatalogSong[]>(fetchCatalogSongs, [])
  const loading = creating || searching || query.trim() !== debouncedQuery

  const handleSelectExisting = (song: CatalogSong) => {
    if (isSelected(song)) return
    onAddSong({
      song_id: song.id,
      title: song.title,
      key: song.default_key || selectedKey,
    })
    setQuery('')
  }

  const handleCreateNewSong = async () => {
    if (!query.trim() || isSelected({ title: query.trim() })) return

    const newTitle = query.trim()
    setCreating(true)

    try {
      const { data } = await supabase
        .from('songs')
        .insert({ title: newTitle, default_key: selectedKey })
        .select()
        .single()

      onAddSong({
        song_id: data?.id,
        title: newTitle,
        key: selectedKey,
      })
    } catch {
      onAddSong({
        title: newTitle,
        key: selectedKey,
      })
    } finally {
      setCreating(false)
      setQuery('')
    }
  }

  const hasExactMatch =
    suggestions.some((s) => normalizeSongTitle(s.title) === normalizeSongTitle(query)) ||
    isSelected({ title: query.trim() })

  const getKeyLabel = (code: string) => {
    const found = ALL_MUSIC_KEYS.find(k => k.code === code)
    return found ? found.label : code
  }

  return (
    <div className="w-full space-y-3">
      {/* Search input + key for new songs */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Input
            type="search"
            enterKeyHint="search"
            aria-label="Buscar alabanza en el catálogo"
            placeholder="Buscar o escribir nombre de la alabanza..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsExpanded(true)
            }}
            onFocus={() => setIsExpanded(true)}
            leadingIcon={<Search className="w-4 h-4 text-[var(--text-tertiary)]" />}
            disabled={disabled}
            trailingIcon={
              loading ? <Loader2 className="w-4 h-4 animate-spin text-[var(--text-tertiary)]" /> : undefined
            }
          />
        </div>

        <label className="flex items-center gap-2 shrink-0">
          <span className="text-caption font-mono text-[var(--text-tertiary)] uppercase whitespace-nowrap">Tono nuevo</span>
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            disabled={disabled}
            className="flex-1 sm:flex-none h-11 sm:h-10 bg-[var(--bg-surface)] border border-[var(--border-normal)] text-[var(--text-primary)] rounded-[var(--radius-md)] text-base sm:text-xs px-2 font-mono focus:outline-none focus:border-[var(--text-primary)]"
          >
            <optgroup label="Tonos Mayores">
              {ALL_MUSIC_KEYS.slice(0, 12).map((k) => (
                <option key={k.code} value={k.code} className="bg-[var(--bg-raised)] text-[var(--text-primary)]">
                  {k.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Tonos Menores">
              {ALL_MUSIC_KEYS.slice(12).map((k) => (
                <option key={k.code} value={k.code} className="bg-[var(--bg-raised)] text-[var(--text-primary)]">
                  {k.label}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
      </div>

      {/* Catalog results */}
      {isExpanded && (
        <div className="rounded-[var(--radius-md)] border border-[var(--border-normal)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="px-3 py-2 bg-[var(--bg-raised)] border-b border-[var(--border-subtle)] flex items-center justify-between gap-2">
            <span className="text-caption font-mono uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1.5">
              <Music2 className="w-3.5 h-3.5" aria-hidden="true" />
              Catálogo ({suggestions.length})
            </span>
            <span className="text-caption text-[var(--text-tertiary)]">Toca para añadir</span>
          </div>

          <ul className="max-h-[40dvh] sm:max-h-56 overflow-y-auto overscroll-contain divide-y divide-[var(--border-subtle)]">
            {query.trim().length > 0 && !hasExactMatch && (
              <li>
                <button
                  type="button"
                  onClick={handleCreateNewSong}
                  disabled={disabled || creating}
                  className="w-full min-h-12 text-left px-3 py-2.5 hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors flex items-center justify-between gap-2 text-sm font-medium bg-[var(--bg-active)]/40 disabled:opacity-50"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-[var(--text-primary)] text-[var(--text-inverse)] flex items-center justify-center shrink-0">
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 break-words">
                      Crear <strong className="text-[var(--color-gs-12)] font-semibold">&ldquo;{query.trim()}&rdquo;</strong>
                    </span>
                  </span>
                  <Badge variant="brand" size="sm">{selectedKey}</Badge>
                </button>
              </li>
            )}

            {suggestions.length === 0 && !query.trim() ? (
              <li className="p-4 text-center text-sm text-[var(--text-tertiary)]">
                No hay alabanzas registradas aún en el catálogo. Escribe el nombre para proponer la primera.
              </li>
            ) : (
              suggestions.map((song) => {
                const added = isSelected(song)
                return (
                  <li key={song.id || song.title}>
                    <button
                      type="button"
                      onClick={() => handleSelectExisting(song)}
                      disabled={disabled || added}
                      className="w-full min-h-12 px-3 py-2 text-left enabled:hover:bg-[var(--bg-hover)] enabled:active:bg-[var(--bg-hover)] transition-colors flex items-center justify-between gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={added ? `${song.title} (ya está en tu lista)` : `Añadir ${song.title}`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Music className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />
                        <span className="font-medium text-[var(--text-primary)] truncate">{song.title}</span>
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        {added ? (
                          <span className="flex items-center gap-1 text-caption font-medium text-[var(--color-success)]">
                            <Check className="w-4 h-4" aria-hidden="true" />
                            Añadida
                          </span>
                        ) : (
                          <>
                            <span className="text-caption font-mono px-2 py-0.5 rounded bg-[var(--bg-active)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                              {getKeyLabel(song.default_key || selectedKey)}
                            </span>
                            <span className="w-8 h-8 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-secondary)]">
                              <Plus className="w-4 h-4" aria-hidden="true" />
                            </span>
                          </>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
