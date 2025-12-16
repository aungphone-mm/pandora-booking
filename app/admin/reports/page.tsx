'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

type RevenueData = {
  date: string
  revenue: number
  appointments: number
}

type ServiceData = {
  name: string
  count: number
  revenue: number
}

type StaffData = {
  name: string
  appointments: number
  revenue: number
  completionRate: number
}

type DashboardStats = {
  totalRevenue: number
  totalAppointments: number
  averageOrderValue: number
  confirmedAppointments: number
  pendingAppointments: number
  cancelledAppointments: number
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
}

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalAppointments: 0,
    averageOrderValue: 0,
    confirmedAppointments: 0,
    pendingAppointments: 0,
    cancelledAppointments: 0,
    totalCustomers: 0,
    newCustomers: 0,
    returningCustomers: 0
  })

  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [serviceData, setServiceData] = useState<ServiceData[]>([])
  const [staffData, setStaffData] = useState<StaffData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  })

  const supabase = createClient()

  useEffect(() => {
    loadReportsData()
  }, [dateRange])

  const loadReportsData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load appointments with related data
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          service:services(name, price),
          appointment_products(
            quantity,
            product:products(name, price)
          )
        `)
        .gte('appointment_date', dateRange.startDate)
        .lte('appointment_date', dateRange.endDate)
        .order('appointment_date', { ascending: true })

      if (appointmentsError) throw appointmentsError

      // Load staff data
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id, full_name')
        .eq('is_active', true)

      if (staffError) throw staffError

      // Process the data
      processReportsData(appointments || [], staff || [])

    } catch (err: any) {
      console.error('Error loading reports data:', err)
      setError(err.message || 'Failed to load reports data')
    } finally {
      setLoading(false)
    }
  }

  const processReportsData = (appointments: any[], staff: any[]) => {
    // Calculate basic stats
    const totalAppointments = appointments.length
    const confirmedAppointments = appointments.filter(a => a.status === 'confirmed').length
    const pendingAppointments = appointments.filter(a => a.status === 'pending').length
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length

    // Calculate revenue
    let totalRevenue = 0
    const dailyRevenue: { [key: string]: { revenue: number, appointments: number } } = {}

    appointments.forEach(appointment => {
      if (appointment.status === 'confirmed') {
        // Service revenue
        const serviceRevenue = appointment.service?.price || 0

        // Product revenue
        const productRevenue = appointment.appointment_products?.reduce((sum: number, ap: any) => {
          return sum + (ap.quantity * (ap.product?.price || 0))
        }, 0) || 0

        const appointmentRevenue = serviceRevenue + productRevenue
        totalRevenue += appointmentRevenue

        // Daily revenue tracking
        const date = appointment.appointment_date
        if (!dailyRevenue[date]) {
          dailyRevenue[date] = { revenue: 0, appointments: 0 }
        }
        dailyRevenue[date].revenue += appointmentRevenue
        dailyRevenue[date].appointments += 1
      }
    })

    // Calculate customers
    const uniqueCustomers = new Set()
    const customerAppointments: { [key: string]: number } = {}

    appointments.forEach(appointment => {
      const customerId = appointment.customer_email || appointment.user_id || appointment.customer_phone
      if (customerId) {
        uniqueCustomers.add(customerId)
        customerAppointments[customerId] = (customerAppointments[customerId] || 0) + 1
      }
    })

    const totalCustomers = uniqueCustomers.size
    const newCustomers = Object.values(customerAppointments).filter(count => count === 1).length
    const returningCustomers = totalCustomers - newCustomers

    // Process service popularity
    const serviceStats: { [key: string]: { count: number, revenue: number } } = {}
    appointments.forEach(appointment => {
      if (appointment.status === 'confirmed' && appointment.service) {
        const serviceName = appointment.service.name
        if (!serviceStats[serviceName]) {
          serviceStats[serviceName] = { count: 0, revenue: 0 }
        }
        serviceStats[serviceName].count += 1
        serviceStats[serviceName].revenue += appointment.service.price || 0
      }
    })

    // Process staff performance
    const staffStats: { [key: string]: { appointments: number, revenue: number, completed: number } } = {}
    appointments.forEach(appointment => {
      if (appointment.staff_id) {
        const staffMember = staff.find(s => s.id === appointment.staff_id)
        if (staffMember) {
          const staffName = staffMember.full_name
          if (!staffStats[staffName]) {
            staffStats[staffName] = { appointments: 0, revenue: 0, completed: 0 }
          }
          staffStats[staffName].appointments += 1
          if (appointment.status === 'confirmed') {
            staffStats[staffName].completed += 1
            staffStats[staffName].revenue += appointment.service?.price || 0
          }
        }
      }
    })

    // Set processed data
    setStats({
      totalRevenue,
      totalAppointments,
      averageOrderValue: confirmedAppointments > 0 ? totalRevenue / confirmedAppointments : 0,
      confirmedAppointments,
      pendingAppointments,
      cancelledAppointments,
      totalCustomers,
      newCustomers,
      returningCustomers
    })

    setRevenueData(
      Object.entries(dailyRevenue)
        .map(([date, data]) => ({
          date,
          revenue: data.revenue,
          appointments: data.appointments
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    )

    setServiceData(
      Object.entries(serviceStats)
        .map(([name, data]) => ({
          name,
          count: data.count,
          revenue: data.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
    )

    setStaffData(
      Object.entries(staffStats)
        .map(([name, data]) => ({
          name,
          appointments: data.appointments,
          revenue: data.revenue,
          completionRate: data.appointments > 0 ? (data.completed / data.appointments) * 100 : 0
        }))
        .sort((a, b) => b.revenue - a.revenue)
    )
  }

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header.toLowerCase().replace(' ', '')]
        return typeof value === 'string' ? `"${value}"` : value
      }).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  const handleExportSummary = () => {
    const summaryData = [{
      'Total Revenue': stats.totalRevenue,
      'Total Appointments': stats.totalAppointments,
      'Confirmed': stats.confirmedAppointments,
      'Pending': stats.pendingAppointments,
      'Cancelled': stats.cancelledAppointments,
      'Average Order Value': stats.averageOrderValue,
      'Total Customers': stats.totalCustomers,
      'New Customers': stats.newCustomers,
      'Returning Customers': stats.returningCustomers,
      'Date Range': `${dateRange.startDate} to ${dateRange.endDate}`
    }]

    exportToCSV(summaryData, 'business_summary', [
      'Total Revenue', 'Total Appointments', 'Confirmed', 'Pending', 'Cancelled',
      'Average Order Value', 'Total Customers', 'New Customers', 'Returning Customers', 'Date Range'
    ])
  }

  const handleExportRevenue = () => {
    exportToCSV(revenueData, 'daily_revenue', ['Date', 'Revenue', 'Appointments'])
  }

  const handleExportServices = () => {
    exportToCSV(serviceData, 'service_performance', ['Name', 'Count', 'Revenue'])
  }

  const handleExportStaff = () => {
    exportToCSV(staffData, 'staff_performance', ['Name', 'Appointments', 'Revenue', 'Completion Rate'])
  }

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()}Ks`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-[300px]">
          <div className="w-8 h-8 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Business Intelligence Reports</h2>
          <button
            onClick={loadReportsData}
            className="bg-pink-600 text-white px-4 py-3 rounded hover:bg-pink-700 font-semibold transition-colors"
          >
            Refresh Data
          </button>
        </div>

        <div className="text-sm text-gray-600">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Date Range & Export</h3>

        <div className="grid grid-cols-[auto_auto_auto_1fr] gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-600"
            />
          </div>

          <button
            onClick={loadReportsData}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 font-semibold transition-colors"
          >
            Apply Filter
          </button>

          <div className="flex gap-2 justify-end">
            <button
              onClick={handleExportSummary}
              className="bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 font-semibold text-sm transition-colors"
            >
              📊 Export Summary CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <div className="bg-green-100 p-4 rounded-lg border border-green-400">
          <h3 className="text-sm font-medium text-green-800">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-800">{formatCurrency(stats.totalRevenue)}</p>
        </div>

        <div className="bg-blue-100 p-4 rounded-lg border border-blue-400">
          <h3 className="text-sm font-medium text-blue-900">Total Appointments</h3>
          <p className="text-2xl font-bold text-blue-900">{stats.totalAppointments}</p>
        </div>

        <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-400">
          <h3 className="text-sm font-medium text-yellow-900">Avg Order Value</h3>
          <p className="text-2xl font-bold text-yellow-900">{formatCurrency(stats.averageOrderValue)}</p>
        </div>

        <div className="bg-purple-100 p-4 rounded-lg border border-purple-300">
          <h3 className="text-sm font-medium text-purple-900">Total Customers</h3>
          <p className="text-2xl font-bold text-purple-900">{stats.totalCustomers}</p>
        </div>
      </div>

      {/* Appointment Status Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Appointment Status Breakdown</h3>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
          <div className="bg-green-100 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-800">{stats.confirmedAppointments}</div>
            <div className="text-sm text-green-800">Confirmed</div>
          </div>

          <div className="bg-yellow-100 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-yellow-900">{stats.pendingAppointments}</div>
            <div className="text-sm text-yellow-900">Pending</div>
          </div>

          <div className="bg-red-100 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-red-800">{stats.cancelledAppointments}</div>
            <div className="text-sm text-red-800">Cancelled</div>
          </div>
        </div>
      </div>

      {/* Revenue Trend & Service Performance */}
      <div className="grid grid-cols-2 gap-6">
        {/* Daily Revenue */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Daily Revenue Trend</h3>
            <button
              onClick={handleExportRevenue}
              className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-xs font-semibold transition-colors"
            >
              📈 Export CSV
            </button>
          </div>

          {revenueData.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <div className="text-3xl mb-2">📊</div>
              <p>No revenue data for selected period</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {revenueData.slice(-7).map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {format(new Date(item.date), 'MMM d')}
                  </span>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {formatCurrency(item.revenue)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {item.appointments} appointments
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Services */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Top Services</h3>
            <button
              onClick={handleExportServices}
              className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-xs font-semibold transition-colors"
            >
              ✨ Export CSV
            </button>
          </div>

          {serviceData.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <div className="text-3xl mb-2">✨</div>
              <p>No service data for selected period</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {serviceData.slice(0, 5).map((service, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{service.name}</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(service.revenue)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {service.count} bookings
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Staff Performance & Customer Insights */}
      <div className="grid grid-cols-2 gap-6">
        {/* Staff Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Staff Performance</h3>
            <button
              onClick={handleExportStaff}
              className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-xs font-semibold transition-colors"
            >
              👥 Export CSV
            </button>
          </div>

          {staffData.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <div className="text-3xl mb-2">👥</div>
              <p>No staff data for selected period</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {staffData.slice(0, 5).map((staff, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{staff.name}</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(staff.revenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{staff.appointments} appointments</span>
                    <span>{Math.round(staff.completionRate)}% completion</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Insights */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Customer Insights</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-800">{stats.newCustomers}</div>
              <div className="text-sm text-green-800">New Customers</div>
            </div>

            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-900">{stats.returningCustomers}</div>
              <div className="text-sm text-blue-900">Returning Customers</div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-sky-50 rounded-lg border border-sky-200">
            <div className="text-sm font-medium text-sky-800 mb-1">
              📊 Retention Rate
            </div>
            <div className="text-xl font-bold text-sky-800">
              {stats.totalCustomers > 0
                ? Math.round((stats.returningCustomers / stats.totalCustomers) * 100)
                : 0
              }%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
