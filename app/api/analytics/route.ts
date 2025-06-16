import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]

    // Revenue Analytics
    const { data: revenueData, error: revenueError } = await supabase
      .from('appointments')
      .select(`
        appointment_date,
        appointment_time,
        status,
        services(price),
        appointment_products(
          quantity,
          products(price)
        )
      `)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)
      .eq('status', 'confirmed')

    if (revenueError) throw revenueError

    // Service Popularity
    const { data: serviceData, error: serviceError } = await supabase
      .from('appointments')
      .select(`
        services(id, name, price),
        appointment_date
      `)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)
      .eq('status', 'confirmed')

    if (serviceError) throw serviceError

    // Staff Performance
    const { data: staffData, error: staffError } = await supabase
      .from('appointments')
      .select(`
        staff_id,
        staff(full_name),
        services(price),
        appointment_date,
        status
      `)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)
      .not('staff_id', 'is', null)

    if (staffError) throw staffError

    // Customer Analytics
    const { data: customerData, error: customerError } = await supabase
      .from('appointments')
      .select(`
        customer_email,
        appointment_date,
        status,
        user_id
      `)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)

    if (customerError) throw customerError

    // Product Sales
    const { data: productData, error: productError } = await supabase
      .from('appointment_products')
      .select(`
        quantity,
        products(id, name, price),
        appointments!inner(appointment_date, status)
      `)
      .gte('appointments.appointment_date', startDate)
      .lte('appointments.appointment_date', endDate)
      .eq('appointments.status', 'confirmed')

    if (productError) throw productError

    // Time Slot Analytics
    const { data: timeSlotData, error: timeSlotError } = await supabase
      .from('appointments')
      .select(`
        appointment_time,
        appointment_date,
        status
      `)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)

    if (timeSlotError) throw timeSlotError

    // Process Revenue Data
    const dailyRevenue = revenueData?.reduce((acc, appointment) => {
      const date = appointment.appointment_date
      const serviceRevenue = appointment.services?.reduce((sum, service) => sum + (service.price || 0), 0) || 0
      const productRevenue = appointment.appointment_products?.reduce((sum, ap) => {
        const productPrice = ap.products?.reduce((productSum, product) => productSum + (product.price || 0), 0) || 0
        return sum + (ap.quantity * productPrice)
      }, 0) || 0
      
      acc[date] = (acc[date] || 0) + serviceRevenue + productRevenue
      return acc
    }, {} as Record<string, number>) || {}

    // Process Service Popularity
    const servicePopularity = serviceData?.reduce((acc, appointment) => {
      appointment.services?.forEach(service => {
        const serviceId = service.id
        const serviceName = service.name
        if (serviceId && serviceName) {
          acc[serviceId] = {
            name: serviceName,
            count: (acc[serviceId]?.count || 0) + 1,
            revenue: (acc[serviceId]?.revenue || 0) + (service.price || 0)
          }
        }
      })
      return acc
    }, {} as Record<string, { name: string, count: number, revenue: number }>) || {}

    // Process Staff Performance
    const staffPerformance = staffData?.reduce((acc, appointment) => {
      const staffId = appointment.staff_id
      const staffName = appointment.staff?.[0]?.full_name // Take first staff member
      if (staffId && staffName) {
        const appointmentRevenue = appointment.services?.reduce((sum, service) => sum + (service.price || 0), 0) || 0
        acc[staffId] = {
          name: staffName,
          appointments: (acc[staffId]?.appointments || 0) + 1,
          revenue: (acc[staffId]?.revenue || 0) + appointmentRevenue,
          completionRate: appointment.status === 'confirmed' ? 
            ((acc[staffId]?.completedAppointments || 0) + 1) / ((acc[staffId]?.appointments || 0) + 1) * 100 :
            (acc[staffId]?.completedAppointments || 0) / ((acc[staffId]?.appointments || 0) + 1) * 100,
          completedAppointments: appointment.status === 'confirmed' ? 
            (acc[staffId]?.completedAppointments || 0) + 1 : 
            (acc[staffId]?.completedAppointments || 0)
        }
      }
      return acc
    }, {} as Record<string, { name: string, appointments: number, revenue: number, completionRate: number, completedAppointments: number }>) || {}

    // Process Customer Retention
    const customerRetention = customerData?.reduce((acc, appointment) => {
      const email = appointment.customer_email || appointment.user_id
      if (email) {
        acc[email] = (acc[email] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>) || {}

    const newCustomers = Object.values(customerRetention).filter(count => count === 1).length
    const returningCustomers = Object.values(customerRetention).filter(count => count > 1).length
    const totalCustomers = Object.keys(customerRetention).length

    // Process Product Sales
    const productSales = productData?.reduce((acc, ap) => {
      ap.products?.forEach(product => {
        const productId = product.id
        const productName = product.name
        if (productId && productName) {
          acc[productId] = {
            name: productName,
            quantity: (acc[productId]?.quantity || 0) + ap.quantity,
            revenue: (acc[productId]?.revenue || 0) + (ap.quantity * (product.price || 0))
          }
        }
      })
      return acc
    }, {} as Record<string, { name: string, quantity: number, revenue: number }>) || {}

    // Process Peak Hours
    const peakHours = timeSlotData?.reduce((acc, appointment) => {
      const time = appointment.appointment_time
      if (time && appointment.status === 'confirmed') {
        acc[time] = (acc[time] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>) || {}

    // Calculate summary metrics
    const totalRevenue = Object.values(dailyRevenue).reduce((sum, revenue) => sum + revenue, 0)
    const totalAppointments = revenueData?.length || 0
    const averageOrderValue = totalAppointments > 0 ? totalRevenue / totalAppointments : 0

    const analytics = {
      summary: {
        totalRevenue,
        totalAppointments,
        averageOrderValue,
        totalCustomers,
        newCustomers,
        returningCustomers,
        retentionRate: totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0
      },
      dailyRevenue: Object.entries(dailyRevenue).map(([date, revenue]) => ({
        date,
        revenue
      })).sort((a, b) => a.date.localeCompare(b.date)),
      servicePopularity: Object.values(servicePopularity)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      staffPerformance: Object.values(staffPerformance)
        .sort((a, b) => b.revenue - a.revenue),
      productSales: Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
      peakHours: Object.entries(peakHours)
        .map(([time, count]) => ({ time, count }))
        .sort((a, b) => b.count - a.count),
      customerRetention: {
        newCustomers,
        returningCustomers,
        totalCustomers,
        retentionRate: totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0
      }
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}