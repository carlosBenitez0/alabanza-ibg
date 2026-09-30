import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Runs from src/proxy.ts: refreshes the Supabase session cookies and
 * guards the authenticated areas before any page renders.
 */
export async function updateSession(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Email links that land on a page instead of /auth/callback (old magic
  // links pointed straight at /dashboard?code=...): finish sign-in there
  if (searchParams.has('code') || searchParams.has('token_hash') || searchParams.has('error_code')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    if (!url.searchParams.has('next')) url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute =
    pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password')
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin')

  // /reset-password needs the recovery session created by /auth/callback
  if (!user && pathname.startsWith('/reset-password')) {
    const url = request.nextUrl.clone()
    url.pathname = '/forgot-password'
    url.search = '?expired=1'
    return NextResponse.redirect(url)
  }

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
