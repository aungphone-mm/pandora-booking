import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { StaffReportEngine, ReportPeriod } from '@/lib/reports/staffReportEngine'
import { HTMLTemplateGenerator } from '@/lib/reports/htmlTemplateGenerator'

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { month, year, format = 'html' } = body

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Missing required fields: month, year' },
        { status: 400 }
      )
    }

    // Calculate date range
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const period: ReportPeriod = {
      startDate,
      endDate,
      month: parseInt(month),
      year: parseInt(year)
    }

    // Generate report
    const engine = new StaffReportEngine()
    const report = await engine.generateCompleteReport(period)

    // Return based on format
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: report
      })
    }

    // Generate HTML
    const htmlGenerator = new HTMLTemplateGenerator()
    const html = htmlGenerator.generateReportHTML(report)

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="staff-report-${year}-${month}.html"`
      }
    })
  } catch (error) {
    console.error('Error generating staff report:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Get current month by default
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    // Calculate date range
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const period: ReportPeriod = {
      startDate,
      endDate,
      month,
      year
    }

    // Generate report
    const engine = new StaffReportEngine()
    const report = await engine.generateCompleteReport(period)

    return NextResponse.json({
      success: true,
      data: report
    })
  } catch (error) {
    console.error('Error generating staff report:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
