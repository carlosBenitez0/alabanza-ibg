'use client'

import { createContext, ReactNode, useCallback, useContext } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { useAsyncData } from '@/hooks/use-async-data'

export interface CurrentProfile {
  role: 'singer' | 'leader' | 'admin' | string
  full_name: string | null
}

interface ProfileContextType {
  profile: CurrentProfile | null
  loading: boolean
  isAdmin: boolean
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
    const { data } = await supabase.from('profiles').select('role, full_name').eq('id', userId).single()
    return data
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

  const profile = profileQuery.data
  const isAdmin = profile?.role === 'admin' || profile?.role === 'leader'
  const loading = authLoading || (!!userId && profileQuery.loading)

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        isAdmin,
        unreadCount: unreadQuery.data,
        refreshUnread: unreadQuery.reload,
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
