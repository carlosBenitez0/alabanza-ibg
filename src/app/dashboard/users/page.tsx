'use client'

import { useCallback } from 'react'
import { useAsyncData } from '@/hooks/use-async-data'
import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { startOfWeek } from 'date-fns'
import { formatISOShortDate, formatFullSpanishDate } from '@/lib/date-helpers'
import { Card, CardContent, CardHeader, Badge, PageHeader, PageLoader, EmptyState } from '@/components/ui'
import { User, Music, Mic, Mic2, Users as UsersIcon, Guitar } from 'lucide-react'
import { PRIVILEGE_DEFINITIONS, PrivilegeKey, WeeklyPrivilege } from '@/types/privileges'
import { fetchPrivileges } from '@/lib/privilege-storage'
import { getRoleWithInstruments } from '@/lib/roles'
import { cn } from '@/lib/utils'

interface Profile {
  id: string
  full_name: string | null
  role: string | null
  instruments?: string[] | null
}

interface UserWithPrivileges extends Profile {
  privileges: WeeklyPrivilege[]
  /** Other members' privileges where this user is a backing vocal */
  backing: WeeklyPrivilege[]
}

export default function UsersDirectoryPage() {
  const { user } = useAuth()
  const supabase = useSupabase()
  
  const loadDirectory = useCallback(async () => {
    // This week's weekend (Saturday and Sunday)
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
    const satDate = new Date(monday)
    satDate.setDate(monday.getDate() + 5)
    const sunDate = new Date(monday)
    sunDate.setDate(monday.getDate() + 6)
    const upcomingDates = [formatISOShortDate(satDate), formatISOShortDate(sunDate)]
    const weekLabel = `${formatFullSpanishDate(satDate)} - ${formatFullSpanishDate(sunDate)}`

    const loadProfiles = async () => {
      const full = await supabase.from('profiles').select('id, full_name, role, instruments').order('full_name')
      return full.error ? supabase.from('profiles').select('id, full_name, role').order('full_name') : full
    }
    const [profilesRes, weekPrivileges] = await Promise.all([
      loadProfiles() as Promise<{ data: Profile[] | null }>,
      fetchPrivileges(supabase, { from: upcomingDates[0], to: upcomingDates[1] }),
    ])

    const usersMap: Record<string, UserWithPrivileges> = {}
    for (const p of profilesRes.data || []) usersMap[p.id] = { ...p, privileges: [], backing: [] }
    for (const priv of weekPrivileges) {
      if (!upcomingDates.includes(priv.assigned_date)) continue
      usersMap[priv.profile_id]?.privileges.push(priv)
      // Backing vocals take part in this privilege without owning it
      for (const bv of priv.backing_vocals || []) usersMap[bv.profile_id]?.backing.push(priv)
    }

    // Members with privileges first, then alphabetical
    const busy = (u: UserWithPrivileges) => u.privileges.length + u.backing.length > 0
    const users = Object.values(usersMap).sort((a, b) => {
      if (busy(a) && !busy(b)) return -1
      if (!busy(a) && busy(b)) return 1
      return (a.full_name || '').localeCompare(b.full_name || '')
    })
    return { users, weekLabel }
  }, [supabase])

  const { data, loading } = useAsyncData(user ? loadDirectory : null, { users: [] as UserWithPrivileges[], weekLabel: '' })
  const { users, weekLabel } = data

  const getPrivilegeDef = (key: PrivilegeKey) => {
    return PRIVILEGE_DEFINITIONS.find(p => p.key === key)
  }

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Mic': return <Mic className="w-3.5 h-3.5" />
      case 'Guitar': return <Guitar className="w-3.5 h-3.5" />
      case 'Users': return <UsersIcon className="w-3.5 h-3.5" />
      default: return <Music className="w-3.5 h-3.5" />
    }
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in">
      <PageHeader
        title="Equipo y Privilegios"
        description={`Directorio del equipo y sus asignaciones para el fin de semana: ${weekLabel}.`}
      />

      {users.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="No hay usuarios registrados"
          description="Aún no hay miembros en la plataforma."
        />
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map(u => {
            const hasPrivileges = u.privileges.length + u.backing.length > 0

            return (
              <Card key={u.id} className={cn(
                "overflow-hidden transition-all duration-200 border",
                hasPrivileges 
                  ? "bg-[var(--bg-raised)] border-[var(--border-strong)]" 
                  : "bg-[var(--bg-surface)] border-[var(--border-subtle)] opacity-80"
              )}>
                <CardHeader className="p-4 pb-2 sm:p-4 sm:pb-2 flex flex-row items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0",
                    hasPrivileges 
                      ? "bg-[var(--text-primary)] text-[var(--text-inverse)]" 
                      : "bg-[var(--bg-active)] text-[var(--text-secondary)] border border-[var(--border-normal)]"
                  )}>
                    {u.full_name ? u.full_name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
                      {u.full_name || 'Usuario Anónimo'}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] truncate">
                      {getRoleWithInstruments(u.role, u.instruments)}
                    </p>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 pt-2 sm:p-4 sm:pt-2">
                  <div className="pt-3 border-t border-[var(--border-subtle)]">
                    {!hasPrivileges ? (
                      <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
                        <span className="text-sm sm:text-xs">Sin privilegios esta semana</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-caption font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
                          Privilegios Asignados:
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {u.privileges.map(priv => {
                            const def = getPrivilegeDef(priv.privilege_key)
                            return (
                              <div 
                                key={priv.id}
                                className="flex items-center justify-between gap-2 p-2 rounded bg-[var(--bg-active)] border border-[var(--border-normal)]"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[var(--text-secondary)] shrink-0">
                                    {getIcon(def?.iconName)}
                                  </span>
                                  <span className="text-sm sm:text-xs font-medium text-[var(--text-primary)] truncate">
                                    {def?.title || priv.privilege_key}
                                  </span>
                                </div>
                                <Badge variant={def?.day === 'saturday' ? 'brand' : 'secondary'} size="sm">
                                  {def?.dayLabel || priv.assigned_date}
                                </Badge>
                              </div>
                            )
                          })}
                          {u.backing.map((priv) => {
                            const def = getPrivilegeDef(priv.privilege_key)
                            return (
                              <div
                                key={`bv-${priv.id}`}
                                className="flex items-center justify-between gap-2 p-2 rounded bg-[var(--bg-surface)] border border-dashed border-[var(--border-normal)]"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[var(--text-secondary)] shrink-0">
                                    <Mic2 className="w-3.5 h-3.5" />
                                  </span>
                                  <span className="text-sm sm:text-xs font-medium text-[var(--text-primary)] truncate">
                                    Corista · de {priv.profile_name}
                                  </span>
                                </div>
                                <Badge variant={def?.day === 'saturday' ? 'brand' : 'secondary'} size="sm">
                                  {def?.dayLabel || priv.assigned_date}
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
