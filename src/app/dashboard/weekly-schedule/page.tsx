'use client'

import { useState, useCallback } from 'react'
import { useAsyncData } from '@/hooks/use-async-data'
import { RepertoireList } from '@/components/songs/repertoire-list'
import { useSupabase } from '@/hooks/use-supabase'
import { WeeklyPrivilege, PRIVILEGE_DEFINITIONS, PrivilegeKey } from '@/types/privileges'
import {
  getWeekBounds,
  formatFullSpanishDate,
  formatISOShortDate,
  formatWeekRange,
  getCurrentServiceWeekDate,
  getNextWeekDate,
  getPrevWeekDate,
} from '@/lib/date-helpers'
import { fetchPrivileges } from '@/lib/privilege-storage'
import { RegisterPrivilegeModal } from '@/components/privileges/register-privilege-modal'
import { BackingVocals } from '@/components/privileges/backing-vocals'
import { useProfile } from '@/components/providers/profile-provider'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, PageHeader, PageLoader, SegmentedControl, Fab } from '@/components/ui'
import { Calendar, Guitar, Mic, Users, Music, Plus, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react'
import { useGsapMountReveal } from '@/hooks/use-gsap-reveal'
import { cn } from '@/lib/utils'

type ServiceDay = 'saturday' | 'sunday'


export default function WeeklySchedulePage() {
  const supabase = useSupabase()
  // Musicians follow the singers' privileges; they don't register singing slots
  const { isMusician } = useProfile()
  const canRegister = !isMusician

  const [currentWeekDate, setCurrentWeekDate] = useState(() => getCurrentServiceWeekDate())
  const isCurrentWeek = formatWeekRange(currentWeekDate) === formatWeekRange(getCurrentServiceWeekDate())
  // Saturday is always the next service in the displayed week (Sundays jump to next week)
  const [mobileDay, setMobileDay] = useState<ServiceDay>('saturday')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activePrivilegeKey, setActivePrivilegeKey] = useState<PrivilegeKey>('saturday_musician')
  const [allowedDay, setAllowedDay] = useState<ServiceDay | undefined>(undefined)

  const headerRef = useGsapMountReveal<HTMLDivElement>({ from: 'bottom', duration: 0.5 })

  const startDateStr = formatISOShortDate(getWeekBounds(currentWeekDate).start)
  const endDateStr = formatISOShortDate(getWeekBounds(currentWeekDate).end)
  const weekLabel = formatWeekRange(currentWeekDate)

  const fetchWeek = useCallback(
    () => fetchPrivileges(supabase, { from: startDateStr, to: endDateStr }),
    [supabase, startDateStr, endDateStr]
  )
  const { data: privileges, loading, reload } = useAsyncData<WeeklyPrivilege[]>(fetchWeek, [])

  const handleOpenModal = (key: PrivilegeKey = 'saturday_musician', day?: ServiceDay) => {
    setActivePrivilegeKey(key)
    setAllowedDay(day)
    setIsModalOpen(true)
  }

  const getPrivilegesByKey = (key: PrivilegeKey) => privileges.filter((p) => p.privilege_key === key)

  const columns: { day: ServiceDay; title: string; badge: string; badgeVariant: 'brand' | 'secondary' }[] = [
    { day: 'saturday', title: 'Sábado', badge: 'Culto de Sábado', badgeVariant: 'brand' },
    { day: 'sunday', title: 'Domingo', badge: 'Servicio Dominical', badgeVariant: 'secondary' },
  ]

  const countFor = (day: ServiceDay) =>
    privileges.filter((p) => PRIVILEGE_DEFINITIONS.find((d) => d.key === p.privilege_key)?.day === day).length

  return (
    <div className="space-y-5 sm:space-y-8 text-[var(--text-primary)]">
      <RegisterPrivilegeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultPrivilegeKey={activePrivilegeKey}
        targetDate={currentWeekDate}
        allowedDay={allowedDay}
        onSuccess={reload}
      />

      <PageHeader
        ref={headerRef}
        title="Tabla semanal"
        description="Quién sirve en cada privilegio del sábado y del domingo."
        actions={
          <>
            <div className="flex items-center justify-between gap-1 bg-[var(--bg-raised)] border border-[var(--border-normal)] rounded-[var(--radius-md)] p-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setCurrentWeekDate(getPrevWeekDate(currentWeekDate))}
                aria-label="Semana anterior"
              >
                <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
              </Button>
              <span className="text-sm sm:text-xs font-mono px-2 text-[var(--text-secondary)] text-center whitespace-nowrap" aria-live="polite">
                {weekLabel}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setCurrentWeekDate(getNextWeekDate(currentWeekDate))}
                aria-label="Semana siguiente"
              >
                <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
              </Button>
            </div>

            {!isCurrentWeek && (
              <Button variant="outline" size="sm" onClick={() => setCurrentWeekDate(getCurrentServiceWeekDate())}>
                Esta semana
              </Button>
            )}

            {canRegister && (
              <Button className="hidden lg:inline-flex" onClick={() => handleOpenModal('saturday_musician')}>
                <Plus className="w-4 h-4" />
                Registrar mi privilegio
              </Button>
            )}
          </>
        }
      />

      {canRegister && (
        <Fab icon={<Plus />} label="Registrar" onClick={() => handleOpenModal(mobileDay === 'saturday' ? 'saturday_musician' : 'sunday_lead_vocal', mobileDay)} />
      )}

      {/* Phones/tablets: one day at a time */}
      <div className="unstick-landscape lg:hidden sticky top-[calc(var(--header-h)+var(--safe-top))] z-[150] -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-[var(--bg-page)]/90 backdrop-blur-md">
        <SegmentedControl
          label="Día del servicio"
          value={mobileDay}
          onChange={setMobileDay}
          options={columns.map((c) => ({
            value: c.day,
            label: (
              <>
                {c.title}
                <span className="font-mono opacity-70">({countFor(c.day)})</span>
              </>
            ),
          }))}
        />
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {columns.map((col) => (
            <section
              key={col.day}
              aria-labelledby={`col-${col.day}`}
              className={cn('space-y-4 sm:space-y-6 min-w-0', mobileDay !== col.day && 'hidden lg:block')}
            >
              <div className="flex items-center justify-between gap-2 border-b border-[var(--border-strong)] pb-3">
                <h2 id={`col-${col.day}`} className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[var(--text-secondary)]" aria-hidden="true" />
                  {col.title}
                </h2>
                <Badge variant={col.badgeVariant} size="sm">{col.badge}</Badge>
              </div>

              <div className="space-y-4">
                {PRIVILEGE_DEFINITIONS.filter((p) => p.day === col.day).map((def) => (
                  <PrivilegeMatrixSlot
                    key={def.key}
                    definition={def}
                    assignedList={getPrivilegesByKey(def.key)}
                    onOpenModal={(key) => handleOpenModal(key, col.day)}
                    onChanged={reload}
                    canRegister={canRegister}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function PrivilegeIcon({ name }: { name: string }) {
  const className = 'w-4 h-4 text-[var(--text-primary)]'
  switch (name) {
    case 'Guitar': return <Guitar className={className} aria-hidden="true" />
    case 'Mic': return <Mic className={className} aria-hidden="true" />
    case 'Users': return <Users className={className} aria-hidden="true" />
    default: return <Music className={className} aria-hidden="true" />
  }
}

function PrivilegeMatrixSlot({
  definition,
  assignedList,
  onOpenModal,
  onChanged,
  canRegister,
}: {
  definition: typeof PRIVILEGE_DEFINITIONS[0]
  assignedList: WeeklyPrivilege[]
  onOpenModal: (key: PrivilegeKey) => void
  onChanged: () => void
  canRegister: boolean
}) {
  return (
    <Card className="border-[var(--border-normal)] bg-[var(--bg-raised)]">
      <CardHeader className="border-b border-[var(--border-subtle)]">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-normal)] flex items-center justify-center shrink-0">
            <PrivilegeIcon name={definition.iconName} />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-semibold">{definition.title}</CardTitle>
            <p className="text-xs text-[var(--text-tertiary)]">{definition.description}</p>
          </div>
          {canRegister && (
            <Button
              size="icon-sm"
              variant="ghost"
              className="sm:w-auto sm:px-2 shrink-0 -mr-2 -mt-1 sm:mr-0 sm:mt-0"
              onClick={() => onOpenModal(definition.key)}
              aria-label={`Añadirme a ${definition.title} (${definition.dayLabel})`}
            >
              <PlusCircle className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline text-xs">Añadir</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 sm:pt-4 space-y-3">
        {assignedList.length === 0 ? (
          <div className="p-3 sm:p-4 rounded-[var(--radius-md)] border border-dashed border-[var(--border-normal)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-sm text-[var(--text-tertiary)]">Libre — nadie se ha registrado</span>
            {canRegister && (
              <Button size="sm" variant="outline" onClick={() => onOpenModal(definition.key)} fullWidthMobile>
                <Plus className="w-4 h-4" />
                Registrar mi privilegio
              </Button>
            )}
          </div>
        ) : (
          assignedList.map((privilege) => (
            <div key={privilege.id} className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-[var(--text-primary)] text-[var(--text-inverse)] flex items-center justify-center font-bold text-xs shrink-0">
                    {privilege.profile_name?.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold truncate">{privilege.profile_name}</span>
                </div>
                <span className="text-caption font-mono text-[var(--text-tertiary)] pl-9 sm:pl-0">
                  {formatFullSpanishDate(privilege.assigned_date)}
                </span>
              </div>

              {privilege.songs && privilege.songs.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
                  <p className="text-caption font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
                    Alabanzas ({privilege.songs.length})
                  </p>
                  <RepertoireList songs={privilege.songs} compact />
                </div>
              )}

              <BackingVocals privilege={privilege} onChanged={onChanged} />

              {privilege.notes && (
                <p className="text-sm text-[var(--text-tertiary)] italic pt-1 break-words">&ldquo;{privilege.notes}&rdquo;</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
