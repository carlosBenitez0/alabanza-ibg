'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui'
import { Calendar, Music, Clock, ChevronLeft, ChevronRight, Guitar, Mic, Users, Eye } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { WeeklyPrivilege, PRIVILEGE_DEFINITIONS } from '@/types/privileges'
import { getLocalPrivileges, mergePrivileges } from '@/lib/privilege-storage'
import { formatFullSpanishDate } from '@/lib/date-helpers'
import { PrivilegeDetailModal } from '@/components/privileges/privilege-detail-modal'

export default function EventsPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = useSupabase()

  const [privileges, setPrivileges] = useState<WeeklyPrivilege[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [view, setView] = useState<'calendar' | 'list'>('calendar')

  // Selected Privilege for Modal
  const [selectedPrivilege, setSelectedPrivilege] = useState<WeeklyPrivilege | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    if (user) fetchPrivileges()
  }, [user])

  const fetchPrivileges = async () => {
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
        .order('assigned_date', { ascending: false })

      const mapped = (data || []).map((item) => {
        const profileObj = Array.isArray(item.profile) ? item.profile[0] : item.profile
        return {
          id: item.id,
          profile_id: item.profile_id,
          profile_name: profileObj?.full_name || 'Miembro',
          privilege_key: item.privilege_key,
          assigned_date: item.assigned_date,
          songs: item.songs || [],
          notes: item.notes,
          created_at: item.created_at,
        } as WeeklyPrivilege
      })

      const localData = getLocalPrivileges()
      const merged = mergePrivileges(mapped, localData)
      setPrivileges(merged)
    } catch {
      setPrivileges(getLocalPrivileges())
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDetail = (privilege: WeeklyPrivilege) => {
    setSelectedPrivilege(privilege)
    setIsDetailModalOpen(true)
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 border-2 border-[var(--border-strong)] rounded-full" />
          <div className="absolute inset-0 border-2 border-[var(--text-primary)] rounded-full animate-spin border-t-transparent" />
        </div>
      </div>
    )
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const privilegesByDate = privileges.reduce((acc, priv) => {
    const dateKey = priv.assigned_date
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(priv)
    return acc
  }, {} as Record<string, WeeklyPrivilege[]>)

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* Detail Modal */}
      <PrivilegeDetailModal
        privilege={selectedPrivilege}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Mis Eventos y Privilegios
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 font-sans">
            Histórico y calendario de privilegios de Sábados y Domingos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'calendar' ? 'primary' : 'outline'}
            onClick={() => setView('calendar')}
            size="sm"
          >
            <Calendar className="w-4 h-4 mr-1.5" />
            Calendario
          </Button>
          <Button
            variant={view === 'list' ? 'primary' : 'outline'}
            onClick={() => setView('list')}
            size="sm"
          >
            Lista Histórica
          </Button>
        </div>
      </div>

      {view === 'calendar' ? (
        <CalendarView
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          privilegesByDate={privilegesByDate}
          days={days}
          onSelectPrivilege={handleOpenDetail}
        />
      ) : (
        <ListView
          privileges={privileges}
          onSelectPrivilege={handleOpenDetail}
        />
      )}
    </div>
  )
}

function CalendarView({
  currentMonth,
  onMonthChange,
  privilegesByDate,
  days,
  onSelectPrivilege,
}: {
  currentMonth: Date
  onMonthChange: (date: Date) => void
  privilegesByDate: Record<string, WeeklyPrivilege[]>
  days: Date[]
  onSelectPrivilege: (privilege: WeeklyPrivilege) => void
}) {
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return (
    <Card className="border-[var(--border-normal)] bg-[var(--bg-raised)]">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <CardTitle className="text-base font-bold text-[var(--text-primary)] capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMonthChange(subMonths(currentMonth, 1))} aria-label="Mes anterior">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onMonthChange(addMonths(currentMonth, 1))} aria-label="Mes siguiente">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => onMonthChange(new Date())}>
            Hoy
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 border-b border-l border-[var(--border-subtle)]">
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center text-xs font-mono text-[var(--text-tertiary)] border-r border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] uppercase">
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
                  'min-h-[110px] p-2 border-r border-b border-[var(--border-subtle)] relative flex flex-col justify-between transition-colors',
                  !isCurrentMonth && 'opacity-30 bg-[var(--bg-page)]',
                  isTodayDate && 'bg-[var(--bg-surface)] ring-1 ring-inset ring-[var(--text-primary)]'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn('text-xs font-mono font-bold', isTodayDate ? 'text-[var(--color-gs-12)]' : 'text-[var(--text-secondary)]')}>
                    {format(day, 'd')}
                  </span>
                  {dayPrivileges.length > 0 && (
                    <Badge variant="brand" size="sm">
                      {dayPrivileges.length}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1 mt-1 overflow-y-auto max-h-[80px]">
                  {dayPrivileges.map((priv) => {
                    const def = PRIVILEGE_DEFINITIONS.find(p => p.key === priv.privilege_key)
                    return (
                      <button
                        key={priv.id}
                        type="button"
                        onClick={() => onSelectPrivilege(priv)}
                        className="w-full text-left p-1.5 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] transition-colors block group cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-1 text-[10px] font-semibold text-[var(--text-primary)]">
                          <span className="truncate">{priv.profile_name}</span>
                          <Eye className="w-3 h-3 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]" />
                        </div>
                        <p className="text-[9px] text-[var(--text-tertiary)] truncate">
                          {def?.title || priv.privilege_key}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function ListView({
  privileges,
  onSelectPrivilege,
}: {
  privileges: WeeklyPrivilege[]
  onSelectPrivilege: (privilege: WeeklyPrivilege) => void
}) {
  return (
    <div className="space-y-4">
      {privileges.length === 0 ? (
        <Card className="border-[var(--border-normal)] bg-[var(--bg-raised)]">
          <CardContent className="py-16 text-center">
            <Calendar className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
              No hay privilegios registrados en el historial
            </h3>
            <p className="text-xs text-[var(--text-tertiary)]">
              Cuando los miembros registren privilegios para los Sábados o Domingos, aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {privileges.map((priv) => {
            const def = PRIVILEGE_DEFINITIONS.find(p => p.key === priv.privilege_key)
            const formattedDate = formatFullSpanishDate(priv.assigned_date)

            return (
              <Card
                key={priv.id}
                className="hover:border-[var(--text-tertiary)] transition-colors cursor-pointer group"
                onClick={() => onSelectPrivilege(priv)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={def?.day === 'saturday' ? 'brand' : 'secondary'} size="sm">
                      {def?.dayLabel || 'Servicio'}
                    </Badge>
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                      {priv.songs?.length || 0} alabanzas
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] mt-2 group-hover:text-[var(--color-gs-12)] transition-colors">
                    {def?.title || priv.privilege_key}
                  </h3>
                </CardHeader>

                <CardContent className="space-y-3 pt-0 text-xs">
                  <div className="p-2.5 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[var(--text-primary)]">{priv.profile_name}</span>
                    </div>
                    <p className="text-[10px] text-[var(--text-tertiary)] font-mono">{formattedDate}</p>
                  </div>

                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Ver detalle completo
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}