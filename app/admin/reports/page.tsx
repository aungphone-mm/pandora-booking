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
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '300px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '2px solid #ec4899',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>Business Intelligence Reports</h2>
          <button
            onClick={loadReportsData}
            style={{
              backgroundColor: '#ec4899',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Refresh Data
          </button>
        </div>
        
        <div style={{
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <p style={{ color: '#b91c1c', fontWeight: '500' }}>{error}</p>
        </div>
      )}

      {/* Date Range Filter */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '24px'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          marginBottom: '16px'
        }}>Date Range & Export</h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto auto auto 1fr',
          gap: '16px',
          alignItems: 'end'
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
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none'
              }}
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
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
          </div>

          <button
            onClick={loadReportsData}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Apply Filter
          </button>

          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={handleExportSummary}
              style={{
                backgroundColor: '#16a34a',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}
            >
              📊 Export Summary CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          backgroundColor: '#dcfce7',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #4ade80'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#166534'
          }}>Total Revenue</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#166534'
          }}>{formatCurrency(stats.totalRevenue)}</p>
        </div>

        <div style={{
          backgroundColor: '#dbeafe',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #60a5fa'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#1e40af'
          }}>Total Appointments</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1e40af'
          }}>{stats.totalAppointments}</p>
        </div>

        <div style={{
          backgroundColor: '#fef3c7',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #fbbf24'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#92400e'
          }}>Avg Order Value</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#92400e'
          }}>{formatCurrency(stats.averageOrderValue)}</p>
        </div>

        <div style={{
          backgroundColor: '#ede9fe',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #c4b5fd'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#6d28d9'
          }}>Total Customers</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#6d28d9'
          }}>{stats.totalCustomers}</p>
        </div>
      </div>

      {/* Appointment Status Breakdown */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '24px'
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          marginBottom: '16px'
        }}>Appointment Status Breakdown</h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            backgroundColor: '#dcfce7',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#166534'
            }}>{stats.confirmedAppointments}</div>
            <div style={{
              fontSize: '0.875rem',
              color: '#166534'
            }}>Confirmed</div>
          </div>
          
          <div style={{
            backgroundColor: '#fef3c7',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#92400e'
            }}>{stats.pendingAppointments}</div>
            <div style={{
              fontSize: '0.875rem',
              color: '#92400e'
            }}>Pending</div>
          </div>
          
          <div style={{
            backgroundColor: '#fee2e2',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#991b1b'
            }}>{stats.cancelledAppointments}</div>
            <div style={{
              fontSize: '0.875rem',
              color: '#991b1b'
            }}>Cancelled</div>
          </div>
        </div>
      </div>

      {/* Revenue Trend & Service Performance */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        {/* Daily Revenue */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold'
            }}>Daily Revenue Trend</h3>
            <button
              onClick={handleExportRevenue}
              style={{
                backgroundColor: '#16a34a',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}
            >
              📈 Export CSV
            </button>
          </div>
          
          {revenueData.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px 0',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
              <p>No revenue data for selected period</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {revenueData.slice(-7).map((item, index) => (
                <div key={index} style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                    {format(new Date(item.date), 'MMM d')}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#059669' }}>
                      {formatCurrency(item.revenue)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {item.appointments} appointments
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Services */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold'
            }}>Top Services</h3>
            <button
              onClick={handleExportServices}
              style={{
                backgroundColor: '#16a34a',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}
            >
              ✨ Export CSV
            </button>
          </div>
          
          {serviceData.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px 0',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✨</div>
              <p>No service data for selected period</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {serviceData.slice(0, 5).map((service, index) => (
                <div key={index} style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '4px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontWeight: '500' }}>{service.name}</span>
                    <span style={{ fontWeight: 'bold', color: '#059669' }}>
                      {formatCurrency(service.revenue)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    {service.count} bookings
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Staff Performance & Customer Insights */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        {/* Staff Performance */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold'
            }}>Staff Performance</h3>
            <button
              onClick={handleExportStaff}
              style={{
                backgroundColor: '#16a34a',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}
            >
              👥 Export CSV
            </button>
          </div>
          
          {staffData.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px 0',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
              <p>No staff data for selected period</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {staffData.slice(0, 5).map((staff, index) => (
                <div key={index} style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '4px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontWeight: '500' }}>{staff.name}</span>
                    <span style={{ fontWeight: 'bold', color: '#059669' }}>
                      {formatCurrency(staff.revenue)}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: '#6b7280'
                  }}>
                    <span>{staff.appointments} appointments</span>
                    <span>{Math.round(staff.completionRate)}% completion</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Insights */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>Customer Insights</h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            <div style={{
              backgroundColor: '#dcfce7',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#166534'
              }}>{stats.newCustomers}</div>
              <div style={{
                fontSize: '0.875rem',
                color: '#166534'
              }}>New Customers</div>
            </div>
            
            <div style={{
              backgroundColor: '#dbeafe',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1e40af'
              }}>{stats.returningCustomers}</div>
              <div style={{
                fontSize: '0.875rem',
                color: '#1e40af'
              }}>Returning Customers</div>
            </div>
          </div>

          <div style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #bae6fd'
          }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#0369a1',
              marginBottom: '4px'
            }}>
              📊 Retention Rate
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#0369a1'
            }}>
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
