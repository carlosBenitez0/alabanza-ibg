'use client'

import { useMemo } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'

export function useSupabase(): SupabaseClient {
  return useMemo(() => getSupabaseClient(), [])
}