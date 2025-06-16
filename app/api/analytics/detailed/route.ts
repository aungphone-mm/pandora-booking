import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]

    // Seasonal Trends (Week over Week)
    const { data: seasonalData, error: seasonalError } = await supabase
      .from('appointments')
      .select(`
        appointment_date,
        appointment_time,
        status,
        services(price, name, category_id),
        created_at
      `)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)

    if (seasonalError) throw seasonalError

    // Customer Demographics & Behavior
    const { data: customerBehavior, error: customerError } = await supabase
      .from('appointments')
      .select(`
        customer_email,
        customer_phone,
        appointment_date,
        appointment_time,
        status,
        services(duration, price, name),
        user_id,
        created_at
      `)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)

    if (customerError) throw customerError

    // Booking Lead Time Analysis
    const { data: leadTimeData, error: leadTimeError } = await supabase
      .from('appointments')
      .select(`
        appointment_date,
        created_at,
        status
      `)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)

    if (leadTimeError) throw leadTimeError

    // Cancellation Analysis
    const { data: cancellationData, error: cancellationError } = await supabase
      .from('appointments')
      .select(`
        appointment_date,
        appointment_time,
        status,
        services(name, duration),
        created_at
      `)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)
      .in('status', ['cancelled', 'no_show'])

    if (cancellationError) throw cancellationError

    // Service Duration vs Booking Patterns
    const { data: durationData, error: durationError } = await supabase
      .from('appointments')
      .select(`
        appointment_time,
        services(duration, name, price),
        appointment_date,
        status
      `)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)
      .eq('status', 'confirmed')

    if (durationError) throw durationError

    // Revenue Forecasting Data
    const { data: forecastData, error: forecastError } = await supabase
      .from('appointments')
      .select(`
        appointment_date,
        services(price),
        appointment_products(quantity, products(price)),
        status
      `)
      .gte('appointment_date', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .lte('appointment_date', endDate)

    if (forecastError) throw forecastError

    // Process Seasonal Trends
    const weeklyTrends = seasonalData?.reduce((acc, appointment) => {
      const week = new Date(appointment.appointment_date).toISOString().slice(0, 10)
      const weekStart = new Date(appointment.appointment_date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekKey = weekStart.toISOString().slice(0, 10)
      
      if (!acc[weekKey]) {
        acc[weekKey] = {
          appointments: 0,
          revenue: 0,
          services: {}
        }
      }
      
      acc[weekKey].appointments += 1
      
      // Sum all service prices for this appointment
      const serviceRevenue = appointment.services?.reduce((sum, service) => sum + (service.price || 0), 0) || 0
      acc[weekKey].revenue += serviceRevenue
      
      // Count all services for this appointment
      appointment.services?.forEach(service => {
        if (service.name) {
          acc[weekKey].services[service.name] = (acc[weekKey].services[service.name] || 0) + 1
        }
      })
      
      return acc
    }, {} as Record<string, { appointments: number, revenue: number, services: Record<string, number> }>) || {}

    // Process Customer Behavior
    const customerSegments = customerBehavior?.reduce((acc, appointment) => {
      const email = appointment.customer_email || appointment.user_id || 'anonymous'
      
      if (!acc[email]) {
        acc[email] = {
          totalBookings: 0,
          totalSpent: 0,
          avgBookingGap: 0,
          preferredTimes: {},
          preferredServices: {},
          lastBooking: appointment.appointment_date,
          firstBooking: appointment.appointment_date,
          isRegistered: !!appointment.user_id
        }
      }
      
      acc[email].totalBookings += 1
      
      // Sum all service prices for this appointment
      const appointmentTotal = appointment.services?.reduce((sum, service) => sum + (service.price || 0), 0) || 0
      acc[email].totalSpent += appointmentTotal
      
      // Track preferred times
      const time = appointment.appointment_time
      if (time) {
        acc[email].preferredTimes[time] = (acc[email].preferredTimes[time] || 0) + 1
      }
      
      // Track preferred services
      appointment.services?.forEach(service => {
        if (service.name) {
          acc[email].preferredServices[service.name] = (acc[email].preferredServices[service.name] || 0) + 1
        }
      })
      
      // Update booking dates
      if (appointment.appointment_date > acc[email].lastBooking) {
        acc[email].lastBooking = appointment.appointment_date
      }
      if (appointment.appointment_date < acc[email].firstBooking) {
        acc[email].firstBooking = appointment.appointment_date
      }
      
      return acc
    }, {} as Record<string, any>) || {}

    // Process Lead Time Analysis
    const leadTimeAnalysis = leadTimeData?.map(appointment => {
      const bookingDate = new Date(appointment.created_at)
      const appointmentDate = new Date(appointment.appointment_date)
      const leadDays = Math.ceil((appointmentDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24))
      return {
        leadDays,
        status: appointment.status,
        appointmentDate: appointment.appointment_date
      }
    }).filter(item => item.leadDays >= 0) || []

    const avgLeadTime = leadTimeAnalysis.length > 0 
      ? leadTimeAnalysis.reduce((sum, item) => sum + item.leadDays, 0) / leadTimeAnalysis.length 
      : 0

    // Process Cancellation Patterns
    const cancellationPatterns = {
      byTime: cancellationData?.reduce((acc, appointment) => {
        const time = appointment.appointment_time
        if (time) {
          acc[time] = (acc[time] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>) || {},
      
      byDayOfWeek: cancellationData?.reduce((acc, appointment) => {
        const dayOfWeek = new Date(appointment.appointment_date).getDay()
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const dayName = dayNames[dayOfWeek]
        acc[dayName] = (acc[dayName] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {},
      
      byLeadTime: cancellationData?.map(appointment => {
        const bookingDate = new Date(appointment.created_at)
        const appointmentDate = new Date(appointment.appointment_date)
        const leadDays = Math.ceil((appointmentDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24))
        return leadDays
      }).filter(days => days >= 0) || []
    }

    // Customer Lifetime Value
    const customerLTV = Object.values(customerSegments).map((customer: any) => {
      const daysBetweenFirstAndLast = customer.totalBookings > 1 
        ? Math.ceil((new Date(customer.lastBooking).getTime() - new Date(customer.firstBooking).getTime()) / (1000 * 60 * 60 * 24))
        : 0
      
      const avgBookingGap = daysBetweenFirstAndLast > 0 && customer.totalBookings > 1 
        ? daysBetweenFirstAndLast / (customer.totalBookings - 1) 
        : 0
      
      return {
        ...customer,
        avgBookingGap,
        avgSpentPerBooking: customer.totalBookings > 0 ? customer.totalSpent / customer.totalBookings : 0,
        estimatedLTV: avgBookingGap > 0 ? (customer.totalSpent / customer.totalBookings) * (365 / avgBookingGap) : customer.totalSpent
      }
    })

    // Service Efficiency Analysis
    const serviceEfficiency = durationData?.reduce((acc, appointment) => {
      const time = appointment.appointment_time
      
      appointment.services?.forEach(service => {
        const serviceName = service.name
        const duration = service.duration
        const price = service.price
        
        if (serviceName && duration && price) {
          if (!acc[serviceName]) {
            acc[serviceName] = {
              name: serviceName,
              avgDuration: duration,
              avgPrice: price,
              bookingsCount: 0,
              revenuePerHour: 0,
              popularTimes: {}
            }
          }
          
          acc[serviceName].bookingsCount += 1
          if (time) {
            acc[serviceName].popularTimes[time] = (acc[serviceName].popularTimes[time] || 0) + 1
          }
          
          // Calculate revenue per hour
          acc[serviceName].revenuePerHour = (price / duration) * 60
        }
      })
      
      return acc
    }, {} as Record<string, any>) || {}

    const detailedAnalytics = {
      seasonal: {
        weeklyTrends: Object.entries(weeklyTrends).map(([week, data]) => ({
          week,
          ...data
        })).sort((a, b) => a.week.localeCompare(b.week))
      },
      customers: {
        segments: {
          highValue: customerLTV.filter((c: any) => c.totalSpent > 50000).length,
          regular: customerLTV.filter((c: any) => c.totalBookings >= 3 && c.totalSpent <= 50000).length,
          newCustomers: customerLTV.filter((c: any) => c.totalBookings === 1).length,
          registered: customerLTV.filter((c: any) => c.isRegistered).length
        },
        avgLifetimeValue: customerLTV.length > 0 
          ? customerLTV.reduce((sum: number, c: any) => sum + c.estimatedLTV, 0) / customerLTV.length 
          : 0,
        avgBookingGap: customerLTV.length > 0 
          ? customerLTV.reduce((sum: number, c: any) => sum + c.avgBookingGap, 0) / customerLTV.length 
          : 0,
        topCustomers: customerLTV
          .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
          .slice(0, 10)
      },
      operational: {
        avgLeadTime,
        cancellationRate: cancellationData?.length && seasonalData?.length 
          ? (cancellationData.length / seasonalData.length) * 100 
          : 0,
        cancellationPatterns,
        serviceEfficiency: Object.values(serviceEfficiency)
          .sort((a: any, b: any) => b.revenuePerHour - a.revenuePerHour)
      },
      forecasting: {
        monthlyGrowthRate: 0, // Would need more complex calculation
        seasonalMultipliers: {}, // Would need year-over-year data
        predictedRevenue: 0 // Would need ML model
      }
    }

    return NextResponse.json(detailedAnalytics)

  } catch (error) {
    console.error('Detailed analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch detailed analytics data' },
      { status: 500 }
    )
  }
}