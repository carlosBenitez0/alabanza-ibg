'use client'

import { createContext, ReactNode, useCallback, useContext, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { useAsyncData } from '@/hooks/use-async-data'

export interface CurrentProfile {
  role: 'singer' | 'musician' | 'admin' | string
  full_name: string | null
  instruments?: string[] | null
}

interface ProfileContextType {
  profile: CurrentProfile | null
  loading: boolean
  isAdmin: boolean
  /** Musicians follow the singers' privileges instead of registering their own */
  isMusician: boolean
  unreadCount: number
  refreshUnread: () => void
  refreshProfile: () => void
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

/** Role + unread notification count for the signed-in user, shared by the app shell and pages */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const supabase = useSupabase()
  const userId = user?.id

  const fetchProfile = useCallback(async (): Promise<CurrentProfile | null> => {
    const { data, error } = await supabase.from('profiles').select('role, full_name, instruments').eq('id', userId).single()
    if (!error) return data
    // Database without the musician migration yet
    const { data: basic } = await supabase.from('profiles').select('role, full_name').eq('id', userId).single()
    return basic
  }, [supabase, userId])

  const fetchUnread = useCallback(async (): Promise<number> => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', userId)
      .eq('read', false)
    return count || 0
  }, [supabase, userId])

  const profileQuery = useAsyncData(userId ? fetchProfile : null, null)
  const unreadQuery = useAsyncData(userId ? fetchUnread : null, 0)

  // Keep the unread badge live: Realtime pushes new rows; returning to the
  // tab also refreshes in case Realtime is off for the notifications table
  const refreshUnread = unreadQuery.reload
  useEffect(() => {
    if (!userId || typeof supabase.channel !== 'function') return
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `profile_id=eq.${userId}` },
        () => refreshUnread()
      )
      .subscribe()
    const onVisible = () => document.visibilityState === 'visible' && refreshUnread()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      supabase.removeChannel(channel)
    }
  }, [supabase, userId, refreshUnread])

  const profile = profileQuery.data
  const isAdmin = profile?.role === 'admin'
  const isMusician = profile?.role === 'musician'
  const loading = authLoading || (!!userId && profileQuery.loading)

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        isAdmin,
        isMusician,
        unreadCount: unreadQuery.data,
        refreshUnread,
        refreshProfile: profileQuery.reload,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}
