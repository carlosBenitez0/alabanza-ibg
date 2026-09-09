const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fdjmepmjjylbabgsljf.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkam1lcG1qanlqbGJhYmdzbGpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzE2MDU3OSwiZXhwIjoyMTAyNzM2NTc5fQ._NvL0AtRHN9zdE6OtWlOhv9P39rsDPWFTT8QnX8EgXs'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function testConnection() {
  console.log('Testing Supabase connection...')
  
  // Test weekly_privileges table query
  const { data, error } = await supabase.from('weekly_privileges').select('*').limit(1)
  
  if (error) {
    console.log('weekly_privileges error:', error.message, error.code, error.details)
  } else {
    console.log('weekly_privileges table exists! Data:', data)
  }

  // Test songs table query
  const { data: songsData, error: songsError } = await supabase.from('songs').select('*').limit(1)
  if (songsError) {
    console.log('songs error:', songsError.message, songsError.code)
  } else {
    console.log('songs table exists! Data:', songsData)
  }
}

testConnection()
