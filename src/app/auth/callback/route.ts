import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')

  if (error || errorCode) {
    const reason = errorCode || error || 'expired'
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(reason)}`)
  }

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return (request as unknown as { cookies: { getAll: () => { name: string; value: string }[] } }).cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Note: in Next.js Server Route Handlers, cookie setting is managed by response
          },
        },
      }
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=otp_expired`)
}
