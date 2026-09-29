import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Supabase sends failed email links to the Site URL root
    '/',
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
}