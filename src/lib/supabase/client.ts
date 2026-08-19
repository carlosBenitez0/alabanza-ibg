import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

let mockClient: SupabaseClient | null = null

function createMockClient(): SupabaseClient {
  if (mockClient) return mockClient

  // Create a minimal mock that doesn't throw during static generation
  mockClient = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signInWithOtp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ order: () => ({ limit: () => Promise.resolve({ data: null, error: null }) }) }) }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      upsert: () => Promise.resolve({ data: null, error: null }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
    storage: { from: () => ({ upload: () => Promise.resolve({ data: null, error: null }), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
    functions: { invoke: () => Promise.resolve({ data: null, error: null }) },
  } as unknown as SupabaseClient

  return mockClient
}

export function createClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    if (typeof window !== 'undefined') {
      // Client-side: return mock to avoid build errors
      return createMockClient()
    }
    return null
  }

  return createBrowserClient(url, key)
}

export function getSupabaseClient(): SupabaseClient {
  const client = createClient()
  if (!client) {
    return createMockClient()
  }
  return client
}