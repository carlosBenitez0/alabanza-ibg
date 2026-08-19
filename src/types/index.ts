export type UserRole = 'singer' | 'leader' | 'admin'
export type EventType = 'rehearsal' | 'service' | 'saturday'
export type AssignmentRole = 'lead_vocal' | 'choir' | 'musician' | 'sound' | 'media'
export type AssignmentStatus = 'pending' | 'confirmed' | 'declined'
export type SongListStatus = 'draft' | 'submitted' | 'approved'
export type NotificationType = 'assignment' | 'song_list_submitted' | 'song_list_approved' | 'reminder'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  phone?: string
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  event_type: EventType
  date: string
  start_time?: string
  end_time?: string
  location?: string
  notes?: string
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