'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { startOfWeek } from 'date-fns'
import { formatISOShortDate, formatFullSpanishDate } from '@/lib/date-helpers'
import { Card, CardContent, CardHeader, Badge } from '@/components/ui'
import { User, Music, Mic, Users as UsersIcon, Guitar } from 'lucide-react'
import { PRIVILEGE_DEFINITIONS, PrivilegeKey, WeeklyPrivilege } from '@/types/privileges'
import { cn } from '@/lib/utils'

interface Profile {
  id: string
  full_name: string | null
  role: string | null
}

interface UserWithPrivileges extends Profile {
  privileges: WeeklyPrivilege[]
}

export default function UsersDirectoryPage() {
  const { user } = useAuth()
  const supabase = useSupabase()
  
  const [users, setUsers] = useState<UserWithPrivileges[]>([])
  const [loading, setLoading] = useState(true)
  const [weekLabel, setWeekLabel] = useState('')

  useEffect(() => {
    if (user) {
      fetchUsersAndPrivileges()
    }
  }, [user])

  const fetchUsersAndPrivileges = async () => {
    try {
      setLoading(true)

      // Calculate the current week's weekend dates (Saturday and Sunday)
      const now = new Date()
      const monday = startOfWeek(now, { weekStartsOn: 1 })
      
      const satDate = new Date(monday)
      satDate.setDate(monday.getDate() + 5)
      
      const sunDate = new Date(monday)
      sunDate.setDate(monday.getDate() + 6)
      
      const upcomingDates = [formatISOShortDate(satDate), formatISOShortDate(sunDate)]
      setWeekLabel(`${formatFullSpanishDate(satDate)} - ${formatFullSpanishDate(sunDate)}`)

      // Fetch profiles and this week's privileges concurrently
      const [profilesRes, privRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, role').order('full_name'),
        supabase.from('weekly_privileges').select('*').in('assigned_date', upcomingDates)
      ])

      const profilesData = profilesRes.data || []
      const privilegesData = privRes.data || []

      // Map privileges to users
      const usersMap: Record<string, UserWithPrivileges> = {}
      
      profilesData.forEach(p => {
        usersMap[p.id] = {
          ...p,
          privileges: []
        }
      })

      privilegesData.forEach(priv => {
        if (usersMap[priv.profile_id]) {
          usersMap[priv.profile_id].privileges.push(priv as WeeklyPrivilege)
        }
      })

      // Convert to array and sort (those with privileges first, then alphabetical)
      const usersList = Object.values(usersMap).sort((a, b) => {
        if (a.privileges.length > 0 && b.privileges.length === 0) return -1
        if (a.privileges.length === 0 && b.privileges.length > 0) return 1
        return (a.full_name || '').localeCompare(b.full_name || '')
      })

      setUsers(usersList)
    } catch (error) {
      console.error('Error fetching directory:', error)
    } finally {
      setLoading(false)
    }
  }

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
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 border-3 border-[var(--border-strong)] rounded-full" />
          <div className="absolute inset-0 border-3 border-[var(--text-primary)] rounded-full animate-spin border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-[var(--text-primary)] tracking-tight">
          Equipo y Privilegios
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          Directorio del equipo y sus asignaciones para el fin de semana del {weekLabel}.
        </p>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 border border-[var(--border-subtle)] rounded-[var(--radius-xl)] bg-[var(--bg-surface)]">
          <UsersIcon className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-[var(--text-primary)]">No hay usuarios registrados</h3>
          <p className="text-[var(--text-tertiary)]">Aún no hay miembros en la plataforma.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map(u => {
            const hasPrivileges = u.privileges.length > 0

            return (
              <Card key={u.id} className={cn(
                "overflow-hidden transition-all duration-200 border",
                hasPrivileges 
                  ? "bg-[var(--bg-raised)] border-[var(--border-strong)]" 
                  : "bg-[var(--bg-surface)] border-[var(--border-subtle)] opacity-80"
              )}>
                <CardHeader className="p-4 pb-2 flex flex-row items-center gap-3">
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
                    <p className="text-xs text-[var(--text-tertiary)] capitalize truncate">
                      {u.role || 'Miembro'}
                    </p>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 pt-2">
                  <div className="pt-3 border-t border-[var(--border-subtle)]">
                    {!hasPrivileges ? (
                      <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
                        <span className="text-xs">Sin privilegios esta semana</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
                          Privilegios Asignados:
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {u.privileges.map(priv => {
                            const def = getPrivilegeDef(priv.privilege_key)
                            return (
                              <div 
                                key={priv.id}
                                className="flex items-center justify-between p-2 rounded bg-[var(--bg-active)] border border-[var(--border-normal)]"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[var(--text-secondary)]">
                                    {getIcon(def?.iconName)}
                                  </span>
                                  <span className="text-xs font-medium text-[var(--text-primary)]">
                                    {def?.title || priv.privilege_key}
                                  </span>
                                </div>
                                <Badge variant={def?.day === 'saturday' ? 'brand' : 'secondary'} className="text-[9px] px-1.5 py-0">
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
