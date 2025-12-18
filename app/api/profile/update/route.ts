import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the updated profile data from request
    const { full_name, phone } = await request.json()

    // Validate inputs
    if (!full_name || full_name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!phone || phone.trim() === '') {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Update user metadata in Supabase Auth
    const { data, error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: full_name.trim(),
        phone: phone.trim()
      }
    })

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    // Also update the profiles table if it exists
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: full_name.trim(),
        phone: phone.trim()
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Profiles table update error:', profileError)
      // Don't fail if profiles table update fails, user_metadata is the primary source
    }

    return NextResponse.json({
      success: true,
      user: data.user
    })

  } catch (error: any) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
