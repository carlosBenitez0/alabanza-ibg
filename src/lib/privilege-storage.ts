import type { SupabaseClient } from '@supabase/supabase-js'
import { WeeklyPrivilege } from '@/types/privileges'

const LOCAL_STORAGE_KEY = 'alabanza_ibg_weekly_privileges'

/**
 * Gets privileges stored in LocalStorage.
 */
export function getLocalPrivileges(): WeeklyPrivilege[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Saves a privilege into LocalStorage fallback list.
 */
export function saveLocalPrivilege(item: WeeklyPrivilege): WeeklyPrivilege[] {
  if (typeof window === 'undefined') return []
  try {
    const current = getLocalPrivileges()
    // Upsert by profile_id + privilege_key + assigned_date
    const filtered = current.filter(
      p => !(p.profile_id === item.profile_id && p.privilege_key === item.privilege_key && p.assigned_date === item.assigned_date)
    )
    const updated = [item, ...filtered]
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch {
    return []
  }
}

/**
 * Merges Supabase privileges with LocalStorage privileges, removing duplicates.
 */
export function mergePrivileges(remote: WeeklyPrivilege[], local: WeeklyPrivilege[]): WeeklyPrivilege[] {
  const map = new Map<string, WeeklyPrivilege>()

  // Add remote first
  remote.forEach(p => {
    const key = `${p.profile_id}_${p.privilege_key}_${p.assigned_date}`
    map.set(key, p)
  })

  // Add local (overwrites or adds missing)
  local.forEach(p => {
    const key = `${p.profile_id}_${p.privilege_key}_${p.assigned_date}`
    if (!map.has(key)) {
      map.set(key, p)
    }
  })

  return Array.from(map.values())
}

const PRIVILEGE_SELECT = `
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
`

interface PrivilegeRow {
  id: string
  profile_id: string
  privilege_key: string
  assigned_date: string
  songs: WeeklyPrivilege['songs'] | null
  notes?: string
  created_at: string
  profile: { full_name: string | null } | { full_name: string | null }[] | null
}

function mapPrivilegeRow(item: PrivilegeRow): WeeklyPrivilege {
  const profileObj = Array.isArray(item.profile) ? item.profile[0] : item.profile
  return {
    id: item.id,
    profile_id: item.profile_id,
    profile_name: profileObj?.full_name || 'Miembro',
    privilege_key: item.privilege_key as WeeklyPrivilege['privilege_key'],
    assigned_date: item.assigned_date,
    songs: item.songs || [],
    notes: item.notes,
    created_at: item.created_at,
  }
}

/**
 * Loads privileges from Supabase (optionally within a YYYY-MM-DD range)
 * merged with the LocalStorage fallback. Falls back to local data on error.
 */
export async function fetchPrivileges(
  supabase: SupabaseClient,
  range?: { from: string; to: string }
): Promise<WeeklyPrivilege[]> {
  const inRange = (p: WeeklyPrivilege) => !range || (p.assigned_date >= range.from && p.assigned_date <= range.to)
  const local = getLocalPrivileges().filter(inRange)

  try {
    let query = supabase
      .from('weekly_privileges')
      .select(PRIVILEGE_SELECT)
      .order('assigned_date', { ascending: false })
    if (range) query = query.gte('assigned_date', range.from).lte('assigned_date', range.to)

    const { data, error } = await query
    if (error) throw error
    return mergePrivileges(((data || []) as PrivilegeRow[]).map(mapPrivilegeRow), local)
  } catch {
    return local
  }
}

/**
 * Orders a user's privileges so the next upcoming one comes first
 * (or the most recent past one when none are upcoming).
 */
export function orderUserPrivileges(privileges: WeeklyPrivilege[], todayStr: string): WeeklyPrivilege[] {
  const sorted = [...privileges].sort((a, b) => a.assigned_date.localeCompare(b.assigned_date))
  if (sorted.length === 0) return []
  const upcomingIndex = sorted.findIndex((p) => p.assigned_date >= todayStr)
  const mainIndex = upcomingIndex !== -1 ? upcomingIndex : sorted.length - 1
  return [sorted[mainIndex], ...sorted.filter((_, idx) => idx !== mainIndex)]
}
