'use client'

import { WeeklyPrivilege, PRIVILEGE_DEFINITIONS } from '@/types/privileges'
import { RepertoireList } from '@/components/songs/repertoire-list'
import { formatFullSpanishDate } from '@/lib/date-helpers'
import { Button, Badge, Modal } from '@/components/ui'
import { Calendar, Guitar, Mic, Users, Music, UserCheck, FileText } from 'lucide-react'

interface PrivilegeDetailModalProps {
  privilege: WeeklyPrivilege | null
  isOpen: boolean
  onClose: () => void
}

function PrivilegeIcon({ name }: { name?: string }) {
  const className = 'w-5 h-5 text-[var(--text-primary)]'
  switch (name) {
    case 'Guitar': return <Guitar className={className} aria-hidden="true" />
    case 'Mic': return <Mic className={className} aria-hidden="true" />
    case 'Users': return <Users className={className} aria-hidden="true" />
    default: return <Music className={className} aria-hidden="true" />
  }
}

export function PrivilegeDetailModal({ privilege, isOpen, onClose }: PrivilegeDetailModalProps) {
  if (!privilege) return null

  const definition = PRIVILEGE_DEFINITIONS.find((p) => p.key === privilege.privilege_key)
  const formattedDate = formatFullSpanishDate(privilege.assigned_date)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={definition?.title || 'Detalle del Privilegio'}
      description={definition?.description}
      icon={
        <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-normal)] flex items-center justify-center">
          <PrivilegeIcon name={definition?.iconName} />
        </div>
      }
      footer={<Button onClick={onClose}>Cerrar</Button>}
    >
      <div className="space-y-6">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
            <dt className="text-caption font-mono text-[var(--text-tertiary)] uppercase tracking-wider">Asignado a</dt>
            <dd className="flex items-center gap-2 text-sm font-semibold">
              <UserCheck className="w-4 h-4 text-[var(--text-secondary)] shrink-0" aria-hidden="true" />
              {privilege.profile_name || 'Miembro'}
            </dd>
          </div>
          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
            <dt className="text-caption font-mono text-[var(--text-tertiary)] uppercase tracking-wider">Fecha del servicio</dt>
            <dd className="flex items-center gap-2 text-sm font-semibold">
              <Calendar className="w-4 h-4 text-[var(--text-secondary)] shrink-0" aria-hidden="true" />
              {formattedDate}
            </dd>
          </div>
        </dl>

        <section className="space-y-3" aria-labelledby="detail-songs-title">
          <div className="flex items-center justify-between gap-2">
            <h3 id="detail-songs-title" className="text-sm font-semibold flex items-center gap-2">
              <Music className="w-4 h-4 text-[var(--text-secondary)]" aria-hidden="true" />
              Alabanzas registradas
            </h3>
            <Badge variant="outline" size="sm">{privilege.songs?.length || 0} canciones</Badge>
          </div>

          {privilege.songs && privilege.songs.length > 0 ? (
            <RepertoireList songs={privilege.songs} onNavigate={onClose} className="sm:grid-cols-1" />
          ) : (
            <p className="p-4 rounded-[var(--radius-md)] border border-dashed border-[var(--border-normal)] text-center text-sm text-[var(--text-tertiary)]">
              No se registraron canciones para este privilegio aún.
            </p>
          )}
        </section>

        {privilege.notes && (
          <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
            <span className="text-caption font-mono text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              Notas adicionales
            </span>
            <p className="text-sm text-[var(--text-secondary)] italic break-words">&ldquo;{privilege.notes}&rdquo;</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
