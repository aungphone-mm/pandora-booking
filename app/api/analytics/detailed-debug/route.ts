import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

interface DebugResponse {
  endpoint: string
  params: { startDate: string; endDate: string }
  steps: string[]
  errors: Array<{ step: string; error: any }>
  data: Record<string, any>
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate') || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]

  const debug: DebugResponse = {
    endpoint: '/api/analytics/detailed-debug',
    params: { startDate, endDate },
    steps: [],
    errors: [],
    data: {}
  }

  try {
    // Test 1: Basic appointments query
    debug.steps.push('Testing basic appointments query...')
    const { data: basicAppointments, error: basicError } = await supabase
      .from('appointments')
      .select('*')
      .limit(10)

    if (basicError) {
      debug.errors.push({ step: 'basic_appointments', error: basicError })
      return NextResponse.json(debug, { status: 500 })
    }
    
    debug.data.basicAppointments = {
      count: basicAppointments?.length || 0,
      sample: basicAppointments?.[0] || null
    }

    // Test 2: Appointments with services join
    debug.steps.push('Testing appointments with services join...')
    const { data: appointmentsWithServices, error: servicesError } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        status,
        services(id, name, price)
      `)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)
      .limit(10)

    if (servicesError) {
      debug.errors.push({ step: 'appointments_services', error: servicesError })
    } else {
      debug.data.appointmentsWithServices = {
        count: appointmentsWithServices?.length || 0,
        sample: appointmentsWithServices?.[0] || null
      }
    }

    // Test 3: Check if required tables exist
    debug.steps.push('Checking table existence...')
    const tables = ['appointments', 'services', 'staff', 'products', 'appointment_products']
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        debug.data[`table_${table}`] = {
          exists: !error,
          error: error?.message || null,
          hasData: data && data.length > 0
        }
      } catch (err) {
        debug.data[`table_${table}`] = {
          exists: false,
          error: err instanceof Error ? err.message : String(err)
        }
      }
    }

    // Test 4: Simple analytics calculation
    debug.steps.push('Testing simple analytics calculation...')
    try {
      const { data: simpleData, error: simpleError } = await supabase
        .from('appointments')
        .select('appointment_date, status')
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)

      if (simpleError) {
        debug.errors.push({ step: 'simple_analytics', error: simpleError })
      } else {
        const statusCounts = simpleData?.reduce((acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}

        debug.data.simpleAnalytics = {
          totalAppointments: simpleData?.length || 0,
          statusBreakdown: statusCounts
        }
      }
    } catch (err) {
      debug.errors.push({ 
        step: 'simple_analytics_processing', 
        error: err instanceof Error ? err.message : String(err) 
      })
    }

    // Test 5: Database connection health
    debug.steps.push('Testing database connection...')
    try {
      const { data: healthCheck } = await supabase
        .from('appointments')
        .select('count', { count: 'exact', head: true })

      debug.data.connectionHealth = {
        connected: true,
        appointmentCount: healthCheck || 0
      }
    } catch (err) {
      debug.data.connectionHealth = {
        connected: false,
        error: err instanceof Error ? err.message : String(err)
      }
    }

    return NextResponse.json(debug, { status: 200 })

  } catch (error) {
    debug.errors.push({ 
      step: 'general_error', 
      error: error instanceof Error ? error.message : String(error) 
    })
    
    console.error('Debug analytics error:', error)
    return NextResponse.json(debug, { status: 500 })
  }
}
