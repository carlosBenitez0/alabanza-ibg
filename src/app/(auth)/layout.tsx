'use client'

import { SupabaseProvider } from '@/components/providers/supabase-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ToastProvider } from '@/components/providers/toast-provider'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SupabaseProvider>
  )
}