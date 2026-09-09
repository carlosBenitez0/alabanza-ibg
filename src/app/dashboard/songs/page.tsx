'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/hooks/use-supabase'
import { CatalogSong } from '@/types/privileges'
import { getLocalSongs, mergeSongs } from '@/lib/song-storage'
import { AddSongModal } from '@/components/songs/add-song-modal'
import { TablatureModal } from '@/components/songs/tablature-modal'
import { ALL_MUSIC_KEYS } from '@/components/privileges/song-autocomplete'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from '@/components/ui'
import { Music, Search, Plus, Music2, Activity, FileText, ChevronRight } from 'lucide-react'
import { useGsapMountReveal, useGsapReveal } from '@/hooks/use-gsap-reveal'

export default function SongsPage() {
  const supabase = useSupabase()
  const [songs, setSongs] = useState<CatalogSong[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedTabSong, setSelectedTabSong] = useState<CatalogSong | null>(null)
  const [isTabModalOpen, setIsTabModalOpen] = useState(false)

  const headerRef = useGsapMountReveal<HTMLDivElement>({ from: 'bottom', duration: 0.5 })
  const gridRef = useGsapReveal<HTMLDivElement>({ selector: '.song-card-item', stagger: 0.05 })

  useEffect(() => {
    fetchSongs()
  }, [])

  const fetchSongs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('title', { ascending: true })

      if (error || !data || data.length === 0) {
        setSongs(getLocalSongs())
        return
      }

      const merged = mergeSongs(data, getLocalSongs())
      setSongs(merged)
    } catch {
      setSongs(getLocalSongs())
    } finally {
      setLoading(false)
    }
  }

  const handleOpenTabModal = (song: CatalogSong) => {
    setSelectedTabSong(song)
    setIsTabModalOpen(true)
  }

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (song.default_key && song.default_key.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getKeyLabel = (keyCode?: string | null) => {
    if (!keyCode) return 'No especificado'
    const found = ALL_MUSIC_KEYS.find(k => k.code === keyCode)
    return found ? found.label : keyCode
  }

  return (
    <div className="space-y-8 text-[var(--text-primary)]">
      {/* Add Song Modal */}
      <AddSongModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchSongs}
      />

      {/* Tablature Viewer/Editor Modal */}
      <TablatureModal
        song={selectedTabSong}
        isOpen={isTabModalOpen}
        onClose={() => setIsTabModalOpen(false)}
        onSuccess={fetchSongs}
      />

      {/* Header */}
      <div ref={headerRef} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Repertorio de Alabanzas
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 font-sans">
            Catálogo del ministerio. Haz clic en cualquier alabanza para ver sus acordes o tablatura.
          </p>
        </div>

        <Button size="default" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Proponer / Agregar Alabanza
        </Button>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <Input
          placeholder="Buscar por título o tono (ej. La Bondad, C, G...)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leadingIcon={<Search className="w-4 h-4 text-[var(--text-tertiary)]" />}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border-2 border-[var(--border-strong)] rounded-full" />
            <div className="absolute inset-0 border-2 border-[var(--text-primary)] rounded-full animate-spin border-t-transparent" />
          </div>
        </div>
      ) : filteredSongs.length === 0 ? (
        <Card className="border-[var(--border-normal)] bg-[var(--bg-raised)]">
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--bg-surface)] border border-[var(--border-normal)] flex items-center justify-center">
              <Music className="w-6 h-6 text-[var(--text-secondary)]" />
            </div>
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
              {searchQuery ? 'No se encontraron alabanzas' : 'No hay alabanzas agregadas aún'}
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mb-6 max-w-sm mx-auto">
              {searchQuery
                ? 'Prueba buscando con otro término o propone esta nueva alabanza.'
                : 'Sé el primero en agregar una alabanza al catálogo general del ministerio.'}
            </p>
            <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Proponer Nueva Alabanza
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div ref={gridRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSongs.map((song) => {
            const hasTab = Boolean(song.has_tablature || song.tablature_content)

            return (
              <div key={song.id || song.title} className="song-card-item">
                <Card
                  className="h-full flex flex-col justify-between hover:border-[var(--text-tertiary)] transition-colors cursor-pointer group"
                  onClick={() => handleOpenTabModal(song)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-normal)] flex items-center justify-center">
                        <Music2 className="w-4 h-4 text-[var(--text-primary)]" />
                      </div>
                      <Badge variant="brand" size="sm">
                        {getKeyLabel(song.default_key)}
                      </Badge>
                    </div>
                    <h3 className="mt-3 font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--color-gs-12)] transition-colors">
                      {song.title}
                    </h3>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    {song.bpm && (
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] font-mono">
                        <Activity className="w-3.5 h-3.5" />
                        <span>{song.bpm} BPM</span>
                      </div>
                    )}

                    {/* Tablature Availability Footer Badge */}
                    <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                      {hasTab ? (
                        <span className="text-[var(--color-success)] font-medium text-[11px] flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          Tablatura disponible
                        </span>
                      ) : (
                        <span className="text-[var(--text-tertiary)] font-sans text-[11px] flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 opacity-40" />
                          Tablatura no disponible
                        </span>
                      )}

                      <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
