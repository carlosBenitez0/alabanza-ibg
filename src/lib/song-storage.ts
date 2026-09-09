import { CatalogSong } from '@/types/privileges'

const SONGS_LOCAL_KEY = 'alabanza_ibg_songs_catalog'

export const DEFAULT_CATALOG_SONGS: CatalogSong[] = [
  { 
    id: 'def_1', 
    title: 'La Bondad de Dios', 
    default_key: 'C', 
    bpm: 72,
    has_tablature: true,
    tablature_content: `Intro: C - F - C - F

Verso 1:
C                              F              C
Te amo Dios, Tu misericordia nunca me ha fallado
              Am          F          G
Todos mis días he estado en Tus manos
                 Am      F               C    G/B   Am
Desde el momento en que me despierto hasta que me acueste
          F       G          C
Cantaré de la bondad de Dios

Coro:
F                             C
En toda mi vida Has sido fiel
F                             C    G
En toda mi vida Has sido tan, tan bueno
F                                 C  G/B  Am
Con cada aliento que tengo que pueda dar
          F       G          C
Cantaré de la bondad de Dios`
  },
  { 
    id: 'def_2', 
    title: 'Cuan Grande es Él', 
    default_key: 'G', 
    bpm: 68,
    has_tablature: true,
    tablature_content: `Verso 1:
G                                 C
Señor mi Dios al contemplar los cielos
            G          D          G
El firmamento y las estrellas ver
G                             C
Oír Tu voz en los potentes truenos
            G          D          G
Y ver el sol en su esplendor brillar

Coro:
            G       C          G
Mi corazón se llena de emoción
            Am    D          G
Cuan grande es Él, cuan grande es Él`
  },
  { 
    id: 'def_3', 
    title: 'Glorioso Día', 
    default_key: 'D', 
    bpm: 110,
    has_tablature: true,
    tablature_content: `Intro: D - G - D - G

Verso 1:
D
Estaba enterrado bajo mi dolor
D
Vergüenza llevaba en el corazón
G
Hasta que me llamaste por mi nombre
D
Corrí de la tumba hacia Tu amor`
  },
  { id: 'def_4', title: 'En la Tierra como en el Cielo', default_key: 'D', bpm: 74, has_tablature: false },
  { id: 'def_5', title: 'Tu Fidelidad es Grande', default_key: 'F', bpm: 65, has_tablature: true, tablature_content: `Tu fidelidad es grande, Tu fidelidad incomparable es...` },
  { id: 'def_6', title: 'Digno de Alabar', default_key: 'A', bpm: 120, has_tablature: false },
]

export function getLocalSongs(): CatalogSong[] {
  if (typeof window === 'undefined') return DEFAULT_CATALOG_SONGS
  try {
    const raw = localStorage.getItem(SONGS_LOCAL_KEY)
    if (!raw) {
      localStorage.setItem(SONGS_LOCAL_KEY, JSON.stringify(DEFAULT_CATALOG_SONGS))
      return DEFAULT_CATALOG_SONGS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATALOG_SONGS
  } catch {
    return DEFAULT_CATALOG_SONGS
  }
}

export function saveLocalSong(song: CatalogSong): CatalogSong[] {
  if (typeof window === 'undefined') return DEFAULT_CATALOG_SONGS
  try {
    const current = getLocalSongs()
    const filtered = current.filter(s => s.title.toLowerCase() !== song.title.toLowerCase())
    const updated = [song, ...filtered]
    localStorage.setItem(SONGS_LOCAL_KEY, JSON.stringify(updated))
    return updated
  } catch {
    return DEFAULT_CATALOG_SONGS
  }
}

export function mergeSongs(remote: CatalogSong[], local: CatalogSong[]): CatalogSong[] {
  const map = new Map<string, CatalogSong>()
  
  // Add defaults first
  DEFAULT_CATALOG_SONGS.forEach(s => map.set(s.title.toLowerCase(), s))
  // Add local
  local.forEach(s => map.set(s.title.toLowerCase(), s))
  // Add remote
  remote.forEach(s => map.set(s.title.toLowerCase(), s))

  return Array.from(map.values())
}
