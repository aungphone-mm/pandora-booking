import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, session_end, duration_seconds } = body

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const supabase = createClient()

    // Update the session with end time and duration
    const { error } = await supabase
      .from('user_sessions')
      .update({
        session_end,
        duration_seconds
      })
      .eq('id', session_id)

    if (error) {
      console.error('Error updating session:', error)
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Session end API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
