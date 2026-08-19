'use client'

import { createClient } from '@/lib/supabase/client'
import { ReactNode, useMemo, useEffect, useState } from 'react'

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const supabase = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null
    }
    return createClient()
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}