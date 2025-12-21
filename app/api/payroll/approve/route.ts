import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PayrollEngine } from '@/lib/payroll/engine'

/**
 * POST /api/payroll/approve
 * Approve a payroll record
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
    const { payrollId } = body

    if (!payrollId) {
      return NextResponse.json(
        { error: 'Payroll ID is required' },
        { status: 400 }
      )
    }

    const engine = new PayrollEngine()
    await engine.approvePayroll(payrollId, user.id)

    return NextResponse.json({
      success: true,
      message: 'Payroll approved successfully'
    })
  } catch (error: any) {
    console.error('Payroll approval error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve payroll' },
      { status: 500 }
    )
  }
}
