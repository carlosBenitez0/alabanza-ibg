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

  // A failed recovery link sends the user back to request a new one
  const failed = (reason: string) =>
    NextResponse.redirect(
      next === '/reset-password'
        ? `${origin}/forgot-password?expired=1`
        : `${origin}/login?error=${encodeURIComponent(reason)}`
    )

  if (errorCode) return failed(errorCode)

  const supabase = await createClient()
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    // Recovery links from the default email template carry no `next`
    const target = type === 'recovery' ? '/reset-password' : next
    if (!error) return NextResponse.redirect(`${origin}${target}`)
  }

  return failed('otp_expired')
}
