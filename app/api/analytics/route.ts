import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]

    // Revenue Analytics - using direct service relationship
    const { data: revenueData, error: revenueError } = await supabase
      .from('appointments')
      .select(`
        appointment_date,
        appointment_time,
        status,
        services!inner(price),
        appointment_products(
          quantity,
          products(price)
        )
      `)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)
      .eq('status', 'confirmed')

    if (revenueError) {
      console.error('Revenue data error:', revenueError)
      throw new Error(`Failed to fetch revenue data: ${revenueError.message}`)
    }

    // Service Popularity - using direct service relationship
    const { data: serviceData, error: serviceError } = await supabase
      .from('appointments')
      .select(`
        services!inner(id, name, price),
        appointment_date
      `)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)
      .eq('status', 'confirmed')

    if (serviceError) {
      console.error('Service data error:', serviceError)
      throw new Error(`Failed to fetch service data: ${serviceError.message}`)
    }

    // Staff Performance - simplified query since staff relationship might not exist
    const { data: staffData, error: staffError } = await supabase
      .from('appointments')
      .select(`
        staff_id,
        services!inner(price),
        appointment_date,
        status
      `)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)
      .not('staff_id', 'is', null)

    // Get staff details separately to avoid complex joins
    const staffIds = staffData ? [...new Set(staffData.map(a => a.staff_id).filter(Boolean))] : []
    let staffDetails: Record<string, string> = {}
    
    if (staffIds.length > 0) {
      const { data: staffDetailsData } = await supabase
        .from('staff')
        .select('id, full_name')
        .in('id', staffIds)
      
      staffDetails = (staffDetailsData || []).reduce((acc, staff) => {
        acc[staff.id] = staff.full_name
        return acc
      }, {} as Record<string, string>)
    }

    if (staffError) {
      console.error('Staff data error:', staffError)
      // Don't throw error for staff data since it might not exist
    }

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

    // Process Revenue Data - handle direct service relationship
    const dailyRevenue = revenueData?.reduce((acc, appointment) => {
      const date = appointment.appointment_date
      // Handle direct service relationship (single service per appointment)
      let serviceRevenue = 0
      if (appointment.services) {
        const services = appointment.services as any
        if (Array.isArray(services)) {
          serviceRevenue = services.reduce((sum: number, service: any) => sum + (Number(service.price) || 0), 0)
        } else {
          serviceRevenue = Number(services.price) || 0
        }
      }
      
      // Handle appointment products safely
      const productRevenue = appointment.appointment_products?.reduce((sum, ap) => {
        // Handle products - might be single object or array
        let productPrice = 0
        if (ap.products) {
          const products = ap.products as any
          if (Array.isArray(products)) {
            productPrice = products.reduce((productSum: number, product: any) => productSum + (product.price || 0), 0)
          } else {
            productPrice = products.price || 0
          }
        }
        return sum + (ap.quantity * productPrice)
      }, 0) || 0
      
      acc[date] = (acc[date] || 0) + serviceRevenue + productRevenue
      return acc
    }, {} as Record<string, number>) || {}

    // Process Service Popularity - handle direct service relationship
    const servicePopularity = serviceData?.reduce((acc, appointment) => {
      const services = appointment.services as any
      const serviceArray = Array.isArray(services) ? services : (services ? [services] : [])
      
      serviceArray.forEach((service: any) => {
        if (service && service.id && service.name) {
          const serviceId = service.id
          const serviceName = service.name
          acc[serviceId] = {
            name: serviceName,
            count: (acc[serviceId]?.count || 0) + 1,
            revenue: (acc[serviceId]?.revenue || 0) + (service.price || 0)
          }
        }
      })
      return acc
    }, {} as Record<string, { name: string, count: number, revenue: number }>) || {}

    // Process Staff Performance - handle direct service relationship and separate staff details
    const staffPerformance = staffData?.reduce((acc, appointment) => {
      const staffId = appointment.staff_id
      const staffName = staffDetails[staffId] || `Staff ${staffId}`
      if (staffId) {
        let appointmentRevenue = 0
        if (appointment.services) {
          const services = appointment.services as any
          if (Array.isArray(services)) {
            appointmentRevenue = services.reduce((sum: number, service: any) => sum + (Number(service.price) || 0), 0)
          } else {
            appointmentRevenue = Number(services.price) || 0
          }
        }
        
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

    // Process Product Sales - handle products safely
    const productSales = productData?.reduce((acc, ap) => {
      // Handle products - might be single object or array
      const products = ap.products as any
      const productArray = Array.isArray(products) ? products : (products ? [products] : [])
      
      productArray.forEach((product: any) => {
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
    
    // Return more informative error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics data',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}