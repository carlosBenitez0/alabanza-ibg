export type PrivilegeKey = 
  | 'saturday_musician' 
  | 'sunday_lead_vocal' 
  | 'sunday_choir' 
  | 'sunday_rehearsal'

export interface PrivilegeDefinition {
  key: PrivilegeKey
  title: string
  day: 'saturday' | 'sunday'
  dayLabel: 'Sábado' | 'Domingo'
  description: string
  iconName: 'Guitar' | 'Mic' | 'Users' | 'Music'
}

export const PRIVILEGE_DEFINITIONS: PrivilegeDefinition[] = [
  {
    key: 'saturday_musician',
    title: 'Cantar alabanzas',
    day: 'saturday',
    dayLabel: 'Sábado',
    description: 'Cantar alabanzas en el culto del día Sábado',
    iconName: 'Mic',
  },
  {
    key: 'sunday_lead_vocal',
    title: 'Cantar alabanzas',
    day: 'sunday',
    dayLabel: 'Domingo',
    description: 'Voz principal / Liderazgo de adoración en el culto dominical',
    iconName: 'Mic',
  },
  {
    key: 'sunday_choir',
    title: 'Cantar coros',
    day: 'sunday',
    dayLabel: 'Domingo',
    description: 'Equipo de coros y apoyo vocal dominical',
    iconName: 'Users',
  },
  {
    key: 'sunday_rehearsal',
    title: 'Ensayar',
    day: 'sunday',
    dayLabel: 'Domingo',
    description: 'Ensayo y preparación musical dominical',
    iconName: 'Music',
  },
]

export interface CatalogSong {
  id: string
  title: string
  default_key?: string | null
  bpm?: number | null
  has_tablature?: boolean
  tablature_url?: string | null
  tablature_content?: string | null
  created_at?: string
}

export interface PrivilegeSongItem {
  song_id?: string
  title: string
  key?: string
}

export interface WeeklyPrivilege {
  id: string
  profile_id: string
  profile_name?: string
  privilege_key: PrivilegeKey
  assigned_date: string
  songs: PrivilegeSongItem[]
  notes?: string
  created_at: string
}
