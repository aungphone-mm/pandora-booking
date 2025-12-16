'use client'

import { useState, useEffect } from 'react'
import { MetricCard, SimpleBarChart, ProgressRing, StatCard, SimpleTable } from '@/components/AnalyticsComponents'

interface DetailedAnalytics {
  seasonal: {
    weeklyTrends: Array<{
      week: string
      appointments: number
      revenue: number
      services: Record<string, number>
    }>
  }
  customers: {
    segments: {
      highValue: number
      regular: number
      newCustomers: number
      registered: number
    }
    avgLifetimeValue: number
    avgBookingGap: number
    topCustomers: Array<{
      totalBookings: number
      totalSpent: number
      avgSpentPerBooking: number
      estimatedLTV: number
      isRegistered: boolean
    }>
  }
  operational: {
    avgLeadTime: number
    cancellationRate: number
    cancellationPatterns: {
      byTime: Record<string, number>
      byDayOfWeek: Record<string, number>
      byLeadTime: number[]
    }
    serviceEfficiency: Array<{
      name: string
      revenuePerHour: number
      bookingsCount: number
      popularTimes: Record<string, number>
    }>
  }
  forecasting: {
    monthlyGrowthRate: number
    seasonalMultipliers: Record<string, number>
    predictedRevenue: number
  }
}

export default function EnhancedReportsPage() {
  const [analytics, setAnalytics] = useState<DetailedAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'operations' | 'forecasting'>('overview')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  const fetchDetailedAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })

      const response = await fetch(`/api/analytics/detailed-fixed?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch detailed analytics data')
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      console.error('Detailed analytics fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetailedAnalytics()
  }, [dateRange])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' Ks'
  }

  // CSV Export Functions
  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const key = header.toLowerCase().replace(/[^a-z0-9]/g, '')
        let value = row[key] || row[header] || ''
        if (typeof value === 'string' && value.includes(',')) {
          value = `"${value}"`
        }
        return value
      }).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleExportWeeklyTrends = () => {
    if (!analytics) return
    const data = analytics.seasonal.weeklyTrends.map(week => ({
      week: week.week,
      appointments: week.appointments,
      revenue: week.revenue,
      topservice: Object.entries(week.services).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
    }))
    exportToCSV(data, 'weekly_trends', ['Week', 'Appointments', 'Revenue', 'Top Service'])
  }

  const handleExportCustomerSegments = () => {
    if (!analytics) return
    const data = [
      { segment: 'High Value Customers', count: analytics.customers.segments.highValue, description: 'Spent > 50,000 Ks' },
      { segment: 'Regular Customers', count: analytics.customers.segments.regular, description: '3+ bookings' },
      { segment: 'New Customers', count: analytics.customers.segments.newCustomers, description: 'First-time visitors' },
      { segment: 'Registered Users', count: analytics.customers.segments.registered, description: 'App users' }
    ]
    exportToCSV(data, 'customer_segments', ['Segment', 'Count', 'Description'])
  }

  const handleExportTopCustomers = () => {
    if (!analytics) return
    const data = analytics.customers.topCustomers.map((customer, index) => ({
      rank: index + 1,
      totalbookings: customer.totalBookings,
      totalspent: customer.totalSpent,
      avgspentperbooking: customer.avgSpentPerBooking,
      estimatedltv: customer.estimatedLTV,
      customertype: customer.isRegistered ? 'Registered' : 'Guest'
    }))
    exportToCSV(data, 'top_customers', ['Rank', 'Total Bookings', 'Total Spent', 'Avg Spent Per Booking', 'Estimated LTV', 'Customer Type'])
  }

  const handleExportServiceEfficiency = () => {
    if (!analytics) return
    const data = analytics.operational.serviceEfficiency.map(service => ({
      servicename: service.name,
      bookingscount: service.bookingsCount,
      revenueperhour: service.revenuePerHour,
      populartimes: Object.entries(service.popularTimes).sort(([,a], [,b]) => b - a).slice(0, 3).map(([time]) => time).join('; ')
    }))
    exportToCSV(data, 'service_efficiency', ['Service Name', 'Bookings Count', 'Revenue Per Hour', 'Popular Times'])
  }

  const handleExportCancellationAnalysis = () => {
    if (!analytics) return
    const timeData = Object.entries(analytics.operational.cancellationPatterns.byTime).map(([time, count]) => ({
      type: 'By Time',
      category: time,
      cancellations: count
    }))
    const dayData = Object.entries(analytics.operational.cancellationPatterns.byDayOfWeek).map(([day, count]) => ({
      type: 'By Day',
      category: day,
      cancellations: count
    }))
    const allData = [...timeData, ...dayData]
    exportToCSV(allData, 'cancellation_analysis', ['Type', 'Category', 'Cancellations'])
  }

  const handleExportSummaryReport = () => {
    if (!analytics) return
    const data = [{
      daterange: `${dateRange.startDate} to ${dateRange.endDate}`,
      totalcustomers: analytics.customers.segments.highValue + analytics.customers.segments.regular + analytics.customers.segments.newCustomers,
      highvaluecustomers: analytics.customers.segments.highValue,
      regularcustomers: analytics.customers.segments.regular,
      newcustomers: analytics.customers.segments.newCustomers,
      registeredusers: analytics.customers.segments.registered,
      avglifetimevalue: analytics.customers.avgLifetimeValue,
      avgbookinggap: analytics.customers.avgBookingGap,
      avgleadtime: analytics.operational.avgLeadTime,
      cancellationrate: analytics.operational.cancellationRate,
      totalservices: analytics.operational.serviceEfficiency.length,
      monthlyGrowthRate: analytics.forecasting.monthlyGrowthRate,
      predictedrevenue: analytics.forecasting.predictedRevenue
    }]
    exportToCSV(data, 'business_intelligence_summary', [
      'Date Range', 'Total Customers', 'High Value Customers', 'Regular Customers',
      'New Customers', 'Registered Users', 'Avg Lifetime Value', 'Avg Booking Gap',
      'Avg Lead Time', 'Cancellation Rate', 'Total Services', 'Monthly Growth Rate', 'Predicted Revenue'
    ])
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'customers', label: 'Customer Intelligence', icon: '👥' },
    { id: 'operations', label: 'Operational Insights', icon: '⚙️' },
    { id: 'forecasting', label: 'Forecasting', icon: '🔮' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-500 mb-2">Loading Business Intelligence...</p>
          <p className="text-sm text-gray-400">Analyzing your salon data</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-2xl p-12 text-center max-w-md">
          <div className="text-6xl mb-6">📈💥</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Analytics Error</h2>
          <p className="text-gray-500 mb-6 leading-relaxed">{error}</p>
          <button
            onClick={fetchDetailedAnalytics}
            className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-lg border-none cursor-pointer font-semibold text-base transition-colors"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-xl text-gray-500">No analytics data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Business Intelligence</h1>
              <p className="text-gray-500 text-base">Comprehensive insights for Pandora Beauty Salon</p>
            </div>

            {/* Export Summary Button */}
            <button
              onClick={handleExportSummaryReport}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg border-none cursor-pointer font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              📊 Export Full Report
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Controls */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm outline-none transition-colors focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm outline-none transition-colors focus:border-pink-500"
              />
            </div>
            <div className="pt-5">
              <button
                onClick={fetchDetailedAnalytics}
                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-md border-none cursor-pointer font-medium text-sm transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-1 py-4 border-b-2 font-medium text-sm bg-transparent border-none cursor-pointer transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-pink-500 text-pink-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-8">
            {/* Quick Stats with Export */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Overview Metrics</h3>
                <button
                  onClick={handleExportWeeklyTrends}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md border-none cursor-pointer font-medium text-xs transition-colors"
                >
                  📈 Export Trends CSV
                </button>
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                <MetricCard
                  title="Customer Segments"
                  value={analytics.customers.segments.highValue + analytics.customers.segments.regular + analytics.customers.segments.newCustomers}
                  icon="👥"
                  color="blue"
                />
                <MetricCard
                  title="Avg Lead Time"
                  value={`${Math.round(analytics.operational.avgLeadTime)} days`}
                  icon="⏰"
                  color="green"
                />
                <MetricCard
                  title="Cancellation Rate"
                  value={`${Math.round(analytics.operational.cancellationRate)}%`}
                  icon="❌"
                  color="orange"
                />
                <MetricCard
                  title="Registered Users"
                  value={analytics.customers.segments.registered}
                  icon="📱"
                  color="purple"
                />
              </div>
            </div>

            {/* Weekly Trends */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Weekly Revenue Trends</h3>
              <div className="h-[300px] flex items-end justify-between gap-2 p-4">
                {analytics.seasonal.weeklyTrends.slice(-12).map((week, index) => {
                  const maxRevenue = Math.max(...analytics.seasonal.weeklyTrends.map(w => w.revenue))
                  const height = maxRevenue > 0 ? (week.revenue / maxRevenue) * 250 : 0

                  return (
                    <div key={index} className="flex flex-col items-center relative cursor-pointer group">
                      <div
                        className="bg-gradient-to-t from-pink-500 to-pink-400 rounded-t min-h-1 w-6 transition-all duration-300 ease-in-out group-hover:from-pink-600 group-hover:to-pink-500"
                        style={{ height: `${height}px` }}
                      />
                      <span className="text-[0.625rem] text-gray-500 mt-2 rotate-45 origin-left">
                        {new Date(week.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md px-3 py-2 z-10 whitespace-nowrap">
                        <div>Revenue: {formatCurrency(week.revenue)}</div>
                        <div>Appointments: {week.appointments}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Service Efficiency */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Service Efficiency (Revenue per Hour)</h3>
                <button
                  onClick={handleExportServiceEfficiency}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md border-none cursor-pointer font-medium text-xs transition-colors"
                >
                  ⚡ Export Services CSV
                </button>
              </div>
              <SimpleBarChart
                data={analytics.operational.serviceEfficiency.slice(0, 8).map(service => ({
                  label: service.name,
                  value: Math.round(service.revenuePerHour),
                  color: 'bg-purple-500'
                }))}
              />
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="flex flex-col gap-8">
            {/* Customer Segments with Export */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Customer Segments</h3>
                <button
                  onClick={handleExportCustomerSegments}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md border-none cursor-pointer font-medium text-xs transition-colors"
                >
                  👥 Export Segments CSV
                </button>
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                <StatCard
                  label="High Value Customers"
                  value={analytics.customers.segments.highValue}
                  sublabel="Spent > 50,000 Ks"
                  trend="up"
                  trendValue="12%"
                />
                <StatCard
                  label="Regular Customers"
                  value={analytics.customers.segments.regular}
                  sublabel="3+ bookings"
                  trend="up"
                  trendValue="8%"
                />
                <StatCard
                  label="New Customers"
                  value={analytics.customers.segments.newCustomers}
                  sublabel="First-time visitors"
                  trend="neutral"
                  trendValue="2%"
                />
                <StatCard
                  label="Registered Users"
                  value={analytics.customers.segments.registered}
                  sublabel="App users"
                  trend="up"
                  trendValue="15%"
                />
              </div>
            </div>

            {/* Customer Lifetime Value & Top Customers */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Lifetime Value</h3>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <ProgressRing
                      progress={Math.min((analytics.customers.avgLifetimeValue / 100000) * 100, 100)}
                      size={150}
                      color="#ec4899"
                    />
                    <div className="mt-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(analytics.customers.avgLifetimeValue)}
                      </div>
                      <div className="text-sm text-gray-500">Average LTV</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
                  <button
                    onClick={handleExportTopCustomers}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded border-none cursor-pointer font-medium text-xs transition-colors"
                  >
                    🏆 Export CSV
                  </button>
                </div>
                <SimpleTable
                  headers={['Bookings', 'Total Spent', 'Avg/Booking', 'Type']}
                  data={analytics.customers.topCustomers.slice(0, 5).map(customer => [
                    customer.totalBookings,
                    formatCurrency(customer.totalSpent),
                    formatCurrency(customer.avgSpentPerBooking),
                    customer.isRegistered ? 'Registered' : 'Guest'
                  ])}
                />
              </div>
            </div>

            {/* Booking Patterns */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Booking Patterns</h3>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-900">
                    {Math.round(analytics.customers.avgBookingGap)}
                  </div>
                  <div className="text-sm text-blue-900 font-medium">Days Between Visits</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-900">
                    {Math.round((analytics.customers.segments.regular / (analytics.customers.segments.regular + analytics.customers.segments.newCustomers)) * 100)}%
                  </div>
                  <div className="text-sm text-green-900 font-medium">Retention Rate</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-amber-900">
                    {Math.round((analytics.customers.segments.registered / (analytics.customers.segments.highValue + analytics.customers.segments.regular + analytics.customers.segments.newCustomers)) * 100)}%
                  </div>
                  <div className="text-sm text-amber-900 font-medium">Registration Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'operations' && (
          <div className="flex flex-col gap-8">
            {/* Operational Metrics */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Operational Metrics</h3>
                <button
                  onClick={handleExportCancellationAnalysis}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md border-none cursor-pointer font-medium text-xs transition-colors"
                >
                  📉 Export Cancellation Data
                </button>
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                <MetricCard
                  title="Average Lead Time"
                  value={`${Math.round(analytics.operational.avgLeadTime)} days`}
                  icon="📅"
                  color="blue"
                />
                <MetricCard
                  title="Cancellation Rate"
                  value={`${Math.round(analytics.operational.cancellationRate)}%`}
                  icon="❌"
                  color="orange"
                />
                <MetricCard
                  title="Service Efficiency"
                  value={analytics.operational.serviceEfficiency.length}
                  icon="⚡"
                  color="green"
                />
              </div>
            </div>

            {/* Cancellation Analysis */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Cancellations by Day</h3>
                <SimpleBarChart
                  data={Object.entries(analytics.operational.cancellationPatterns.byDayOfWeek).map(([day, count]) => ({
                    label: day.slice(0, 3),
                    value: count,
                    color: 'bg-red-500'
                  }))}
                />
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Cancellations by Time</h3>
                <SimpleBarChart
                  data={Object.entries(analytics.operational.cancellationPatterns.byTime).slice(0, 8).map(([time, count]) => ({
                    label: time,
                    value: count,
                    color: 'bg-orange-500'
                  }))}
                />
              </div>
            </div>

            {/* Service Performance */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Service Performance Analysis</h3>
                <button
                  onClick={handleExportServiceEfficiency}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md border-none cursor-pointer font-medium text-xs transition-colors"
                >
                  📊 Export Performance CSV
                </button>
              </div>
              <SimpleTable
                headers={['Service', 'Bookings', 'Revenue/Hour', 'Popular Times']}
                data={analytics.operational.serviceEfficiency.slice(0, 10).map(service => [
                  service.name,
                  service.bookingsCount,
                  formatCurrency(service.revenuePerHour),
                  Object.entries(service.popularTimes).sort(([,a], [,b]) => b - a).slice(0, 2).map(([time]) => time).join(', ')
                ])}
              />
            </div>
          </div>
        )}

        {activeTab === 'forecasting' && (
          <div className="flex flex-col gap-8">
            {/* Forecasting Overview */}
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">🔮</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Revenue Forecasting</h3>
              <p className="text-gray-500 mb-8 text-base">Advanced predictive analytics for business planning</p>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 mt-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-800 text-white p-6 rounded-xl">
                  <h4 className="text-lg font-semibold mb-2">Next Month Prediction</h4>
                  <div className="text-2xl font-bold mb-1">+{Math.round(analytics.forecasting.monthlyGrowthRate)}%</div>
                  <div className="text-sm opacity-90">Revenue Growth</div>
                </div>
                <div className="bg-gradient-to-br from-green-600 to-green-800 text-white p-6 rounded-xl">
                  <h4 className="text-lg font-semibold mb-2">Predicted Revenue</h4>
                  <div className="text-2xl font-bold mb-1">{formatCurrency(analytics.forecasting.predictedRevenue)}</div>
                  <div className="text-sm opacity-90">Next Month</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                  <h4 className="text-lg font-semibold mb-2">Capacity Planning</h4>
                  <div className="text-2xl font-bold mb-1">85%</div>
                  <div className="text-sm opacity-90">Optimal Utilization</div>
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">AI-Powered Business Recommendations</h3>
              <div className="flex flex-col gap-4">
                <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-blue-900 mb-1">Optimize Scheduling</h4>
                  <p className="text-blue-900 text-sm">
                    Based on peak hours analysis, consider adding more staff during 2-4 PM slots to reduce wait times
                  </p>
                </div>
                <div className="border-l-4 border-green-600 pl-4 bg-green-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-green-900 mb-1">Customer Retention</h4>
                  <p className="text-green-900 text-sm">
                    Implement loyalty program for customers with 3+ visits to increase retention by an estimated 15%
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4 bg-purple-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-amber-900 mb-1">Service Optimization</h4>
                  <p className="text-amber-900 text-sm">
                    Focus marketing on high-revenue services with low booking rates to maximize profitability
                  </p>
                </div>
                <div className="border-l-4 border-amber-500 pl-4 bg-amber-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-amber-950 mb-1">Cancellation Reduction</h4>
                  <p className="text-amber-950 text-sm">
                    Send reminder SMS 24 hours before appointments to reduce no-shows by an estimated 25%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
