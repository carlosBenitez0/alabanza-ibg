import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { songViewerHref } from '@/lib/song-links'
import type { PrivilegeSongItem } from '@/types/privileges'

/** Read-only song list; each song opens its tablature in the chosen key. */
export function RepertoireList({ songs }: { songs: PrivilegeSongItem[] }) {
  return (
    <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {songs.map((song, idx) => (
        <li key={`${song.song_id ?? song.title}-${idx}`}>
          <Link
            href={songViewerHref(song)}
            className="group min-h-11 px-3 py-2 rounded-[var(--radius-md)] flex items-center justify-between gap-2 text-sm border bg-[var(--bg-raised)] border-[var(--border-subtle)] hover:border-[var(--text-tertiary)] active:bg-[var(--bg-hover)] transition-colors"
            aria-label={`Ver tablatura de ${song.title}${song.key ? ` en ${song.key}` : ''}`}
          >
            <span className="font-medium min-w-0 truncate">
              {idx + 1}. {song.title}
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              {song.key && (
                <span className="text-caption font-mono px-2 py-0.5 rounded bg-[var(--bg-active)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  Tono: {song.key}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors" aria-hidden="true" />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
