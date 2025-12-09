import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsEngine } from '@/lib/analytics/engine'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const analytics = new AnalyticsEngine()
    const summary = await analytics.getDashboardSummary()

    return NextResponse.json(summary)

  } catch (error) {
    console.error('Analytics summary error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics summary' },
      { status: 500 }
    )
  }
}