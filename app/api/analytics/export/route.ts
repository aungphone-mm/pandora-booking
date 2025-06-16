import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsEngine } from '@/lib/analytics/engine'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    const format = (searchParams.get('format') as 'csv' | 'json') || 'csv'

    const analytics = new AnalyticsEngine()
    const exportData = await analytics.exportAnalyticsData({ startDate, endDate }, format)

    const filename = `pandora-analytics-${startDate}-to-${endDate}.${format}`
    const contentType = format === 'csv' ? 'text/csv' : 'application/json'

    return new NextResponse(exportData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Export analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    )
  }
}