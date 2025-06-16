import { createClient } from '@/lib/supabase/server'

export interface AnalyticsTimeframe {
  startDate: string
  endDate: string
}

export interface RevenueMetrics {
  totalRevenue: number
  averageOrderValue: number
  growthRate: number
  dailyAverage: number
}

export interface CustomerMetrics {
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  retentionRate: number
  averageLifetimeValue: number
}

export interface OperationalMetrics {
  totalAppointments: number
  completionRate: number
  averageLeadTime: number
  cancellationRate: number
  utilization: number
}

export interface ServicePerformance {
  serviceId: string
  serviceName: string
  bookings: number
  revenue: number
  averageRating?: number
  revenuePerHour: number
}

export interface StaffPerformance {
  staffId: string
  staffName: string
  appointments: number
  revenue: number
  completionRate: number
  efficiency: number
}

export class AnalyticsEngine {
  private supabase = createClient()

  async getRevenueMetrics(timeframe: AnalyticsTimeframe): Promise<RevenueMetrics> {
    const { data: appointments, error } = await this.supabase
      .from('appointments')
      .select(`
        appointment_date,
        services(price),
        appointment_products(quantity, products(price)),
        status
      `)
      .gte('appointment_date', timeframe.startDate)
      .lte('appointment_date', timeframe.endDate)
      .eq('status', 'confirmed')

    if (error) throw error

    let totalRevenue = 0
    let totalAppointments = 0

    appointments?.forEach(appointment => {
      const serviceRevenue = appointment.services?.reduce((sum, service) => sum + (service.price || 0), 0) || 0
      const productRevenue = appointment.appointment_products?.reduce((sum, ap) => {
        const productPrice = ap.products?.reduce((productSum, product) => productSum + (product.price || 0), 0) || 0
        return sum + (ap.quantity * productPrice)
      }, 0) || 0
      
      totalRevenue += serviceRevenue + productRevenue
      totalAppointments++
    })

    const averageOrderValue = totalAppointments > 0 ? totalRevenue / totalAppointments : 0
    const daysDiff = Math.ceil((new Date(timeframe.endDate).getTime() - new Date(timeframe.startDate).getTime()) / (1000 * 60 * 60 * 24))
    const dailyAverage = daysDiff > 0 ? totalRevenue / daysDiff : 0

    // Calculate growth rate (would need previous period data)
    const growthRate = 0 // Placeholder

    return {
      totalRevenue,
      averageOrderValue,
      growthRate,
      dailyAverage
    }
  }

  async getCustomerMetrics(timeframe: AnalyticsTimeframe): Promise<CustomerMetrics> {
    const { data: appointments, error } = await this.supabase
      .from('appointments')
      .select(`
        customer_email,
        user_id,
        appointment_date,
        services(price),
        appointment_products(quantity, products(price))
      `)
      .gte('appointment_date', timeframe.startDate)
      .lte('appointment_date', timeframe.endDate)

    if (error) throw error

    const customerData = new Map<string, {
      bookings: number
      totalSpent: number
      firstBooking: string
    }>()

    appointments?.forEach(appointment => {
      const customerId = appointment.customer_email || appointment.user_id || 'anonymous'
      const serviceRevenue = appointment.services?.reduce((sum, service) => sum + (service.price || 0), 0) || 0
      const productRevenue = appointment.appointment_products?.reduce((sum, ap) => {
        const productPrice = ap.products?.reduce((productSum, product) => productSum + (product.price || 0), 0) || 0
        return sum + (ap.quantity * productPrice)
      }, 0) || 0
      
      const totalSpent = serviceRevenue + productRevenue

      if (!customerData.has(customerId)) {
        customerData.set(customerId, {
          bookings: 0,
          totalSpent: 0,
          firstBooking: appointment.appointment_date
        })
      }

      const customer = customerData.get(customerId)!
      customer.bookings++
      customer.totalSpent += totalSpent
      
      if (appointment.appointment_date < customer.firstBooking) {
        customer.firstBooking = appointment.appointment_date
      }
    })

    const totalCustomers = customerData.size
    const newCustomers = Array.from(customerData.values()).filter(c => c.bookings === 1).length
    const returningCustomers = totalCustomers - newCustomers
    const retentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0
    const averageLifetimeValue = totalCustomers > 0 
      ? Array.from(customerData.values()).reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers 
      : 0

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      retentionRate,
      averageLifetimeValue
    }
  }

  async getOperationalMetrics(timeframe: AnalyticsTimeframe): Promise<OperationalMetrics> {
    const { data: appointments, error } = await this.supabase
      .from('appointments')
      .select(`
        appointment_date,
        status,
        created_at
      `)
      .gte('appointment_date', timeframe.startDate)
      .lte('appointment_date', timeframe.endDate)

    if (error) throw error

    const totalAppointments = appointments?.length || 0
    const confirmedAppointments = appointments?.filter(a => a.status === 'confirmed').length || 0
    const cancelledAppointments = appointments?.filter(a => ['cancelled', 'no_show'].includes(a.status)).length || 0
    
    const completionRate = totalAppointments > 0 ? (confirmedAppointments / totalAppointments) * 100 : 0
    const cancellationRate = totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0

    // Calculate average lead time
    const leadTimes = appointments?.map(appointment => {
      const bookingDate = new Date(appointment.created_at)
      const appointmentDate = new Date(appointment.appointment_date)
      return Math.ceil((appointmentDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24))
    }).filter(days => days >= 0) || []

    const averageLeadTime = leadTimes.length > 0 
      ? leadTimes.reduce((sum, days) => sum + days, 0) / leadTimes.length 
      : 0

    // Calculate utilization (would need time slot data)
    const utilization = 75 // Placeholder

    return {
      totalAppointments,
      completionRate,
      averageLeadTime,
      cancellationRate,
      utilization
    }
  }

  async getServicePerformance(timeframe: AnalyticsTimeframe): Promise<ServicePerformance[]> {
    const { data: appointments, error } = await this.supabase
      .from('appointments')
      .select(`
        services(id, name, price, duration),
        status
      `)
      .gte('appointment_date', timeframe.startDate)
      .lte('appointment_date', timeframe.endDate)
      .eq('status', 'confirmed')

    if (error) throw error

    const servicePerformance = new Map<string, {
      serviceId: string
      serviceName: string
      bookings: number
      revenue: number
      duration: number
    }>()

    appointments?.forEach(appointment => {
      appointment.services?.forEach(service => {
        if (service) {
          const key = service.id
          if (!servicePerformance.has(key)) {
            servicePerformance.set(key, {
              serviceId: service.id,
              serviceName: service.name,
              bookings: 0,
              revenue: 0,
              duration: service.duration || 60
            })
          }

          const perf = servicePerformance.get(key)!
          perf.bookings++
          perf.revenue += service.price || 0
        }
      })
    })

    return Array.from(servicePerformance.values()).map(perf => ({
      serviceId: perf.serviceId,
      serviceName: perf.serviceName,
      bookings: perf.bookings,
      revenue: perf.revenue,
      revenuePerHour: (perf.revenue / perf.bookings) / (perf.duration / 60)
    })).sort((a, b) => b.revenue - a.revenue)
  }

  async getStaffPerformance(timeframe: AnalyticsTimeframe): Promise<StaffPerformance[]> {
    const { data: appointments, error } = await this.supabase
      .from('appointments')
      .select(`
        staff_id,
        staff(full_name),
        services(price),
        status
      `)
      .gte('appointment_date', timeframe.startDate)
      .lte('appointment_date', timeframe.endDate)
      .not('staff_id', 'is', null)

    if (error) throw error

    const staffPerformance = new Map<string, {
      staffId: string
      staffName: string
      totalAppointments: number
      confirmedAppointments: number
      revenue: number
    }>()

    appointments?.forEach(appointment => {
      if (appointment.staff_id && appointment.staff?.[0]) {
        const key = appointment.staff_id
        if (!staffPerformance.has(key)) {
          staffPerformance.set(key, {
            staffId: appointment.staff_id,
            staffName: appointment.staff[0].full_name,
            totalAppointments: 0,
            confirmedAppointments: 0,
            revenue: 0
          })
        }

        const perf = staffPerformance.get(key)!
        perf.totalAppointments++
        if (appointment.status === 'confirmed') {
          perf.confirmedAppointments++
          const appointmentRevenue = appointment.services?.reduce((sum, service) => sum + (service.price || 0), 0) || 0
          perf.revenue += appointmentRevenue
        }
      }
    })

    return Array.from(staffPerformance.values()).map(perf => ({
      staffId: perf.staffId,
      staffName: perf.staffName,
      appointments: perf.totalAppointments,
      revenue: perf.revenue,
      completionRate: perf.totalAppointments > 0 ? (perf.confirmedAppointments / perf.totalAppointments) * 100 : 0,
      efficiency: perf.confirmedAppointments > 0 ? perf.revenue / perf.confirmedAppointments : 0
    })).sort((a, b) => b.revenue - a.revenue)
  }

  async exportAnalyticsData(timeframe: AnalyticsTimeframe, format: 'csv' | 'json' = 'csv'): Promise<string> {
    const [revenue, customers, operational, services, staff] = await Promise.all([
      this.getRevenueMetrics(timeframe),
      this.getCustomerMetrics(timeframe),
      this.getOperationalMetrics(timeframe),
      this.getServicePerformance(timeframe),
      this.getStaffPerformance(timeframe)
    ])

    const analyticsData = {
      timeframe,
      generatedAt: new Date().toISOString(),
      revenue,
      customers,
      operational,
      services,
      staff
    }

    if (format === 'json') {
      return JSON.stringify(analyticsData, null, 2)
    }

    // Convert to CSV format
    let csv = 'Pandora Beauty Salon - Analytics Report\n'
    csv += `Generated: ${new Date().toLocaleString()}\n`
    csv += `Period: ${timeframe.startDate} to ${timeframe.endDate}\n\n`
    
    csv += 'REVENUE METRICS\n'
    csv += 'Metric,Value\n'
    csv += `Total Revenue,${revenue.totalRevenue}\n`
    csv += `Average Order Value,${revenue.averageOrderValue}\n`
    csv += `Daily Average,${revenue.dailyAverage}\n\n`
    
    csv += 'CUSTOMER METRICS\n'
    csv += 'Metric,Value\n'
    csv += `Total Customers,${customers.totalCustomers}\n`
    csv += `New Customers,${customers.newCustomers}\n`
    csv += `Returning Customers,${customers.returningCustomers}\n`
    csv += `Retention Rate,${customers.retentionRate}%\n\n`
    
    csv += 'SERVICE PERFORMANCE\n'
    csv += 'Service,Bookings,Revenue,Revenue per Hour\n'
    services.forEach(service => {
      csv += `${service.serviceName},${service.bookings},${service.revenue},${service.revenuePerHour}\n`
    })
    
    return csv
  }

  // Real-time analytics for dashboard widgets
  async getDashboardSummary(): Promise<{
    todaysRevenue: number
    todaysAppointments: number
    pendingAppointments: number
    utilizationRate: number
  }> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data: todaysAppointments, error } = await this.supabase
      .from('appointments')
      .select(`
        services(price),
        appointment_products(quantity, products(price)),
        status
      `)
      .eq('appointment_date', today)

    if (error) throw error

    let todaysRevenue = 0
    let confirmedToday = 0
    let pendingToday = 0

    todaysAppointments?.forEach(appointment => {
      const serviceRevenue = appointment.services?.reduce((sum, service) => sum + (service.price || 0), 0) || 0
      const productRevenue = appointment.appointment_products?.reduce((sum, ap) => {
        const productPrice = ap.products?.reduce((productSum, product) => productSum + (product.price || 0), 0) || 0
        return sum + (ap.quantity * productPrice)
      }, 0) || 0
      
      if (appointment.status === 'confirmed') {
        todaysRevenue += serviceRevenue + productRevenue
        confirmedToday++
      } else if (appointment.status === 'pending') {
        pendingToday++
      }
    })

    // Calculate utilization (simplified)
    const totalSlots = 40 // Assume 8 hours * 5 slots per hour
    const utilizationRate = totalSlots > 0 ? (confirmedToday / totalSlots) * 100 : 0

    return {
      todaysRevenue,
      todaysAppointments: confirmedToday,
      pendingAppointments: pendingToday,
      utilizationRate
    }
  }
}