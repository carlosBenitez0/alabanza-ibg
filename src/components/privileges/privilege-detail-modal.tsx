'use client'

import { WeeklyPrivilege, PRIVILEGE_DEFINITIONS } from '@/types/privileges'
import { formatFullSpanishDate } from '@/lib/date-helpers'
import { Button, Badge } from '@/components/ui'
import { Calendar, Guitar, Mic, Users, Music, X, UserCheck, FileText } from 'lucide-react'

interface PrivilegeDetailModalProps {
  privilege: WeeklyPrivilege | null
  isOpen: boolean
  onClose: () => void
}

export function PrivilegeDetailModal({
  privilege,
  isOpen,
  onClose,
}: PrivilegeDetailModalProps) {
  if (!isOpen || !privilege) return null

  const definition = PRIVILEGE_DEFINITIONS.find(p => p.key === privilege.privilege_key)
  const formattedDate = formatFullSpanishDate(privilege.assigned_date)

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Guitar': return <Guitar className="w-5 h-5 text-[var(--text-primary)]" />
      case 'Mic': return <Mic className="w-5 h-5 text-[var(--text-primary)]" />
      case 'Users': return <Users className="w-5 h-5 text-[var(--text-primary)]" />
      case 'Music': default: return <Music className="w-5 h-5 text-[var(--text-primary)]" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-[var(--bg-raised)] border border-[var(--border-normal)] rounded-[var(--radius-xl)] shadow-2xl overflow-hidden animate-scale-in text-[var(--text-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-page)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-normal)] flex items-center justify-center">
              {getIcon(definition?.iconName)}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                {definition?.title || 'Detalle del Privilegio'}
              </h2>
              <p className="text-xs text-[var(--text-tertiary)]">
                {definition?.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-colors"
            aria-label="Cerrar detalle"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Member & Date Section */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider block">
                Asignado a:
              </span>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[var(--text-secondary)]" />
                <span className="font-semibold text-xs text-[var(--text-primary)]">
                  {privilege.profile_name || 'Miembro'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
              <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider block">
                Fecha del Servicio:
              </span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
                <span className="font-semibold text-xs text-[var(--text-primary)]">
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Setlist Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Music className="w-4 h-4 text-[var(--text-secondary)]" />
                Listado de Alabanzas Registradas
              </h3>
              <Badge variant="outline" size="sm">
                {privilege.songs?.length || 0} Canciones
              </Badge>
            </div>

            {privilege.songs && privilege.songs.length > 0 ? (
              <div className="space-y-2">
                {privilege.songs.map((song, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[var(--text-tertiary)] w-5">{idx + 1}.</span>
                      <span className="font-medium text-[var(--text-primary)]">{song.title}</span>
                    </div>
                    {song.key && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-active)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                        Tono: {song.key}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-[var(--radius-md)] border border-dashed border-[var(--border-normal)] text-center text-xs text-[var(--text-tertiary)]">
                No se registraron canciones para este privilegio aún.
              </div>
            )}
          </div>

          {/* Notes Section */}
          {privilege.notes && (
            <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
              <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Notas Adicionales:
              </span>
              <p className="text-xs text-[var(--text-secondary)] italic">
                "{privilege.notes}"
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-page)]">
          <Button size="sm" onClick={onClose}>
            Cerrar Detalle
          </Button>
        </div>
      </div>
    </div>
  )
}
