'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/hooks/use-supabase'
import { CatalogSong, PrivilegeSongItem } from '@/types/privileges'
import { getLocalSongs, mergeSongs } from '@/lib/song-storage'
import { Search, Plus, Music, Loader2, Music2 } from 'lucide-react'
import { Input, Button, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

interface SongAutocompleteProps {
  onAddSong: (song: PrivilegeSongItem) => void
  disabled?: boolean
}

export const ALL_MUSIC_KEYS = [
  // Tonos Mayores
  { code: 'C', label: 'C (Do)' },
  { code: 'C#', label: 'C# / Db (Do#)' },
  { code: 'D', label: 'D (Re)' },
  { code: 'Eb', label: 'D# / Eb (Re#)' },
  { code: 'E', label: 'E (Mi)' },
  { code: 'F', label: 'F (Fa)' },
  { code: 'F#', label: 'F# / Gb (Fa#)' },
  { code: 'G', label: 'G (Sol)' },
  { code: 'Ab', label: 'G# / Ab (Sol#)' },
  { code: 'A', label: 'A (La)' },
  { code: 'Bb', label: 'A# / Bb (La#)' },
  { code: 'B', label: 'B (Si)' },
  // Tonos Menores
  { code: 'Cm', label: 'Cm (Do m)' },
  { code: 'C#m', label: 'C#m / Dbm (Do# m)' },
  { code: 'Dm', label: 'Dm (Re m)' },
  { code: 'Ebm', label: 'D#m / Ebm (Re# m)' },
  { code: 'Em', label: 'Em (Mi m)' },
  { code: 'Fm', label: 'Fm (Fa m)' },
  { code: 'F#m', label: 'F#m / Gbm (Fa# m)' },
  { code: 'Gm', label: 'Gm (Sol m)' },
  { code: 'Abm', label: 'G#m / Abm (Sol# m)' },
  { code: 'Am', label: 'Am (La m)' },
  { code: 'Bbm', label: 'A#m / Bbm (La# m)' },
  { code: 'Bm', label: 'Bm (Si m)' },
]

export function SongAutocomplete({ onAddSong, disabled }: SongAutocompleteProps) {
  const supabase = useSupabase()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<CatalogSong[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedKey, setSelectedKey] = useState('C')
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    fetchCatalogSongs(query)
  }, [query])

  const fetchCatalogSongs = async (searchQuery: string) => {
    setLoading(true)
    const localAll = getLocalSongs()
    const localMatches = searchQuery.trim()
      ? localAll.filter(s => s.title.toLowerCase().includes(searchQuery.trim().toLowerCase()))
      : localAll

    try {
      let queryBuilder = supabase.from('songs').select('*').limit(15)
      if (searchQuery.trim()) {
        queryBuilder = queryBuilder.ilike('title', `%${searchQuery.trim()}%`)
      }

      const { data, error } = await queryBuilder

      if (error || !data) {
        setSuggestions(localMatches)
        return
      }

      const merged = mergeSongs(data, localMatches)
      setSuggestions(merged)
    } catch {
      setSuggestions(localMatches)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectExisting = (song: CatalogSong) => {
    onAddSong({
      song_id: song.id,
      title: song.title,
      key: song.default_key || selectedKey,
    })
    setQuery('')
  }

  const handleCreateNewSong = async () => {
    if (!query.trim()) return

    const newTitle = query.trim()
    setLoading(true)

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
      setLoading(false)
      setQuery('')
    }
  }

  const hasExactMatch = suggestions.some(
    s => s.title.toLowerCase() === query.trim().toLowerCase()
  )

  const getKeyLabel = (code: string) => {
    const found = ALL_MUSIC_KEYS.find(k => k.code === code)
    return found ? found.label : code
  }

  return (
    <div className="w-full space-y-3">
      {/* Search Input + Key Selector */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar o escribir nombre de la alabanza..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsExpanded(true)
            }}
            onFocus={() => setIsExpanded(true)}
            leadingIcon={<Search className="w-4 h-4 text-[var(--text-tertiary)]" />}
            disabled={disabled}
            trailingAction={
              loading ? <Loader2 className="w-4 h-4 animate-spin text-[var(--text-tertiary)]" /> : null
            }
          />
        </div>

        {/* Tone/Key Selector for New Songs */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase whitespace-nowrap">Tono:</span>
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            disabled={disabled}
            className="bg-[var(--bg-surface)] border border-[var(--border-normal)] text-[var(--text-primary)] rounded-[var(--radius-md)] text-xs py-2 px-2 font-mono focus:outline-none focus:border-[var(--text-primary)]"
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
        </div>
      </div>

      {/* Catalog Selector Panel (Integrated Inline for perfect visibility) */}
      {isExpanded && (
        <div className="rounded-[var(--radius-md)] border border-[var(--border-normal)] bg-[var(--bg-surface)] overflow-hidden space-y-0">
          <div className="px-3 py-2 bg-[var(--bg-raised)] border-b border-[var(--border-subtle)] flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1.5">
              <Music2 className="w-3.5 h-3.5" />
              Alabanzas en el Catálogo ({suggestions.length})
            </span>
            <span className="text-[10px] font-sans text-[var(--text-tertiary)]">Haz clic para añadir</span>
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-[var(--border-subtle)]">
            {/* Create New Option if query typed and no exact match */}
            {query.trim().length > 0 && !hasExactMatch && (
              <button
                type="button"
                onClick={handleCreateNewSong}
                className="w-full text-left p-2.5 hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-between text-xs text-[var(--text-primary)] font-medium group bg-[var(--bg-active)]/40"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[var(--text-primary)] text-[var(--text-inverse)] flex items-center justify-center font-bold">
                    <Plus className="w-3 h-3" />
                  </div>
                  <span>
                    Agregar y crear <strong className="text-[var(--color-gs-12)] font-semibold">"{query.trim()}"</strong> al catálogo
                  </span>
                </div>
                <Badge variant="brand" size="sm">Tono: {selectedKey}</Badge>
              </button>
            )}

            {/* Catalog Song Matches */}
            {suggestions.length === 0 && !query.trim() ? (
              <div className="p-4 text-center text-xs text-[var(--text-tertiary)] font-sans">
                No hay alabanzas registradas aún en el catálogo. Escribe el nombre para proponer la primera.
              </div>
            ) : (
              suggestions.map((song) => (
                <div
                  key={song.id || song.title}
                  className="p-2.5 hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Music className="w-3.5 h-3.5 text-[var(--text-tertiary)] flex-shrink-0" />
                    <span className="font-medium text-[var(--text-primary)] truncate">{song.title}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-active)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                      {getKeyLabel(song.default_key || selectedKey)}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-[10px] h-6 px-2"
                      onClick={() => handleSelectExisting(song)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Añadir
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
