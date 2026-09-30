import type { SupabaseClient } from '@supabase/supabase-js'

/** Sends a new signup confirmation link. Returns the raw error message, if any. */
export async function resendSignupConfirmation(supabase: SupabaseClient, email: string): Promise<string | null> {
  const { error } = await supabase.auth
    .resend({ type: 'signup', email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
    .catch((e: Error) => ({ error: e }))
  return error ? error.message : null
}

const WEBMAIL: { domains: string[]; name: string; url: string }[] = [
  { domains: ['gmail.com', 'googlemail.com'], name: 'Gmail', url: 'https://mail.google.com/mail/u/0/#inbox' },
  { domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'outlook.es', 'hotmail.es'], name: 'Outlook', url: 'https://outlook.live.com/mail/0/' },
  { domains: ['yahoo.com', 'yahoo.es', 'ymail.com'], name: 'Yahoo Mail', url: 'https://mail.yahoo.com' },
  { domains: ['icloud.com', 'me.com', 'mac.com'], name: 'iCloud Mail', url: 'https://www.icloud.com/mail' },
  { domains: ['proton.me', 'protonmail.com'], name: 'Proton Mail', url: 'https://mail.proton.me' },
]

/** Webmail inbox for well-known providers, so the user can jump straight to the confirmation email. */
export function getWebmailFor(email: string): { name: string; url: string } | null {
  const domain = email.split('@')[1]?.trim().toLowerCase()
  if (!domain) return null
  const found = WEBMAIL.find((w) => w.domains.includes(domain))
  return found ? { name: found.name, url: found.url } : null
}
