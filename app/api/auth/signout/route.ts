import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers' // Add this import

export async function POST(request: Request) {
  const supabase = createClient()

  // 1. Explicitly clear cookies FIRST
  const cookieStore = cookies()
  cookieStore.delete('refresh_token')
  cookieStore.delete('access_token')

  // 2. Then sign out with Supabase
  const { error } = await supabase.auth.signOut()

  // 3. Always redirect even if error (clear client state)
  return NextResponse.redirect(new URL('/', request.url), {
    status: 303, // Recommended status for POST -> redirect
  })
}