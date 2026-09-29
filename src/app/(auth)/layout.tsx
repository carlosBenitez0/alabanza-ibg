'use client'

import { SupabaseProvider } from '@/components/providers/supabase-provider'
import { AuthProvider } from '@/components/providers/auth-provider'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <main id="main-content" tabIndex={-1} className="outline-none">
          {children}
        </main>
      </AuthProvider>
    </SupabaseProvider>
  )
}
