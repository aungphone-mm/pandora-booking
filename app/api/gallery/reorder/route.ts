import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// PUT - Reorder photos
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { photoIds } = body // Array of photo IDs in desired order

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json({ error: 'Photo IDs array required' }, { status: 400 })
    }

    // Update each photo's display_order sequentially to prevent race conditions
    for (let i = 0; i < photoIds.length; i++) {
      const { error } = await supabase
        .from('gallery_photos')
        .update({ display_order: i })
        .eq('id', photoIds[i])

      if (error) {
        console.error(`Reorder error for photo ${photoIds[i]}:`, error)
        return NextResponse.json({
          error: 'Failed to reorder photos',
          details: error.message
        }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Gallery reorder error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
