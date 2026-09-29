'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { useCallback, useState } from 'react'
import { useAsyncData } from '@/hooks/use-async-data'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, PageHeader, PageLoader, EmptyState, SegmentedControl } from '@/components/ui'
import { Calendar, ChevronLeft, ChevronRight, Eye, List, ChevronRight as Chevron } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { WeeklyPrivilege, PRIVILEGE_DEFINITIONS } from '@/types/privileges'
import { fetchPrivileges } from '@/lib/privilege-storage'
import { formatFullSpanishDate } from '@/lib/date-helpers'
import { PrivilegeDetailModal } from '@/components/privileges/privilege-detail-modal'

const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function EventsPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = useSupabase()

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'))
  const [view, setView] = useState<'calendar' | 'list'>('calendar')

  const [selectedPrivilege, setSelectedPrivilege] = useState<WeeklyPrivilege | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const load = useCallback(() => fetchPrivileges(supabase), [supabase])
  const { data: privileges, loading } = useAsyncData<WeeklyPrivilege[]>(user ? load : null, [])

  const handleOpenDetail = (privilege: WeeklyPrivilege) => {
    setSelectedPrivilege(privilege)
    setIsDetailModalOpen(true)
  }

  if (authLoading || loading) {
    return <PageLoader />
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
  })

  const privilegesByDate = privileges.reduce((acc, priv) => {
    ;(acc[priv.assigned_date] ||= []).push(priv)
    return acc
  }, {} as Record<string, WeeklyPrivilege[]>)

  const changeMonth = (next: Date) => {
    setCurrentMonth(next)
    // Keep the agenda in the visible month: today if shown, else the 1st
    const today = new Date()
    setSelectedDay(format(isSameMonth(today, next) ? today : startOfMonth(next), 'yyyy-MM-dd'))
  }

  return (
    <div className="space-y-5 sm:space-y-6 text-[var(--text-primary)]">
      <PrivilegeDetailModal
        privilege={selectedPrivilege}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />

      <PageHeader
        title="Mis Eventos y Privilegios"
        description="Histórico y calendario de privilegios de Sábados y Domingos."
        actions={
          <SegmentedControl
            label="Vista"
            value={view}
            onChange={setView}
            options={[
              { value: 'calendar', label: 'Calendario', icon: <Calendar className="w-4 h-4" aria-hidden="true" /> },
              { value: 'list', label: 'Lista', icon: <List className="w-4 h-4" aria-hidden="true" /> },
            ]}
          />
        }
      />

      {view === 'calendar' ? (
        <Card className="border-[var(--border-normal)] bg-[var(--bg-raised)] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-[var(--border-subtle)]">
            <CardTitle className="text-base font-bold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </CardTitle>
            <div className="flex items-center gap-1 sm:gap-2 -mr-2 sm:mr-0">
              <Button variant="ghost" size="icon-sm" onClick={() => changeMonth(subMonths(currentMonth, 1))} aria-label="Mes anterior">
                <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => changeMonth(addMonths(currentMonth, 1))} aria-label="Mes siguiente">
                <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => changeMonth(new Date())}>
                Hoy
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0 sm:p-0">
            <MobileMonth
              days={days}
              currentMonth={currentMonth}
              privilegesByDate={privilegesByDate}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onSelectPrivilege={handleOpenDetail}
            />
            <DesktopMonth
              days={days}
              currentMonth={currentMonth}
              privilegesByDate={privilegesByDate}
              onSelectPrivilege={handleOpenDetail}
            />
          </CardContent>
        </Card>
      ) : (
        <ListView privileges={privileges} onSelectPrivilege={handleOpenDetail} />
      )}
    </div>
  )
}

interface MonthProps {
  days: Date[]
  currentMonth: Date
  privilegesByDate: Record<string, WeeklyPrivilege[]>
  onSelectPrivilege: (privilege: WeeklyPrivilege) => void
}

/** Phones: compact month (dot per day with privileges) + agenda for the tapped day */
function MobileMonth({
  days,
  currentMonth,
  privilegesByDate,
  selectedDay,
  onSelectDay,
  onSelectPrivilege,
}: MonthProps & { selectedDay: string; onSelectDay: (key: string) => void }) {
  const dayPrivileges = privilegesByDate[selectedDay] || []
  const [y, m, d] = selectedDay.split('-').map(Number)
  const selectedDate = new Date(y, m - 1, d)

  return (
    <div className="md:hidden">
      <div className="grid grid-cols-7 px-2 pt-2" role="group" aria-label="Calendario del mes">
        {weekDays.map((day) => (
          <div key={day} className="py-1.5 text-center text-caption font-mono text-[var(--text-tertiary)] uppercase">
            {day.charAt(0)}
            <span className="sr-only">{day.slice(1)}</span>
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const count = privilegesByDate[key]?.length || 0
          const inMonth = isSameMonth(day, currentMonth)
          const selected = key === selectedDay
          const today = isToday(day)
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(key)}
              aria-pressed={selected}
              aria-label={`${format(day, "EEEE d 'de' MMMM", { locale: es })}${count ? `, ${count} privilegios` : ''}`}
              className={cn(
                'relative aspect-square min-h-11 flex flex-col items-center justify-center rounded-[var(--radius-md)] text-sm font-mono transition-colors',
                !inMonth && 'text-[var(--text-disabled)]',
                inMonth && !selected && 'text-[var(--text-secondary)] active:bg-[var(--bg-hover)]',
                today && !selected && 'ring-1 ring-inset ring-[var(--border-strong)] text-[var(--text-primary)] font-bold',
                selected && 'bg-[var(--text-primary)] text-[var(--text-inverse)] font-bold'
              )}
            >
              {format(day, 'd')}
              {count > 0 && (
                <span className="absolute bottom-1.5 flex gap-0.5" aria-hidden="true">
                  {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <span
                      key={i}
                      className={cn('w-1 h-1 rounded-full', selected ? 'bg-[var(--text-inverse)]' : 'bg-[var(--text-primary)]')}
                    />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="border-t border-[var(--border-subtle)] mt-2 p-4 space-y-3" aria-live="polite">
        <h3 className="text-sm font-semibold first-letter:uppercase">
          {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
        </h3>
        {dayPrivileges.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)]">Sin privilegios registrados este día.</p>
        ) : (
          <ul className="space-y-2">
            {dayPrivileges.map((priv) => {
              const def = PRIVILEGE_DEFINITIONS.find((p) => p.key === priv.privilege_key)
              return (
                <li key={priv.id}>
                  <button
                    type="button"
                    onClick={() => onSelectPrivilege(priv)}
                    className="w-full min-h-14 text-left px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] active:bg-[var(--bg-hover)] flex items-center justify-between gap-3"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold truncate">{priv.profile_name}</span>
                      <span className="block text-xs text-[var(--text-tertiary)] truncate">
                        {def?.title || priv.privilege_key} · {priv.songs?.length || 0} alabanzas
                      </span>
                    </span>
                    <Chevron className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

/** Tablets and up: full month grid with entries inside each day */
function DesktopMonth({ days, currentMonth, privilegesByDate, onSelectPrivilege }: MonthProps) {
  return (
    <div className="hidden md:grid grid-cols-7 border-l border-[var(--border-subtle)]">
      {weekDays.map((day) => (
        <div
          key={day}
          className="p-2 text-center text-xs font-mono text-[var(--text-tertiary)] border-r border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] uppercase"
        >
          {day}
        </div>
      ))}
      {days.map((day) => {
        const dateKey = format(day, 'yyyy-MM-dd')
        const dayPrivileges = privilegesByDate[dateKey] || []
        const isCurrentMonth = isSameMonth(day, currentMonth)
        const isTodayDate = isToday(day)

        return (
          <div
            key={dateKey}
            className={cn(
              'min-h-[110px] p-2 border-r border-b border-[var(--border-subtle)] flex flex-col',
              !isCurrentMonth && 'opacity-30 bg-[var(--bg-page)]',
              isTodayDate && 'bg-[var(--bg-surface)] ring-1 ring-inset ring-[var(--text-primary)]'
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn('text-xs font-mono font-bold', isTodayDate ? 'text-[var(--color-gs-12)]' : 'text-[var(--text-secondary)]')}>
                {format(day, 'd')}
              </span>
              {dayPrivileges.length > 0 && (
                <Badge variant="brand" size="sm">{dayPrivileges.length}</Badge>
              )}
            </div>

            <div className="space-y-1 mt-1 overflow-y-auto max-h-[80px]">
              {dayPrivileges.map((priv) => {
                const def = PRIVILEGE_DEFINITIONS.find((p) => p.key === priv.privilege_key)
                return (
                  <button
                    key={priv.id}
                    type="button"
                    onClick={() => onSelectPrivilege(priv)}
                    className="w-full text-left p-1.5 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] transition-colors block group"
                  >
                    <span className="flex items-center justify-between gap-1 text-caption font-semibold">
                      <span className="truncate">{priv.profile_name}</span>
                      <Eye className="w-3 h-3 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] shrink-0" aria-hidden="true" />
                    </span>
                    <span className="block text-caption text-[var(--text-tertiary)] truncate">{def?.title || priv.privilege_key}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ListView({
  privileges,
  onSelectPrivilege,
}: {
  privileges: WeeklyPrivilege[]
  onSelectPrivilege: (privilege: WeeklyPrivilege) => void
}) {
  if (privileges.length === 0) {
    return (
      <EmptyState
        icon={<Calendar />}
        title="No hay privilegios registrados en el historial"
        description="Cuando los miembros registren privilegios para los Sábados o Domingos, aparecerán aquí."
      />
    )
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {privileges.map((priv) => {
        const def = PRIVILEGE_DEFINITIONS.find((p) => p.key === priv.privilege_key)
        return (
          <li key={priv.id}>
            <button
              type="button"
              onClick={() => onSelectPrivilege(priv)}
              className="w-full h-full text-left rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-raised)] p-4 hover:border-[var(--text-tertiary)] active:bg-[var(--bg-hover)] transition-colors flex flex-col gap-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--focus-ring)]"
            >
              <span className="flex items-center justify-between gap-2">
                <Badge variant={def?.day === 'saturday' ? 'brand' : 'secondary'} size="sm">
                  {def?.dayLabel || 'Servicio'}
                </Badge>
                <span className="text-caption font-mono text-[var(--text-tertiary)]">{priv.songs?.length || 0} alabanzas</span>
              </span>
              <span className="text-base font-bold">{def?.title || priv.privilege_key}</span>
              <span className="flex items-center justify-between gap-2 p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold truncate">{priv.profile_name}</span>
                  <span className="block text-xs text-[var(--text-tertiary)] font-mono">{formatFullSpanishDate(priv.assigned_date)}</span>
                </span>
                <Chevron className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
