import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { safeRedirect } from '@/lib/utils'

/**
 * Landing point for every Supabase email link (magic link, signup
 * confirmation, recovery). Supports both link formats:
 *   - PKCE:        ?code=...
 *   - token hash:  ?token_hash=...&type=magiclink|signup|recovery|email
 * The session cookies are written through next/headers cookies().
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const next = safeRedirect(searchParams.get('next'))
  const errorCode = searchParams.get('error_code') || searchParams.get('error')

  if (errorCode) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorCode)}`)
  }

  const supabase = await createClient()
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/login?error=otp_expired`)
}
