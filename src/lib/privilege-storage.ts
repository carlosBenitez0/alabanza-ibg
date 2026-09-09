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
