import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createClient()

  // Check admin auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get all settings
  const { data: settings, error } = await supabase
    .from('payroll_settings')
    .select('*')
    .order('setting_key')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ settings })
}

export async function PATCH(request: Request) {
  const supabase = createClient()

  // Check admin auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { setting_key, setting_value } = body

  if (!setting_key || setting_value === undefined) {
    return NextResponse.json({ error: 'setting_key and setting_value required' }, { status: 400 })
  }

  // Update setting
  const { data, error } = await supabase
    .from('payroll_settings')
    .update({
      setting_value: setting_value,
      updated_at: new Date().toISOString(),
      updated_by: user.id
    })
    .eq('setting_key', setting_key)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ setting: data })
}
