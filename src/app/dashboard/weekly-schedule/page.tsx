'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/hooks/use-supabase'
import { WeeklyPrivilege, PRIVILEGE_DEFINITIONS, PrivilegeKey } from '@/types/privileges'
import { getWeekBounds, formatFullSpanishDate, formatISOShortDate, getNextWeekDate, getPrevWeekDate } from '@/lib/date-helpers'
import { getLocalPrivileges, mergePrivileges } from '@/lib/privilege-storage'
import { RegisterPrivilegeModal } from '@/components/privileges/register-privilege-modal'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui'
import { Calendar, Guitar, Mic, Users, Music, Plus, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react'
import { useGsapMountReveal, useGsapReveal } from '@/hooks/use-gsap-reveal'

export default function WeeklySchedulePage() {
  const supabase = useSupabase()
  // Default to next week if today is Sunday, since Saturday of this week is in the past
  const getInitialWeeklyDate = () => {
    const today = new Date()
    if (today.getDay() === 0) { // 0 is Sunday
      return getNextWeekDate(today)
    }
    return today
  }

  const [currentWeekDate, setCurrentWeekDate] = useState(getInitialWeeklyDate())
  const [privileges, setPrivileges] = useState<WeeklyPrivilege[]>([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activePrivilegeKey, setActivePrivilegeKey] = useState<PrivilegeKey>('saturday_musician')
  const [allowedDay, setAllowedDay] = useState<'saturday' | 'sunday' | undefined>(undefined)

  const headerRef = useGsapMountReveal<HTMLDivElement>({ from: 'bottom', duration: 0.5 })
  const gridRef = useGsapReveal<HTMLDivElement>({ selector: '.matrix-column', stagger: 0.1 })

  const { start, end } = getWeekBounds(currentWeekDate)
  const startDateStr = formatISOShortDate(start)
  const endDateStr = formatISOShortDate(end)

  useEffect(() => {
    fetchWeeklyPrivileges()
  }, [currentWeekDate])

  const fetchWeeklyPrivileges = async () => {
    try {
      setLoading(true)
      const { data } = await supabase
        .from('weekly_privileges')
        .select(`
          id,
          profile_id,
          privilege_key,
          assigned_date,
          songs,
          notes,
          created_at,
          profile:profiles (
            full_name
          )
        `)
        .gte('assigned_date', startDateStr)
        .lte('assigned_date', endDateStr)

      const mapped = (data || []).map((item) => {
        const profileObj = Array.isArray(item.profile) ? item.profile[0] : item.profile
        return {
          id: item.id,
          profile_id: item.profile_id,
          profile_name: profileObj?.full_name || 'Miembro',
          privilege_key: item.privilege_key as PrivilegeKey,
          assigned_date: item.assigned_date,
          songs: item.songs || [],
          notes: item.notes,
          created_at: item.created_at,
        } as WeeklyPrivilege
      })

      const localData = getLocalPrivileges().filter(
        p => p.assigned_date >= startDateStr && p.assigned_date <= endDateStr
      )
      const merged = mergePrivileges(mapped, localData)
      setPrivileges(merged)
    } catch {
      const localData = getLocalPrivileges().filter(
        p => p.assigned_date >= startDateStr && p.assigned_date <= endDateStr
      )
      setPrivileges(localData)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (key: PrivilegeKey = 'saturday_musician', day?: 'saturday' | 'sunday') => {
    setActivePrivilegeKey(key)
    setAllowedDay(day)
    setIsModalOpen(true)
  }

  const getPrivilegesByKey = (key: PrivilegeKey) => {
    return privileges.filter(p => p.privilege_key === key)
  }

  const saturdayPrivileges = PRIVILEGE_DEFINITIONS.filter(p => p.day === 'saturday')
  const sundayPrivileges = PRIVILEGE_DEFINITIONS.filter(p => p.day === 'sunday')

  return (
    <div className="space-y-8 text-[var(--text-primary)]">
      {/* Modal */}
      <RegisterPrivilegeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultPrivilegeKey={activePrivilegeKey}
        targetDate={currentWeekDate}
        allowedDay={allowedDay}
        onSuccess={fetchWeeklyPrivileges}
      />

      {/* Header */}
      <div ref={headerRef} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Tabla Semanal de Privilegios
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 font-sans">
            Matriz pública de la congregación para Sábado y Domingo.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Week Selector Controls */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-raised)] border border-[var(--border-normal)] rounded-[var(--radius-md)] p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentWeekDate(getPrevWeekDate(currentWeekDate))}
              aria-label="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-mono px-2 text-[var(--text-secondary)]">
              {formatISOShortDate(start)} al {formatISOShortDate(end)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentWeekDate(getNextWeekDate(currentWeekDate))}
              aria-label="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button size="default" onClick={() => handleOpenModal('saturday_musician')}>
            <Plus className="w-4 h-4 mr-1.5" />
            Registrar Mi Privilegio
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border-2 border-[var(--border-strong)] rounded-full" />
            <div className="absolute inset-0 border-2 border-[var(--text-primary)] rounded-full animate-spin border-t-transparent" />
          </div>
        </div>
      ) : (
        <div ref={gridRef} className="grid gap-8 lg:grid-cols-2">
          {/* SATURDAY COLUMN */}
          <div className="matrix-column space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-strong)] pb-3">
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--text-secondary)]" />
                Sábado
              </h2>
              <Badge variant="brand" size="sm">Culto de Sábado</Badge>
            </div>

            <div className="space-y-4">
              {saturdayPrivileges.map((def) => (
                <PrivilegeMatrixSlot
                  key={def.key}
                  definition={def}
                  assignedList={getPrivilegesByKey(def.key)}
                  onOpenModal={(key) => handleOpenModal(key, 'saturday')}
                />
              ))}
            </div>
          </div>

          {/* SUNDAY COLUMN */}
          <div className="matrix-column space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-strong)] pb-3">
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--text-secondary)]" />
                Domingo
              </h2>
              <Badge variant="secondary" size="sm">Servicio Dominical</Badge>
            </div>

            <div className="space-y-4">
              {sundayPrivileges.map((def) => (
                <PrivilegeMatrixSlot
                  key={def.key}
                  definition={def}
                  assignedList={getPrivilegesByKey(def.key)}
                  onOpenModal={(key) => handleOpenModal(key, 'sunday')}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PrivilegeMatrixSlot({
  definition,
  assignedList,
  onOpenModal,
}: {
  definition: typeof PRIVILEGE_DEFINITIONS[0]
  assignedList: WeeklyPrivilege[]
  onOpenModal: (key: PrivilegeKey) => void
}) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Guitar': return <Guitar className="w-4 h-4 text-[var(--text-primary)]" />
      case 'Mic': return <Mic className="w-4 h-4 text-[var(--text-primary)]" />
      case 'Users': return <Users className="w-4 h-4 text-[var(--text-primary)]" />
      case 'Music': default: return <Music className="w-4 h-4 text-[var(--text-primary)]" />
    }
  }

  return (
    <Card className="border-[var(--border-normal)] bg-[var(--bg-raised)]">
      <CardHeader className="pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-normal)] flex items-center justify-center">
              {getIcon(definition.iconName)}
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
                {definition.title}
              </CardTitle>
              <p className="text-xs text-[var(--text-tertiary)]">{definition.description}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs h-7 px-2"
            onClick={() => onOpenModal(definition.key)}
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1" />
            Añadir
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {assignedList.length === 0 ? (
          <div className="p-4 rounded-[var(--radius-md)] border border-dashed border-[var(--border-normal)] flex items-center justify-between gap-3">
            <span className="text-xs text-[var(--text-tertiary)] font-mono">Slot libre sin registrar aún</span>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => onOpenModal(definition.key)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Registrarme aquí
            </Button>
          </div>
        ) : (
          assignedList.map((privilege) => (
            <div key={privilege.id} className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[var(--text-primary)] text-[var(--text-inverse)] flex items-center justify-center font-bold text-[10px]">
                    {privilege.profile_name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{privilege.profile_name}</span>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                  {formatFullSpanishDate(privilege.assigned_date)}
                </span>
              </div>

              {/* Song List */}
              {privilege.songs && privilege.songs.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">Alabanzas ({privilege.songs.length}):</p>
                  <div className="grid gap-1">
                    {privilege.songs.map((song, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[var(--bg-raised)] border border-[var(--border-subtle)]">
                        <span className="text-[var(--text-primary)] font-medium">{idx + 1}. {song.title}</span>
                        {song.key && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-active)] text-[var(--text-secondary)]">
                            {song.key}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Notes */}
              {privilege.notes && (
                <p className="text-xs text-[var(--text-tertiary)] italic pt-1">
                  "{privilege.notes}"
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
