'use client'

import { ReactNode } from 'react'

/**
 * Kept as a boundary for the (auth), dashboard and admin trees. The Supabase
 * browser client itself is a singleton obtained through useSupabase().
 */
export function SupabaseProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}
