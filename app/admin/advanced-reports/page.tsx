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
      
      const response = await fetch(`/api/analytics/detailed?${params}`)
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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid #ec4899',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{
            fontSize: '1.25rem',
            color: '#6b7280',
            marginBottom: '8px'
          }}>Loading Business Intelligence...</p>
          <p style={{
            fontSize: '0.875rem',
            color: '#9ca3af'
          }}>Analyzing your salon data</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          padding: '48px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '24px'
          }}>📈💥</div>
          <h2 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px'
          }}>Analytics Error</h2>
          <p style={{
            color: '#6b7280',
            marginBottom: '24px',
            lineHeight: '1.6'
          }}>{error}</p>
          <button
            onClick={fetchDetailedAnalytics}
            style={{
              backgroundColor: '#ec4899',
              color: 'white',
              padding: '12px 32px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#db2777'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ec4899'}
          >
            Retry Analysis
          </button>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '48px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
          <p style={{ fontSize: '1.25rem', color: '#6b7280' }}>No analytics data available</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '24px 16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: '8px'
              }}>Advanced Business Intelligence</h1>
              <p style={{
                color: '#6b7280',
                fontSize: '1rem'
              }}>Comprehensive insights for Pandora Beauty Salon</p>
            </div>
            
            {/* Export Summary Button */}
            <button
              onClick={handleExportSummaryReport}
              style={{
                backgroundColor: '#16a34a',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
            >
              📊 Export Full Report
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Controls */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#ec4899'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#ec4899'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
              />
            </div>
            <div style={{ paddingTop: '20px' }}>
              <button
                onClick={fetchDetailedAnalytics}
                style={{
                  backgroundColor: '#ec4899',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#db2777'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ec4899'}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 16px'
        }}>
          <nav style={{
            display: 'flex',
            gap: '32px'
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '16px 4px',
                  borderBottom: activeTab === tab.id ? '2px solid #ec4899' : '2px solid transparent',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  color: activeTab === tab.id ? '#ec4899' : '#6b7280',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = '#374151'
                  }
                }}
                onMouseOut={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = '#6b7280'
                  }
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '32px 16px'
      }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Quick Stats with Export */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              padding: '24px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#111827'
                }}>Overview Metrics</h3>
                <button
                  onClick={handleExportWeeklyTrends}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '0.75rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                >
                  📈 Export Trends CSV
                </button>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
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
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '24px'
              }}>Weekly Revenue Trends</h3>
              <div style={{
                height: '300px',
                display: 'flex',
                alignItems: 'end',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '16px'
              }}>
                // Complete fixed section for the weekly trends chart (around line 630-660)

{analytics.seasonal.weeklyTrends.slice(-12).map((week, index) => {
  const maxRevenue = Math.max(...analytics.seasonal.weeklyTrends.map(w => w.revenue))
  const height = maxRevenue > 0 ? (week.revenue / maxRevenue) * 250 : 0
  
  return (
    <div key={index} style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      cursor: 'pointer'
    }}>
      <div
        style={{
          background: 'linear-gradient(to top, #ec4899, #f472b6)',
          borderRadius: '4px 4px 0 0',
          height: `${height}px`,
          minHeight: '4px',
          width: '24px',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'linear-gradient(to top, #db2777, #ec4899)'
          const tooltip = e.currentTarget.nextElementSibling!.nextElementSibling! as HTMLElement
          if (tooltip) {
            tooltip.style.display = 'block'
          }
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'linear-gradient(to top, #ec4899, #f472b6)'
          const tooltip = e.currentTarget.nextElementSibling!.nextElementSibling! as HTMLElement
          if (tooltip) {
            tooltip.style.display = 'none'
          }
        }}
      />
      <span style={{
        fontSize: '0.625rem',
        color: '#6b7280',
        marginTop: '8px',
        transform: 'rotate(45deg)',
        transformOrigin: 'left'
      }}>
        {new Date(week.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </span>
      <div style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: '8px',
        display: 'none',
        backgroundColor: '#111827',
        color: 'white',
        fontSize: '0.75rem',
        borderRadius: '6px',
        padding: '8px 12px',
        zIndex: 10,
        whiteSpace: 'nowrap'
      }}>
        <div>Revenue: {formatCurrency(week.revenue)}</div>
        <div>Appointments: {week.appointments}</div>
      </div>
    </div>
  )
})}
              </div>
            </div>

            {/* Service Efficiency */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              padding: '24px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827'
                }}>Service Efficiency (Revenue per Hour)</h3>
                <button
                  onClick={handleExportServiceEfficiency}
                  style={{
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '0.75rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Customer Segments with Export */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              padding: '24px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#111827'
                }}>Customer Segments</h3>
                <button
                  onClick={handleExportCustomerSegments}
                  style={{
                    backgroundColor: '#16a34a',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '0.75rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                >
                  👥 Export Segments CSV
                </button>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
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
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px'
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                padding: '24px'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '24px'
                }}>Customer Lifetime Value</h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <ProgressRing 
                      progress={Math.min((analytics.customers.avgLifetimeValue / 100000) * 100, 100)} 
                      size={150}
                      color="#ec4899"
                    />
                    <div style={{ marginTop: '16px' }}>
                      <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: '#111827'
                      }}>
                        {formatCurrency(analytics.customers.avgLifetimeValue)}
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>Average LTV</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                padding: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#111827'
                  }}>Top Customers</h3>
                  <button
                    onClick={handleExportTopCustomers}
                    style={{
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.75rem',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f59e0b'}
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
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '24px'
              }}>Customer Booking Patterns</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '24px'
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '16px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#1e40af'
                  }}>
                    {Math.round(analytics.customers.avgBookingGap)}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#1e40af',
                    fontWeight: '500'
                  }}>Days Between Visits</div>
                </div>
                <div style={{
                  textAlign: 'center',
                  padding: '16px',
                  backgroundColor: '#dcfce7',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#166534'
                  }}>
                    {Math.round((analytics.customers.segments.regular / (analytics.customers.segments.regular + analytics.customers.segments.newCustomers)) * 100)}%
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#166534',
                    fontWeight: '500'
                  }}>Retention Rate</div>
                </div>
                <div style={{
                  textAlign: 'center',
                  padding: '16px',
                  backgroundColor: '#f3e8ff',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#7c2d12'
                  }}>
                    {Math.round((analytics.customers.segments.registered / (analytics.customers.segments.highValue + analytics.customers.segments.regular + analytics.customers.segments.newCustomers)) * 100)}%
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#7c2d12',
                    fontWeight: '500'
                  }}>Registration Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'operations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Operational Metrics */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              padding: '24px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#111827'
                }}>Operational Metrics</h3>
                <button
                  onClick={handleExportCancellationAnalysis}
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '0.75rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                >
                  📉 Export Cancellation Data
                </button>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
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
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px'
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                padding: '24px'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '24px'
                }}>Cancellations by Day</h3>
                <SimpleBarChart
                  data={Object.entries(analytics.operational.cancellationPatterns.byDayOfWeek).map(([day, count]) => ({
                    label: day.slice(0, 3),
                    value: count,
                    color: 'bg-red-500'
                  }))}
                />
              </div>

              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                padding: '24px'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '24px'
                }}>Cancellations by Time</h3>
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
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              padding: '24px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827'
                }}>Service Performance Analysis</h3>
                <button
                  onClick={handleExportServiceEfficiency}
                  style={{
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '0.75rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Forecasting Overview */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              padding: '48px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔮</div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: '16px'
              }}>Revenue Forecasting</h3>
              <p style={{
                color: '#6b7280',
                marginBottom: '32px',
                fontSize: '1rem'
              }}>Advanced predictive analytics for business planning</p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '24px',
                marginTop: '32px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  padding: '24px',
                  borderRadius: '12px'
                }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>Next Month Prediction</h4>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginBottom: '4px'
                  }}>+{Math.round(analytics.forecasting.monthlyGrowthRate)}%</div>
                  <div style={{
                    fontSize: '0.875rem',
                    opacity: 0.9
                  }}>Revenue Growth</div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: 'white',
                  padding: '24px',
                  borderRadius: '12px'
                }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>Predicted Revenue</h4>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginBottom: '4px'
                  }}>{formatCurrency(analytics.forecasting.predictedRevenue)}</div>
                  <div style={{
                    fontSize: '0.875rem',
                    opacity: 0.9
                  }}>Next Month</div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  padding: '24px',
                  borderRadius: '12px'
                }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>Capacity Planning</h4>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    marginBottom: '4px'
                  }}>85%</div>
                  <div style={{
                    fontSize: '0.875rem',
                    opacity: 0.9
                  }}>Optimal Utilization</div>
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '24px'
              }}>AI-Powered Business Recommendations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  borderLeft: '4px solid #3b82f6',
                  paddingLeft: '16px',
                  backgroundColor: '#eff6ff',
                  padding: '16px',
                  borderRadius: '0 8px 8px 0'
                }}>
                  <h4 style={{
                    fontWeight: '600',
                    color: '#1e40af',
                    marginBottom: '4px'
                  }}>Optimize Scheduling</h4>
                  <p style={{ color: '#1e40af', fontSize: '0.875rem' }}>
                    Based on peak hours analysis, consider adding more staff during 2-4 PM slots to reduce wait times
                  </p>
                </div>
                <div style={{
                  borderLeft: '4px solid #16a34a',
                  paddingLeft: '16px',
                  backgroundColor: '#f0fdf4',
                  padding: '16px',
                  borderRadius: '0 8px 8px 0'
                }}>
                  <h4 style={{
                    fontWeight: '600',
                    color: '#166534',
                    marginBottom: '4px'
                  }}>Customer Retention</h4>
                  <p style={{ color: '#166534', fontSize: '0.875rem' }}>
                    Implement loyalty program for customers with 3+ visits to increase retention by an estimated 15%
                  </p>
                </div>
                <div style={{
                  borderLeft: '4px solid #8b5cf6',
                  paddingLeft: '16px',
                  backgroundColor: '#faf5ff',
                  padding: '16px',
                  borderRadius: '0 8px 8px 0'
                }}>
                  <h4 style={{
                    fontWeight: '600',
                    color: '#7c2d12',
                    marginBottom: '4px'
                  }}>Service Optimization</h4>
                  <p style={{ color: '#7c2d12', fontSize: '0.875rem' }}>
                    Focus marketing on high-revenue services with low booking rates to maximize profitability
                  </p>
                </div>
                <div style={{
                  borderLeft: '4px solid #f59e0b',
                  paddingLeft: '16px',
                  backgroundColor: '#fffbeb',
                  padding: '16px',
                  borderRadius: '0 8px 8px 0'
                }}>
                  <h4 style={{
                    fontWeight: '600',
                    color: '#92400e',
                    marginBottom: '4px'
                  }}>Cancellation Reduction</h4>
                  <p style={{ color: '#92400e', fontSize: '0.875rem' }}>
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