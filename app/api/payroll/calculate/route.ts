import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PayrollEngine } from '@/lib/payroll/engine'

/**
 * POST /api/payroll/calculate
 * Calculate payroll for a specific period and staff member (or all staff)
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
    const { month, year, staffId } = body

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      )
    }

    const engine = new PayrollEngine()
    const period = { month, year }

    if (staffId) {
      // Calculate for specific staff member
      const payrollData = await engine.calculateStaffPayroll(staffId, period)
      await engine.savePayrollRecord(payrollData, period)

      return NextResponse.json({
        success: true,
        data: payrollData
      })
    } else {
      // Calculate for all active staff
      await engine.calculateAllStaffPayroll(period)

      const summary = await engine.getPayrollSummary(period)

      return NextResponse.json({
        success: true,
        data: summary
      })
    }
  } catch (error: any) {
    console.error('Payroll calculation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to calculate payroll' },
      { status: 500 }
    )
  }
}
