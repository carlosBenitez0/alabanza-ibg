import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { songViewerHref } from '@/lib/song-links'
import { cn } from '@/lib/utils'
import type { PrivilegeSongItem } from '@/types/privileges'

/**
 * Read-only song list used everywhere a privilege or event shows its songs.
 * Each song opens its tablature in the key chosen for that list.
 * `compact` is the dense single-column version for the weekly table.
 */
export function RepertoireList({
  songs,
  compact,
  onNavigate,
  className,
}: {
  songs: PrivilegeSongItem[]
  compact?: boolean
  /** Called when a song is opened (e.g. to close the modal that shows the list) */
  onNavigate?: () => void
  className?: string
}) {
  return (
    <ol className={cn('grid grid-cols-1', compact ? 'gap-1' : 'gap-2 sm:grid-cols-2', className)}>
      {songs.map((song, idx) => (
        <li key={`${song.song_id ?? song.title}-${idx}`} className="min-w-0">
          <Link
            href={songViewerHref(song)}
            onClick={onNavigate}
            className={cn(
              'group flex items-center justify-between gap-2 border transition-colors',
              'hover:border-[var(--text-tertiary)] active:bg-[var(--bg-hover)]',
              compact
                ? 'min-h-11 sm:min-h-9 px-2 py-1.5 rounded text-sm bg-[var(--bg-raised)] border-[var(--border-subtle)]'
                : 'min-h-11 px-3 py-2 rounded-[var(--radius-md)] text-sm bg-[var(--bg-surface)] border-[var(--border-subtle)]'
            )}
            aria-label={`Ver tablatura de ${song.title}${song.key ? ` en ${song.key}` : ''}`}
          >
            <span className="font-medium min-w-0 truncate">
              <span className="font-mono text-[var(--text-tertiary)] tabular-nums">{idx + 1}.</span> {song.title}
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              {song.key && (
                <span className="text-caption font-mono px-1.5 py-0.5 rounded bg-[var(--bg-active)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                  {compact ? song.key : `Tono: ${song.key}`}
                </span>
              )}
              <ChevronRight
                className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors"
                aria-hidden="true"
              />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
