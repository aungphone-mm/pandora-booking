import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/payroll/bonuses?staffId=xxx&month=12&year=2025
 * Get bonuses for a staff member or all staff
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    let query = supabase
      .from('staff_bonuses')
      .select(`
        *,
        staff(full_name, email)
      `)
      .order('awarded_date', { ascending: false })

    if (staffId) {
      query = query.eq('staff_id', staffId)
    }

    if (month && year) {
      query = query
        .eq('period_month', parseInt(month))
        .eq('period_year', parseInt(year))
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error: any) {
    console.error('Get bonuses error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get bonuses' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/payroll/bonuses
 * Create a custom bonus for a staff member
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Check admin authentication
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
    const {
      staffId,
      bonusType,
      amount,
      description,
      awardedDate,
      periodMonth,
      periodYear,
      notes
    } = body

    if (!staffId || !bonusType || !amount || !description) {
      return NextResponse.json(
        { error: 'Staff ID, bonus type, amount, and description are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('staff_bonuses')
      .insert([{
        staff_id: staffId,
        bonus_type: bonusType,
        amount,
        description,
        awarded_date: awardedDate || new Date().toISOString().split('T')[0],
        period_month: periodMonth,
        period_year: periodYear,
        created_by: user.id,
        notes
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('Create bonus error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create bonus' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/payroll/bonuses?id=xxx
 * Delete a bonus
 */
export async function DELETE(request: Request) {
  try {
    const supabase = createClient()

    // Check admin authentication
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Bonus ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('staff_bonuses')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Bonus deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete bonus error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete bonus' },
      { status: 500 }
    )
  }
}
