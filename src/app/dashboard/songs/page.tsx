'use client'

export const dynamic = 'force-dynamic'

import { useState, useCallback } from 'react'
import { useAsyncData } from '@/hooks/use-async-data'
import { useSupabase } from '@/hooks/use-supabase'
import { CatalogSong } from '@/types/privileges'
import { getLocalSongs, mergeSongs } from '@/lib/song-storage'
import { AddSongModal } from '@/components/songs/add-song-modal'
import { TablatureModal } from '@/components/songs/tablature-modal'
import { ALL_MUSIC_KEYS } from '@/components/privileges/song-autocomplete'
import { Button, Badge, Input, PageHeader, PageLoader, EmptyState, Fab } from '@/components/ui'
import { Music, Search, Plus, Music2, Activity, FileText, ChevronRight } from 'lucide-react'
import { useGsapMountReveal, useGsapReveal } from '@/hooks/use-gsap-reveal'
import { cn } from '@/lib/utils'

function getKeyLabel(keyCode?: string | null) {
  if (!keyCode) return 'Sin tono'
  return ALL_MUSIC_KEYS.find((k) => k.code === keyCode)?.label ?? keyCode
}

export default function SongsPage() {
  const supabase = useSupabase()
  const [searchQuery, setSearchQuery] = useState('')

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedTabSong, setSelectedTabSong] = useState<CatalogSong | null>(null)
  const [isTabModalOpen, setIsTabModalOpen] = useState(false)

  const headerRef = useGsapMountReveal<HTMLDivElement>({ from: 'bottom', duration: 0.5 })
  const gridRef = useGsapReveal<HTMLUListElement>({ selector: '.song-card-item', stagger: 0.05 })

  const loadSongs = useCallback(async (): Promise<CatalogSong[]> => {
    try {
      const { data, error } = await supabase.from('songs').select('*').order('title', { ascending: true })
      if (error || !data || data.length === 0) return getLocalSongs()
      return mergeSongs(data, getLocalSongs())
    } catch {
      return getLocalSongs()
    }
  }, [supabase])
  const { data: songs, loading, reload: fetchSongs } = useAsyncData<CatalogSong[]>(loadSongs, [])

  const handleOpenTabModal = (song: CatalogSong) => {
    setSelectedTabSong(song)
    setIsTabModalOpen(true)
  }

  const q = searchQuery.trim().toLowerCase()
  const filteredSongs = songs.filter(
    (song) => song.title.toLowerCase().includes(q) || (song.default_key && song.default_key.toLowerCase().includes(q))
  )

  return (
    <div className="space-y-4 sm:space-y-6 text-[var(--text-primary)]">
      <AddSongModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={fetchSongs} />
      <TablatureModal
        song={selectedTabSong}
        isOpen={isTabModalOpen}
        onClose={() => setIsTabModalOpen(false)}
        onSuccess={fetchSongs}
      />

      <PageHeader
        ref={headerRef}
        title="Repertorio de Alabanzas"
        description="Catálogo del ministerio. Toca cualquier alabanza para ver sus acordes o tablatura."
        actionsDesktopOnly
        actions={
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Proponer / Agregar Alabanza
          </Button>
        }
      />

      <Fab icon={<Plus />} label="Alabanza" onClick={() => setIsAddModalOpen(true)} />

      {/* Search stays reachable while scrolling a long catalog */}
      <div className="sticky top-[calc(var(--header-h)+var(--safe-top))] lg:top-16 z-[150] -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0 py-2 bg-[var(--bg-page)]/90 backdrop-blur-md">
        <div className="lg:max-w-md">
          <Input
            type="search"
            enterKeyHint="search"
            aria-label="Buscar alabanza por título o tono"
            placeholder="Buscar por título o tono…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leadingIcon={<Search className="w-4 h-4 text-[var(--text-tertiary)]" />}
          />
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : filteredSongs.length === 0 ? (
        <EmptyState
          icon={<Music />}
          title={searchQuery ? 'No se encontraron alabanzas' : 'No hay alabanzas agregadas aún'}
          description={
            searchQuery
              ? 'Prueba buscando con otro término o propone esta nueva alabanza.'
              : 'Sé el primero en agregar una alabanza al catálogo general del ministerio.'
          }
          action={
            <Button onClick={() => setIsAddModalOpen(true)} fullWidthMobile>
              <Plus className="w-4 h-4" />
              Proponer Nueva Alabanza
            </Button>
          }
        />
      ) : (
        <>
          <p className="text-xs font-mono text-[var(--text-tertiary)]" aria-live="polite">
            {filteredSongs.length} {filteredSongs.length === 1 ? 'alabanza' : 'alabanzas'}
          </p>
          {/* Phones: compact rows. sm+: card grid */}
          <ul
            ref={gridRef}
            className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-raised)] divide-y divide-[var(--border-subtle)] overflow-hidden sm:rounded-none sm:border-0 sm:bg-transparent sm:divide-y-0 sm:overflow-visible sm:grid sm:gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredSongs.map((song) => {
              const hasTab = Boolean(song.has_tablature || song.tablature_content)
              return (
                <li key={song.id || song.title} className="song-card-item">
                  <button
                    type="button"
                    onClick={() => handleOpenTabModal(song)}
                    className={cn(
                      'group w-full h-full text-left transition-colors',
                      'flex items-center gap-3 min-h-16 px-4 py-3 active:bg-[var(--bg-hover)]',
                      'sm:flex-col sm:items-stretch sm:justify-between sm:gap-0 sm:p-0 sm:rounded-[var(--radius-lg)] sm:border sm:border-[var(--border-subtle)] sm:bg-[var(--bg-raised)] sm:hover:border-[var(--text-tertiary)]',
                      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]'
                    )}
                  >
                    {/* Row layout (phones) */}
                    <span className="sm:hidden w-9 h-9 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-normal)] flex items-center justify-center shrink-0">
                      <Music2 className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <span className="sm:hidden flex-1 min-w-0">
                      <span className="block text-sm font-semibold truncate">{song.title}</span>
                      <span className="flex items-center gap-2 mt-0.5 text-xs text-[var(--text-tertiary)]">
                        <span className="font-mono">{song.default_key || '—'}</span>
                        {song.bpm && <span className="font-mono">· {song.bpm} BPM</span>}
                        <span className={cn('flex items-center gap-1', hasTab && 'text-[var(--color-success)]')}>
                          · <FileText className="w-3 h-3" aria-hidden="true" />
                          {hasTab ? 'Tablatura' : 'Sin tablatura'}
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="sm:hidden w-4 h-4 text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />

                    {/* Card layout (sm+) */}
                    <span className="hidden sm:block p-5 pb-3">
                      <span className="flex items-start justify-between gap-2">
                        <span className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-normal)] flex items-center justify-center">
                          <Music2 className="w-4 h-4" aria-hidden="true" />
                        </span>
                        <Badge variant="brand" size="sm">{getKeyLabel(song.default_key)}</Badge>
                      </span>
                      <span className="block mt-3 font-bold text-base group-hover:text-[var(--color-gs-12)] transition-colors">
                        {song.title}
                      </span>
                    </span>
                    <span className="hidden sm:block px-5 pb-5 space-y-3">
                      {song.bpm && (
                        <span className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] font-mono">
                          <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                          {song.bpm} BPM
                        </span>
                      )}
                      <span className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                        <span className={cn('font-medium flex items-center gap-1.5', hasTab ? 'text-[var(--color-success)]' : 'text-[var(--text-tertiary)]')}>
                          <FileText className={cn('w-3.5 h-3.5', !hasTab && 'opacity-40')} aria-hidden="true" />
                          {hasTab ? 'Tablatura disponible' : 'Tablatura no disponible'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" aria-hidden="true" />
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
