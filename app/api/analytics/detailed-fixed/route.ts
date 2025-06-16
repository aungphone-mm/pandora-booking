import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]

    console.log('Fetching detailed analytics for:', { startDate, endDate })

    // Step 1: Get appointment data with services directly joined (no junction table)
    const { data: appointmentData, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        customer_email,
        customer_phone,
        user_id,
        created_at,
        services!inner(id, name, price, duration)
      `)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)

    if (appointmentError) {
      console.error('Appointment query error:', appointmentError)
      throw new Error(`Failed to fetch appointments: ${appointmentError.message}`)
    }

    console.log('Fetched appointments:', appointmentData?.length || 0)
    console.log('Sample appointment:', appointmentData?.[0])

    // Step 2: Process the data with the correct schema
    const processedData = processAnalyticsData(appointmentData || [])

    return NextResponse.json(processedData)

  } catch (error) {
    console.error('Detailed analytics API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { 
        error: 'Failed to fetch detailed analytics data',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

function processAnalyticsData(appointments: any[]) {
  try {
    console.log('Processing', appointments.length, 'appointments')
    
    // Process weekly trends
    const weeklyTrends = processWeeklyTrends(appointments)
    
    // Process customer analytics
    const customerAnalytics = processCustomerAnalytics(appointments)
    
    // Process operational analytics
    const operationalAnalytics = processOperationalAnalytics(appointments)

    // Generate forecasting data
    const forecastingData = generateBasicForecasting(weeklyTrends)

    const result = {
      seasonal: {
        weeklyTrends: weeklyTrends || []
      },
      customers: customerAnalytics || getDefaultCustomerAnalytics(),
      operational: operationalAnalytics || getDefaultOperationalAnalytics(),
      forecasting: forecastingData || getDefaultForecastingData()
    }
    
    console.log('Processed result sample:', {
      weeklyTrendsCount: result.seasonal.weeklyTrends.length,
      firstWeekRevenue: result.seasonal.weeklyTrends[0]?.revenue || 0,
      customerCount: result.customers.segments.highValue + result.customers.segments.regular + result.customers.segments.newCustomers
    })

    return result

  } catch (error) {
    console.error('Data processing error:', error)
    throw new Error(`Data processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function processWeeklyTrends(appointments: any[]) {
  try {
    const weeklyData = new Map<string, { appointments: number, revenue: number, services: Map<string, number> }>()

    appointments.forEach(appointment => {
      if (!appointment?.appointment_date) return

      const date = new Date(appointment.appointment_date)
      if (isNaN(date.getTime())) return

      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().slice(0, 10)

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          appointments: 0,
          revenue: 0,
          services: new Map<string, number>()
        })
      }

      const weekData = weeklyData.get(weekKey)!
      weekData.appointments += 1

      // Calculate revenue from the directly linked service
      if (appointment.services) {
        const service = appointment.services
        const price = Number(service.price) || 0
        weekData.revenue += price

        // Track service counts
        const serviceName = service.name || 'Unknown'
        weekData.services.set(serviceName, (weekData.services.get(serviceName) || 0) + 1)
        
        console.log(`Added service ${serviceName} with price ${price} to week ${weekKey}`)
      }
    })

    const result = Array.from(weeklyData.entries()).map(([week, data]) => ({
      week,
      appointments: data.appointments,
      revenue: data.revenue,
      services: Object.fromEntries(data.services)
    })).sort((a, b) => a.week.localeCompare(b.week))
    
    console.log('Weekly trends processed:', result.length, 'weeks')
    return result

  } catch (error) {
    console.error('Weekly trends processing error:', error)
    return []
  }
}

function processCustomerAnalytics(appointments: any[]) {
  try {
    const customerData = new Map<string, any>()

    appointments.forEach(appointment => {
      const customerId = appointment.customer_email || appointment.user_id || 'anonymous'
      
      if (!customerData.has(customerId)) {
        customerData.set(customerId, {
          totalBookings: 0,
          totalSpent: 0,
          isRegistered: !!appointment.user_id,
          firstBooking: appointment.appointment_date,
          lastBooking: appointment.appointment_date
        })
      }

      const customer = customerData.get(customerId)!
      customer.totalBookings += 1

      // Calculate spending from directly linked service
      if (appointment.services) {
        const price = Number(appointment.services.price) || 0
        customer.totalSpent += price
      }

      // Update booking dates
      if (appointment.appointment_date < customer.firstBooking) {
        customer.firstBooking = appointment.appointment_date
      }
      if (appointment.appointment_date > customer.lastBooking) {
        customer.lastBooking = appointment.appointment_date
      }
    })

    const customers = Array.from(customerData.values())
    
    // Calculate segments
    const segments = {
      highValue: customers.filter(c => c.totalSpent > 50000).length,
      regular: customers.filter(c => c.totalBookings >= 3 && c.totalSpent <= 50000).length,
      newCustomers: customers.filter(c => c.totalBookings === 1).length,
      registered: customers.filter(c => c.isRegistered).length
    }

    // Calculate averages
    const avgLifetimeValue = customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length 
      : 0

    const customersWithMultipleBookings = customers.filter(c => c.totalBookings > 1)
    const avgBookingGap = customersWithMultipleBookings.length > 0
      ? customersWithMultipleBookings.reduce((sum, c) => {
          const daysDiff = Math.ceil((new Date(c.lastBooking).getTime() - new Date(c.firstBooking).getTime()) / (1000 * 60 * 60 * 24))
          return sum + (daysDiff / (c.totalBookings - 1))
        }, 0) / customersWithMultipleBookings.length
      : 0

    // Top customers
    const topCustomers = customers
      .map(c => ({
        totalBookings: c.totalBookings,
        totalSpent: c.totalSpent,
        avgSpentPerBooking: c.totalBookings > 0 ? c.totalSpent / c.totalBookings : 0,
        estimatedLTV: c.totalSpent,
        isRegistered: c.isRegistered
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)

    return {
      segments,
      avgLifetimeValue,
      avgBookingGap: avgBookingGap || 0,
      topCustomers
    }

  } catch (error) {
    console.error('Customer analytics processing error:', error)
    return getDefaultCustomerAnalytics()
  }
}

function processOperationalAnalytics(appointments: any[]) {
  try {
    // Calculate average lead time
    const leadTimes = appointments
      .filter(a => a.created_at && a.appointment_date)
      .map(a => {
        const created = new Date(a.created_at)
        const appointment = new Date(a.appointment_date)
        return Math.ceil((appointment.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      })
      .filter(days => days >= 0)

    const avgLeadTime = leadTimes.length > 0 
      ? leadTimes.reduce((sum, days) => sum + days, 0) / leadTimes.length 
      : 0

    // Calculate cancellation rate
    const totalAppointments = appointments.length
    const cancelledAppointments = appointments.filter(a => 
      a.status === 'cancelled' || a.status === 'no_show'
    ).length
    const cancellationRate = totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0

    // Cancellation patterns
    const cancelledAppts = appointments.filter(a => a.status === 'cancelled' || a.status === 'no_show')
    
    const byTime = cancelledAppts.reduce((acc, a) => {
      if (a.appointment_time) {
        acc[a.appointment_time] = (acc[a.appointment_time] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const byDayOfWeek = cancelledAppts.reduce((acc, a) => {
      if (a.appointment_date) {
        const dayOfWeek = new Date(a.appointment_date).getDay()
        const dayName = dayNames[dayOfWeek]
        acc[dayName] = (acc[dayName] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    // Service efficiency from directly linked services
    const serviceEfficiency = appointments
      .filter(a => a.services)
      .reduce((acc, appointment) => {
        const service = appointment.services
        const name = service.name || 'Unknown'
        
        if (!acc[name]) {
          acc[name] = {
            name,
            bookingsCount: 0,
            revenuePerHour: 0,
            popularTimes: {} as Record<string, number>
          }
        }
        
        acc[name].bookingsCount += 1
        
        if (appointment.appointment_time) {
          acc[name].popularTimes[appointment.appointment_time] = 
            (acc[name].popularTimes[appointment.appointment_time] || 0) + 1
        }
        
        const duration = Number(service.duration) || 60
        const price = Number(service.price) || 0
        acc[name].revenuePerHour = duration > 0 ? (price / duration) * 60 : 0

        return acc
      }, {} as Record<string, any>)

    return {
      avgLeadTime,
      cancellationRate,
      cancellationPatterns: {
        byTime,
        byDayOfWeek,
        byLeadTime: leadTimes
      },
      serviceEfficiency: Object.values(serviceEfficiency)
    }

  } catch (error) {
    console.error('Operational analytics processing error:', error)
    return getDefaultOperationalAnalytics()
  }
}

function generateBasicForecasting(weeklyTrends: any[]) {
  try {
    if (weeklyTrends.length < 2) {
      return getDefaultForecastingData()
    }

    const recentWeeks = weeklyTrends.slice(-8)
    const revenues = recentWeeks.map(w => w.revenue)
    const avgRevenue = revenues.reduce((sum, r) => sum + r, 0) / revenues.length

    const firstHalf = revenues.slice(0, Math.floor(revenues.length / 2))
    const secondHalf = revenues.slice(Math.floor(revenues.length / 2))
    
    const firstHalfAvg = firstHalf.reduce((sum, r) => sum + r, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, r) => sum + r, 0) / secondHalf.length
    
    const monthlyGrowthRate = firstHalfAvg > 0 
      ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 
      : 0

    return {
      monthlyGrowthRate,
      seasonalMultipliers: {},
      predictedRevenue: avgRevenue * (1 + monthlyGrowthRate / 100)
    }

  } catch (error) {
    console.error('Forecasting processing error:', error)
    return getDefaultForecastingData()
  }
}

// Default fallback data
function getDefaultCustomerAnalytics() {
  return {
    segments: { highValue: 0, regular: 0, newCustomers: 0, registered: 0 },
    avgLifetimeValue: 0,
    avgBookingGap: 0,
    topCustomers: []
  }
}

function getDefaultOperationalAnalytics() {
  return {
    avgLeadTime: 0,
    cancellationRate: 0,
    cancellationPatterns: { byTime: {}, byDayOfWeek: {}, byLeadTime: [] },
    serviceEfficiency: []
  }
}

function getDefaultForecastingData() {
  return {
    monthlyGrowthRate: 0,
    seasonalMultipliers: {},
    predictedRevenue: 0
  }
}
