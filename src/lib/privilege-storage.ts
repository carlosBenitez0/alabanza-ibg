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
  ),
  backing_vocals:privilege_backing_vocals (
    id,
    profile_id,
    added_by,
    profile:profiles!privilege_backing_vocals_profile_id_fkey (
      full_name
    )
  )
`

// Same query without backing vocals, for databases where that migration isn't applied yet
const PRIVILEGE_SELECT_BASIC = PRIVILEGE_SELECT.slice(0, PRIVILEGE_SELECT.indexOf(',\n  backing_vocals')) + '\n'

type ProfileJoin = { full_name: string | null } | { full_name: string | null }[] | null

interface PrivilegeRow {
  id: string
  profile_id: string
  privilege_key: string
  assigned_date: string
  songs: WeeklyPrivilege['songs'] | null
  notes?: string
  created_at: string
  profile: ProfileJoin
  backing_vocals?: { id: string; profile_id: string; added_by: string | null; profile: ProfileJoin }[] | null
}

const profileName = (join: ProfileJoin) => (Array.isArray(join) ? join[0] : join)?.full_name || 'Miembro'

function mapPrivilegeRow(item: PrivilegeRow): WeeklyPrivilege {
  return {
    id: item.id,
    profile_id: item.profile_id,
    profile_name: profileName(item.profile),
    privilege_key: item.privilege_key as WeeklyPrivilege['privilege_key'],
    assigned_date: item.assigned_date,
    songs: item.songs || [],
    notes: item.notes,
    created_at: item.created_at,
    backing_vocals: (item.backing_vocals || []).map((bv) => ({
      id: bv.id,
      profile_id: bv.profile_id,
      profile_name: profileName(bv.profile),
      added_by: bv.added_by,
    })),
  }
}

// ─── Backing vocals (coristas) ───

/** Adds a member as backing vocal. Returns an error message or null. */
export async function addBackingVocal(
  supabase: SupabaseClient,
  privilegeId: string,
  profileId: string
): Promise<string | null> {
  const { error } = await supabase
    .from('privilege_backing_vocals')
    .insert({ privilege_id: privilegeId, profile_id: profileId })
  if (!error) return null
  if (error.code === '23505') return 'Esa persona ya es corista en este privilegio.'
  return error.message || 'No se pudo añadir la corista.'
}

export async function removeBackingVocal(supabase: SupabaseClient, backingVocalId: string): Promise<string | null> {
  const { error } = await supabase.from('privilege_backing_vocals').delete().eq('id', backingVocalId)
  return error ? error.message || 'No se pudo quitar la corista.' : null
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

  const run = (select: string) => {
    let query = supabase.from('weekly_privileges').select(select).order('assigned_date', { ascending: false })
    if (range) query = query.gte('assigned_date', range.from).lte('assigned_date', range.to)
    return query
  }

  try {
    let { data, error } = await run(PRIVILEGE_SELECT)
    if (error) ({ data, error } = await run(PRIVILEGE_SELECT_BASIC))
    if (error) throw error
    return mergePrivileges(((data || []) as unknown as PrivilegeRow[]).map(mapPrivilegeRow), local)
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
