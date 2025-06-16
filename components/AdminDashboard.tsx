'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

type DashboardStats = {
  totalAppointments: number
  todayAppointments: number
  pendingAppointments: number
  confirmedAppointments: number
  totalServices: number
  totalProducts: number
  totalStaff: number
  todayRevenue: number
}

type RecentActivity = {
  id: string
  type: 'appointment' | 'booking' | 'service'
  title: string
  description: string
  time: string
  status?: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    totalServices: 0,
    totalProducts: 0,
    totalStaff: 0,
    todayRevenue: 0
  })
  const [recentAppointments, setRecentAppointments] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]

      // Fetch all statistics in parallel
      const [
        appointmentsResult,
        todayAppointmentsResult,
        pendingAppointmentsResult,
        confirmedAppointmentsResult,
        servicesResult,
        productsResult,
        staffResult,
        recentAppointmentsResult
      ] = await Promise.all([
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('appointment_date', today),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'confirmed'),
        supabase.from('services').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('staff').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase
          .from('appointments')
          .select(`
            *,
            service:services(name, price),
            user:profiles(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(8)
      ])

      // Calculate today's revenue
      type TodayAppointment = {
  service: { price: number } | { price: number }[] | null
  appointment_products?: Array<{
    quantity: number
    product: { price: number } | { price: number }[] | null
  }> | null
}

// Calculate today's revenue with proper error handling
const { data: todayAppointments } = await supabase
  .from('appointments')
  .select(`
    service:services(price),
    appointment_products(
      quantity,
      product:products(price)
    )
  `)
  .eq('appointment_date', today)
  .eq('status', 'confirmed')

const todayRevenue = (todayAppointments as TodayAppointment[])?.reduce((total, apt) => {
  // Handle service price - service might be an array or single object
  let servicePrice = 0
  if (apt.service) {
    if (Array.isArray(apt.service)) {
      servicePrice = apt.service[0]?.price || 0
    } else {
      servicePrice = apt.service.price || 0
    }
  }
  
  // Handle product total with proper typing
  const productTotal = apt.appointment_products?.reduce(
    (sum: number, ap) => {
      let productPrice = 0
      if (ap.product) {
        if (Array.isArray(ap.product)) {
          productPrice = ap.product[0]?.price || 0
        } else {
          productPrice = ap.product.price || 0
        }
      }
      return sum + (productPrice * ap.quantity)
    }, 0
  ) || 0
  
  return total + servicePrice + productTotal
}, 0) || 0

      // Update stats
      setStats({
        totalAppointments: appointmentsResult.count || 0,
        todayAppointments: todayAppointmentsResult.count || 0,
        pendingAppointments: pendingAppointmentsResult.count || 0,
        confirmedAppointments: confirmedAppointmentsResult.count || 0,
        totalServices: servicesResult.count || 0,
        totalProducts: productsResult.count || 0,
        totalStaff: staffResult.count || 0,
        todayRevenue
      })
      
      setRecentAppointments(recentAppointmentsResult.data || [])

      // Generate recent activity
      const activities: RecentActivity[] = recentAppointmentsResult.data?.slice(0, 5).map((apt: any) => ({
        id: apt.id,
        type: 'appointment' as const,
        title: `New appointment: ${apt.customer_name}`,
        description: `${apt.service?.name} scheduled for ${format(new Date(apt.appointment_date), 'MMM d')}`,
        time: format(new Date(apt.created_at), 'h:mm a'),
        status: apt.status
      })) || []
      
      setRecentActivity(activities)
      
    } catch (err: any) {
      console.error('Error loading dashboard data:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { backgroundColor: '#dcfce7', color: '#166534' }
      case 'cancelled':
        return { backgroundColor: '#fee2e2', color: '#991b1b' }
      case 'pending':
        return { backgroundColor: '#fef3c7', color: '#92400e' }
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151' }
    }
  }

  const getInsightColor = (type: 'success' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#dcfce7', borderColor: '#16a34a', color: '#166534' }
      case 'warning':
        return { backgroundColor: '#fef3c7', borderColor: '#d97706', color: '#92400e' }
      case 'info':
        return { backgroundColor: '#dbeafe', borderColor: '#2563eb', color: '#1d4ed8' }
      default:
        return { backgroundColor: '#f3f4f6', borderColor: '#6b7280', color: '#374151' }
    }
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
          }}>Admin Dashboard</h2>
          <button
            onClick={loadDashboardData}
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
            Refresh
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

      {/* Main Statistics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#6b7280'
          }}>Total Appointments</h3>
          <p style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#111827'
          }}>{stats.totalAppointments}</p>
        </div>
        
        <div style={{
          backgroundColor: '#dbeafe',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #93c5fd'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#1e40af'
          }}>Today's Appointments</h3>
          <p style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1e40af'
          }}>{stats.todayAppointments}</p>
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
          }}>Pending</h3>
          <p style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#92400e'
          }}>{stats.pendingAppointments}</p>
        </div>

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
          }}>Confirmed</h3>
          <p style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#166534'
          }}>{stats.confirmedAppointments}</p>
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
          }}>Active Services</h3>
          <p style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#6d28d9'
          }}>{stats.totalServices}</p>
        </div>

        <div style={{
          backgroundColor: '#fef7ff',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #f0abfc'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#a21caf'
          }}>Active Products</h3>
          <p style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#a21caf'
          }}>{stats.totalProducts}</p>
        </div>

        <div style={{
          backgroundColor: '#f0fdfa',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #5eead4'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#0f766e'
          }}>Active Staff</h3>
          <p style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#0f766e'
          }}>{stats.totalStaff}</p>
        </div>

        <div style={{
          backgroundColor: '#fefce8',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #facc15'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#a16207'
          }}>Today's Revenue</h3>
          <p style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#a16207'
          }}>{stats.todayRevenue.toFixed(2)}Ks</p>
        </div>
      </div>

      {/* Business Insights */}
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
        }}>Business Insights</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {stats.pendingAppointments > stats.confirmedAppointments && (
            <div style={{
              ...getInsightColor('warning'),
              padding: '12px',
              borderRadius: '8px',
              borderLeft: '4px solid'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                High Pending Appointments
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                You have {stats.pendingAppointments} pending appointments that need confirmation
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '4px', fontStyle: 'italic' }}>
                Actionable: Review and confirm pending appointments
              </div>
            </div>
          )}

          {stats.todayAppointments === 0 ? (
            <div style={{
              ...getInsightColor('info'),
              padding: '12px',
              borderRadius: '8px',
              borderLeft: '4px solid'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                Low Booking Day
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                No appointments scheduled for today
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '4px', fontStyle: 'italic' }}>
                Consider promoting services on social media or sending special offers
              </div>
            </div>
          ) : (
            <div style={{
              ...getInsightColor('success'),
              padding: '12px',
              borderRadius: '8px',
              borderLeft: '4px solid'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                Active Day
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                {stats.todayAppointments} appointments scheduled for today
              </div>
            </div>
          )}

          {stats.totalAppointments > 50 && (
            <div style={{
              ...getInsightColor('success'),
              padding: '12px',
              borderRadius: '8px',
              borderLeft: '4px solid'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                Growing Business
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                Great job! You've reached {stats.totalAppointments} total appointments
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout for Recent Data */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        {/* Recent Appointments */}
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
          }}>Recent Appointments</h3>
          
          {recentAppointments.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px 0',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📅</div>
              <p>No appointments yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentAppointments.slice(0, 5).map((appointment) => (
                <div key={appointment.id} style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontWeight: '500' }}>{appointment.customer_name}</span>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: '500',
                      ...getStatusColor(appointment.status)
                    }}>
                      {appointment.status}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#6b7280'
                  }}>
                    {appointment.service?.name}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#9ca3af'
                  }}>
                    {format(new Date(appointment.appointment_date), 'MMM d')} at {appointment.appointment_time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
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
          }}>Quick Actions</h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
            <button style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
              fontSize: '0.875rem',
              fontWeight: '500'
            }} onClick={() => window.location.href = '/admin/appointments'}>
              📅 Appointments
            </button>
            
            <button style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
              fontSize: '0.875rem',
              fontWeight: '500'
            }} onClick={() => window.location.href = '/admin/services'}>
              ✨ Services
            </button>
            
            <button style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              padding: '16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
              fontSize: '0.875rem',
              fontWeight: '500'
            }} onClick={() => window.location.href = '/admin/staff'}>
              👥 Staff
            </button>
            
            <button style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              padding: '16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
              fontSize: '0.875rem',
              fontWeight: '500'
            }} onClick={() => window.location.href = '/admin/products'}>
              🛍️ Products
            </button>
          </div>
          
          <div style={{
            marginTop: '16px',
            padding: '12px',
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
              💡 Business Tip
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#0369a1'
            }}>
              {stats.pendingAppointments > 5 
                ? "Consider setting up automated appointment confirmations to reduce manual work."
                : stats.todayRevenue === 0
                ? "Promote today's availability on social media to attract walk-in customers."
                : "Your business is running smoothly! Consider expanding your service offerings."
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
