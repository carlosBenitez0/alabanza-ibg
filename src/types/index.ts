export type UserRole = 'singer' | 'musician' | 'leader' | 'admin'
export type Instrument = 'guitar' | 'drums' | 'trumpet' | 'piano' | 'bass'
/** Special occasions the team is invited to (regular services are weekly privileges) */
export type EventType = 'camp' | 'united' | 'invitation' | 'other'
export type AssignmentRole = 'lead_vocal' | 'choir' | 'musician' | 'sound' | 'media'
export type AssignmentStatus = 'pending' | 'confirmed' | 'declined'
export type SongListStatus = 'draft' | 'submitted' | 'approved'
export type NotificationType = 'assignment' | 'song_list_submitted' | 'song_list_approved' | 'reminder'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  /** What a musician plays */
  instruments?: Instrument[]
  phone?: string
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  event_type: EventType
  date: string
  /** Last day, for multi-day events such as camps */
  end_date?: string
  start_time?: string
  end_time?: string
  /** Arrival / sound check time */
  arrival_time?: string
  location?: string
  /** Church or group that invites/hosts */
  organizer?: string
  notes?: string
  songs?: { song_id?: string; title: string; key?: string }[]
  created_by: string
  created_at: string
  updated_at: string
}

export interface EventAssignment {
  id: string
  event_id: string
  profile_id: string
  role: AssignmentRole
  status: AssignmentStatus
  assigned_at: string
  confirmed_at?: string
  event?: Event
  profile?: Profile
}

export interface Song {
  title: string
  key?: string
  bpm?: number
  notes?: string
}

export interface SongList {
  id: string
  event_id: string
  profile_id: string
  role: AssignmentRole
  title?: string
  songs: Song[]
  status: SongListStatus
  submitted_at?: string
  created_at: string
  updated_at: string
  event?: Event
  profile?: Profile
}

export interface Notification {
  id: string
  profile_id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  read: boolean
  created_at: string
}

export interface NotificationPreferences {
  profile_id: string
  email_enabled: boolean
  push_enabled: boolean
  assignment_reminder_hours: number
  created_at: string
  updated_at: string
}

export interface DashboardEvent {
  event: Event
  assignment: EventAssignment
  song_list?: SongList
}