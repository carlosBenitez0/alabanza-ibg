'use client'

import { SupabaseProvider } from '@/components/providers/supabase-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ProfileProvider } from '@/components/providers/profile-provider'
import { AppShell } from '@/components/layout/app-shell'
import { AdminSubNav } from '@/components/layout/admin-sub-nav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <ProfileProvider>
          <AppShell requireAdmin>
            <AdminSubNav />
            {children}
          </AppShell>
        </ProfileProvider>
      </AuthProvider>
    </SupabaseProvider>
  )
}
