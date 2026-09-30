import type { PrivilegeSongItem } from '@/types/privileges'

/**
 * Link that opens a song's tablature on the songs page, transposed to the key
 * chosen for the privilege. Older privilege songs have no id, so the title is the fallback.
 */
export function songViewerHref(song: PrivilegeSongItem): string {
  const params = new URLSearchParams()
  if (song.song_id) params.set('song', song.song_id)
  else params.set('title', song.title)
  if (song.key) params.set('key', song.key)
  return `/dashboard/songs?${params.toString()}`
}

export function normalizeSongTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}
