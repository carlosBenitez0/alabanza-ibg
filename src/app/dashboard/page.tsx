'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { WeeklyPrivilege, PRIVILEGE_DEFINITIONS, PrivilegeKey } from '@/types/privileges'
import { getWeekBounds, formatFullSpanishDate, formatISOShortDate } from '@/lib/date-helpers'
import { getLocalPrivileges, mergePrivileges } from '@/lib/privilege-storage'
import { RegisterPrivilegeModal } from '@/components/privileges/register-privilege-modal'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui'
import { Calendar, Music, Clock, Plus, Music2, ListMusic, UserCheck, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useGsapMountReveal, useGsapReveal } from '@/hooks/use-gsap-reveal'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = useSupabase()

  const [myWeeklyPrivileges, setMyWeeklyPrivileges] = useState<WeeklyPrivilege[]>([])
  const [selectedPrivilegeKey, setSelectedPrivilegeKey] = useState<PrivilegeKey>('saturday_musician')
  const [weeklyMatrix, setWeeklyMatrix] = useState<WeeklyPrivilege[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const headerRef = useGsapMountReveal<HTMLDivElement>({ from: 'bottom', duration: 0.5 })
  const contentRef = useGsapReveal<HTMLDivElement>({ selector: '.dashboard-card', stagger: 0.08 })

  const { start, end } = getWeekBounds(new Date())
  const startDateStr = formatISOShortDate(start)
  const endDateStr = formatISOShortDate(end)

  useEffect(() => {
    if (user) fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return
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
          privilege_key: item.privilege_key,
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
      setWeeklyMatrix(merged)

      // Find all logged in user's privileges for this week
      const userPrivs = merged.filter(p => p.profile_id === user.id)
      
      // Sort userPrivs so that the most upcoming/closest to today is at the beginning, and others follow
      const todayStr = formatISOShortDate(new Date())
      const sortedPrivs = [...userPrivs].sort((a, b) => a.assigned_date.localeCompare(b.assigned_date))
      const upcomingIndex = sortedPrivs.findIndex(p => p.assigned_date >= todayStr)
      
      let orderedPrivs: WeeklyPrivilege[] = []
      if (upcomingIndex !== -1) {
        const upcomingPriv = sortedPrivs[upcomingIndex]
        const others = sortedPrivs.filter((_, idx) => idx !== upcomingIndex)
        orderedPrivs = [upcomingPriv, ...others]
      } else if (sortedPrivs.length > 0) {
        const latestPriv = sortedPrivs[sortedPrivs.length - 1]
        const others = sortedPrivs.slice(0, -1)
        orderedPrivs = [latestPriv, ...others]
      }
      setMyWeeklyPrivileges(orderedPrivs)
    } catch {
      const localData = getLocalPrivileges().filter(
        p => p.assigned_date >= startDateStr && p.assigned_date <= endDateStr
      )
      setWeeklyMatrix(localData)
      const userPrivs = localData.filter(p => p.profile_id === user.id)
      
      const todayStr = formatISOShortDate(new Date())
      const sortedPrivs = [...userPrivs].sort((a, b) => a.assigned_date.localeCompare(b.assigned_date))
      const upcomingIndex = sortedPrivs.findIndex(p => p.assigned_date >= todayStr)
      
      let orderedPrivs: WeeklyPrivilege[] = []
      if (upcomingIndex !== -1) {
        const upcomingPriv = sortedPrivs[upcomingIndex]
        const others = sortedPrivs.filter((_, idx) => idx !== upcomingIndex)
        orderedPrivs = [upcomingPriv, ...others]
      } else if (sortedPrivs.length > 0) {
        const latestPriv = sortedPrivs[sortedPrivs.length - 1]
        const others = sortedPrivs.slice(0, -1)
        orderedPrivs = [latestPriv, ...others]
      }
      setMyWeeklyPrivileges(orderedPrivs)
    } finally {
      setLoading(false)
    }
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

  const handleOpenModal = (key?: PrivilegeKey) => {
    if (key) {
      setSelectedPrivilegeKey(key)
    } else {
      setSelectedPrivilegeKey(myWeeklyPrivileges[0]?.privilege_key || 'saturday_musician')
    }
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-8 text-[var(--text-primary)]">
      {/* Modal */}
      <RegisterPrivilegeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultPrivilegeKey={selectedPrivilegeKey}
        onSuccess={fetchDashboardData}
      />

      {/* Header */}
      <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Mi Panel
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 font-sans">
            Bienvenido, <span className="text-[var(--text-primary)] font-semibold">{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</span> — Ministerio de Alabanza IBG
          </p>
        </div>

        <Button size="default" onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-1.5" />
          Registrar / Editar Mi Privilegio
        </Button>
      </div>

      <div ref={contentRef} className="grid gap-8 lg:grid-cols-3">
        {/* HERO SECTION: USER'S PERSONAL PRIVILEGES (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="dashboard-card">
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[var(--text-secondary)]" />
              Mis Privilegios de la Semana
            </h2>

            {myWeeklyPrivileges.length > 0 ? (
              <div className="space-y-4">
                {myWeeklyPrivileges.map((privilege, idx) => {
                  const isMain = idx === 0
                  const def = PRIVILEGE_DEFINITIONS.find(p => p.key === privilege.privilege_key)
                  return (
                    <Card
                      key={privilege.id}
                      className={cn(
                        "transition-all duration-300 relative overflow-hidden",
                        isMain 
                          ? "border-[var(--border-normal)] bg-[var(--bg-raised)] shadow-md"
                          : "border-[var(--border-subtle)] bg-[var(--bg-raised)]/40 opacity-70 hover:opacity-100 hover:border-[var(--border-normal)]"
                      )}
                    >
                      <CardHeader className={cn(
                        "pb-3 border-b border-[var(--border-subtle)]",
                        isMain ? "bg-[var(--bg-page)]" : "bg-[var(--bg-page)]/20"
                      )}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center font-bold",
                              isMain 
                                ? "bg-[var(--text-primary)] text-[var(--text-inverse)]"
                                : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                            )}>
                              <Music className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-[var(--text-primary)]">
                                  {def?.title || 'Mi Privilegio'}
                                </h3>
                                {!isMain && (
                                  <Badge variant="outline" size="sm" className="text-[10px] px-1.5 py-0 border-[var(--border-subtle)] text-[var(--text-tertiary)] bg-[var(--bg-surface)]">
                                    Siguiente
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-[var(--text-tertiary)]">
                                {def?.description}
                              </p>
                            </div>
                          </div>
                          <Badge variant={isMain ? "brand" : "secondary"} size="sm">
                            {def?.dayLabel || 'Servicio'}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-4 space-y-5">
                        <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
                          <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
                          <span>{formatFullSpanishDate(privilege.assigned_date)}</span>
                        </div>

                        {/* Songs list to rehearse */}
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
                            <Music2 className="w-4 h-4 text-[var(--text-secondary)]" />
                            Repertorio a Ensayar ({privilege.songs?.length || 0}):
                          </p>

                          {privilege.songs && privilege.songs.length > 0 ? (
                            <div className="grid gap-2 sm:grid-cols-2">
                              {privilege.songs.map((song, sIdx) => (
                                <div
                                  key={sIdx}
                                  className={cn(
                                    "p-2.5 rounded-[var(--radius-md)] flex items-center justify-between text-xs border transition-colors",
                                    isMain 
                                      ? "bg-[var(--bg-surface)] border-[var(--border-subtle)]"
                                      : "bg-[var(--bg-surface)]/50 border-[var(--border-subtle)]/50"
                                  )}
                                >
                                  <span className="font-medium text-[var(--text-primary)] truncate">
                                    {sIdx + 1}. {song.title}
                                  </span>
                                  {song.key && (
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-active)] text-[var(--text-secondary)] border border-[var(--border-subtle)] flex-shrink-0">
                                      Tono: {song.key}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 rounded-[var(--radius-md)] border border-dashed border-[var(--border-normal)] text-center text-xs text-[var(--text-tertiary)]">
                              No has registrado canciones aún para tu privilegio.
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {privilege.notes && (
                          <div className={cn(
                            "p-3 rounded-[var(--radius-md)] text-xs italic text-[var(--text-tertiary)] border",
                            isMain 
                              ? "bg-[var(--bg-surface)] border-[var(--border-subtle)]"
                              : "bg-[var(--bg-surface)]/50 border-[var(--border-subtle)]/50"
                          )}>
                            "{privilege.notes}"
                          </div>
                        )}

                        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleOpenModal(privilege.privilege_key)}
                          >
                            Editar Mi Privilegio y Lista
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card className="border-[var(--border-subtle)] bg-[var(--bg-raised)]">
                <CardContent className="py-12 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--bg-surface)] border border-[var(--border-normal)] flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-[var(--text-secondary)]" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
                    Aún no has registrado tu privilegio para esta semana
                  </h3>
                  <p className="text-xs text-[var(--text-tertiary)] mb-6 max-w-md mx-auto">
                    Selecciona tu función para Sábado o Domingo y agrega las alabanzas que cantarás o tocarás con el ministerio.
                  </p>
                  <Button size="sm" onClick={() => handleOpenModal()}>
                    <Plus className="w-4 h-4 mr-1.5" />
                    Registrar Mi Privilegio Ahora
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* SIDEBAR: QUICK ACTIONS & WEEK MATRIX SUMMARY (1 Column) */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="dashboard-card space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
              Accesos Rápidos
            </h3>

            <div className="grid gap-2">
              <Link href="/dashboard/weekly-schedule">
                <Button variant="outline" className="w-full justify-between h-auto p-3 text-xs">
                  <span className="flex items-center gap-2 font-medium">
                    <ListMusic className="w-4 h-4 text-[var(--text-secondary)]" />
                    Tabla Semanal Completa
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>

              <Link href="/dashboard/songs">
                <Button variant="outline" className="w-full justify-between h-auto p-3 text-xs">
                  <span className="flex items-center gap-2 font-medium">
                    <Music2 className="w-4 h-4 text-[var(--text-secondary)]" />
                    Repertorio de Alabanzas
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>

              <Link href="/dashboard/events">
                <Button variant="outline" className="w-full justify-between h-auto p-3 text-xs">
                  <span className="flex items-center gap-2 font-medium">
                    <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
                    Mis Eventos Históricos
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Week Matrix Summary */}
          <div className="dashboard-card space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Esta Semana</span>
              <Badge variant="outline" size="sm">{weeklyMatrix.length} Asignados</Badge>
            </h3>

            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-raised)] border border-[var(--border-subtle)] space-y-3">
              {weeklyMatrix.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)] text-center py-4">
                  Nadie ha registrado privilegios aún para esta semana.
                </p>
              ) : (
                weeklyMatrix.slice(0, 5).map((item) => {
                  const def = PRIVILEGE_DEFINITIONS.find(p => p.key === item.privilege_key)
                  return (
                    <div key={item.id} className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--border-subtle)] last:border-0">
                      <div>
                        <span className="font-semibold text-[var(--text-primary)] block">{item.profile_name}</span>
                        <span className="text-[10px] text-[var(--text-tertiary)]">{def?.title}</span>
                      </div>
                      <Badge variant={def?.day === 'saturday' ? 'brand' : 'secondary'} size="sm">
                        {def?.dayLabel}
                      </Badge>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}