import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PayrollEngine } from '@/lib/payroll/engine'

/**
 * GET /api/payroll/summary?month=12&year=2025
 * Get payroll summary for a specific period
 */
export async function GET(request: Request) {
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
    const month = parseInt(searchParams.get('month') || '')
    const year = parseInt(searchParams.get('year') || '')

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      )
    }

    const engine = new PayrollEngine()
    const summary = await engine.getPayrollSummary({ month, year })

    return NextResponse.json({
      success: true,
      data: summary
    })
  } catch (error: any) {
    console.error('Payroll summary error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get payroll summary' },
      { status: 500 }
    )
  }
}
