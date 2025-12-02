'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import MonthlyCalendarView from './MonthlyCalendarView'

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
    
    // Add CSS animations with mobile responsiveness
    const style = document.createElement('style')
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(-10px); }
        to { opacity: 1; transform: translateX(0); }
      }
      .fade-in {
        animation: fadeIn 0.5s ease-out;
      }
      .slide-in {
        animation: slideIn 0.3s ease-out;
      }
      .hover-scale {
        transition: all 0.2s ease-in-out;
      }
      .hover-scale:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      }
      .button-primary {
        transition: all 0.2s ease-in-out;
        position: relative;
        overflow: hidden;
      }
      .button-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(236, 72, 153, 0.3);
      }
      .button-primary:active {
        transform: translateY(0);
      }
      .stat-card {
        transition: all 0.3s ease-in-out;
        position: relative;
        overflow: hidden;
      }
      .stat-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
      }
      .stat-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
        transition: left 0.5s;
      }
      .stat-card:hover::before {
        left: 100%;
      }
      .quick-action-btn {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }
      .quick-action-btn:hover {
        transform: translateY(-2px) scale(1.02);
        filter: brightness(1.1);
      }
      .quick-action-btn:active {
        transform: translateY(0) scale(0.98);
      }
      .insight-card {
        transition: all 0.3s ease-in-out;
        position: relative;
      }
      .insight-card:hover {
        transform: translateX(5px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      }
      .appointment-item {
        transition: all 0.2s ease-in-out;
      }
      .appointment-item:hover {
        background-color: #f8fafc !important;
        transform: translateX(3px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
      }

      /* Mobile Responsive Styles */
      @media (max-width: 768px) {
        .stats-grid {
          grid-template-columns: 1fr 1fr !important;
          gap: 16px !important;
        }
        
        .two-column-grid {
          grid-template-columns: 1fr !important;
          gap: 24px !important;
        }
        
        .quick-actions-grid {
          grid-template-columns: 1fr 1fr !important;
          gap: 12px !important;
        }
        
        .hover-scale:hover {
          transform: none !important;
        }
        
        .stat-card:hover {
          transform: none !important;
        }
        
        .insight-card:hover {
          transform: none !important;
        }
        
        .appointment-item:hover {
          transform: none !important;
        }
      }

      @media (max-width: 480px) {
        .stats-grid {
          grid-template-columns: 1fr !important;
          gap: 12px !important;
        }
        
        .header-content {
          flex-direction: column !important;
          gap: 16px !important;
          text-align: center !important;
        }
        
        .header-title {
          font-size: 1.75rem !important;
        }
        
        .header-subtitle {
          font-size: 0.9rem !important;
        }
        
        .dashboard-stat-title {
          font-size: 2rem !important;
        }
        
        .dashboard-card-padding {
          padding: 20px !important;
        }
        
        .dashboard-header-padding {
          padding: 24px !important;
        }
      }
    `
    document.head.appendChild(style)
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
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
        return { 
          backgroundColor: '#dcfce7', 
          color: '#166534',
          border: '1px solid #bbf7d0'
        }
      case 'cancelled':
        return { 
          backgroundColor: '#fee2e2', 
          color: '#991b1b',
          border: '1px solid #fecaca'
        }
      case 'pending':
        return { 
          backgroundColor: '#fef3c7', 
          color: '#92400e',
          border: '1px solid #fde68a'
        }
      default:
        return { 
          backgroundColor: '#f3f4f6', 
          color: '#374151',
          border: '1px solid #e5e7eb'
        }
    }
  }

  const getInsightColor = (type: 'success' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return { 
          backgroundColor: '#ecfdf5', 
          borderColor: '#10b981', 
          color: '#047857',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
        }
      case 'warning':
        return { 
          backgroundColor: '#fffbeb', 
          borderColor: '#f59e0b', 
          color: '#92400e',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
        }
      case 'info':
        return { 
          backgroundColor: '#eff6ff', 
          borderColor: '#3b82f6', 
          color: '#1e40af',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
        }
      default:
        return { 
          backgroundColor: '#f9fafb', 
          borderColor: '#6b7280', 
          color: '#374151',
          boxShadow: '0 4px 12px rgba(107, 114, 128, 0.15)'
        }
    }
  }

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        padding: '48px',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-block',
          width: '48px',
          height: '48px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #ec4899',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }}></div>
        <p style={{
          color: '#6b7280',
          fontSize: '1.1rem',
          fontWeight: '500'
        }}>Loading dashboard data...</p>
      </div>
    )
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '32px',
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    }} className="fade-in">
      
      {/* Enhanced Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        boxShadow: '0 15px 35px rgba(102, 126, 234, 0.3)',
        padding: '32px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }} className="hover-scale dashboard-header-padding">
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}></div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          position: 'relative',
          zIndex: 1
        }} className="header-content">
          <div>
            <h2 style={{
              fontSize: '2.25rem',
              fontWeight: '700',
              margin: '0',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }} className="header-title">Welcome Back! 👋</h2>
            <p style={{
              fontSize: '1.1rem',
              margin: '8px 0 0 0',
              opacity: '0.9'
            }} className="header-subtitle">Here's what's happening at Pandora Beauty Salon today</p>
          </div>
          <button
            onClick={loadDashboardData}
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              boxShadow: '0 6px 20px rgba(236, 72, 153, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            className="button-primary"
          >
            🔄 Refresh Data
          </button>
        </div>
        
        <div style={{
          fontSize: '1rem',
          opacity: '0.8',
          position: 'relative',
          zIndex: 1
        }}>
          📅 {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </div>

      {error && (
        <div style={{
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          border: '1px solid #f87171',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 25px rgba(248, 113, 113, 0.2)'
        }} className="slide-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <p style={{ 
              color: '#b91c1c', 
              fontWeight: '600',
              margin: '0',
              fontSize: '1.1rem'
            }}>{error}</p>
          </div>
        </div>
      )}

      {/* Enhanced Statistics Grid - Mobile Responsive */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px'
      }} className="stats-grid">
        {/* Total Appointments */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          padding: '28px',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
          position: 'relative'
        }} className="stat-card dashboard-card-padding">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#64748b',
                margin: '0 0 8px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>📊 Total Appointments</h3>
              <p style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: '#1e293b',
                margin: '0',
                lineHeight: '1'
              }} className="dashboard-stat-title">{stats.totalAppointments}</p>
            </div>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>📋</div>
          </div>
        </div>
        
        {/* Today's Appointments */}
        <div style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)',
          padding: '28px',
          borderRadius: '20px',
          border: '1px solid #93c5fd',
          boxShadow: '0 8px 25px rgba(59, 130, 246, 0.2)',
          position: 'relative'
        }} className="stat-card dashboard-card-padding">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#1e40af',
                margin: '0 0 8px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>📅 Today's Appointments</h3>
              <p style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: '#1e40af',
                margin: '0',
                lineHeight: '1'
              }} className="dashboard-stat-title">{stats.todayAppointments}</p>
            </div>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>🗓️</div>
          </div>
        </div>

        {/* Pending */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)',
          padding: '28px',
          borderRadius: '20px',
          border: '1px solid #fbbf24',
          boxShadow: '0 8px 25px rgba(251, 191, 36, 0.2)',
          position: 'relative'
        }} className="stat-card dashboard-card-padding">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#92400e',
                margin: '0 0 8px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>⏳ Pending</h3>
              <p style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: '#92400e',
                margin: '0',
                lineHeight: '1'
              }} className="dashboard-stat-title">{stats.pendingAppointments}</p>
            </div>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>⏰</div>
          </div>
        </div>

        {/* Confirmed */}
        <div style={{
          background: 'linear-gradient(135deg, #dcfce7 0%, #4ade80 100%)',
          padding: '28px',
          borderRadius: '20px',
          border: '1px solid #4ade80',
          boxShadow: '0 8px 25px rgba(74, 222, 128, 0.2)',
          position: 'relative'
        }} className="stat-card dashboard-card-padding">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#166534',
                margin: '0 0 8px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>✅ Confirmed</h3>
              <p style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: '#166534',
                margin: '0',
                lineHeight: '1'
              }} className="dashboard-stat-title">{stats.confirmedAppointments}</p>
            </div>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>✔️</div>
          </div>
        </div>

        {/* Active Services */}
        <div style={{
          background: 'linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)',
          padding: '28px',
          borderRadius: '20px',
          border: '1px solid #c4b5fd',
          boxShadow: '0 8px 25px rgba(196, 181, 253, 0.2)',
          position: 'relative'
        }} className="stat-card dashboard-card-padding">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#6d28d9',
                margin: '0 0 8px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>✨ Active Services</h3>
              <p style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: '#6d28d9',
                margin: '0',
                lineHeight: '1'
              }} className="dashboard-stat-title">{stats.totalServices}</p>
            </div>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>💅</div>
          </div>
        </div>

        {/* Active Products */}
        <div style={{
          background: 'linear-gradient(135deg, #fdf2f8 0%, #f0abfc 100%)',
          padding: '28px',
          borderRadius: '20px',
          border: '1px solid #f0abfc',
          boxShadow: '0 8px 25px rgba(240, 171, 252, 0.2)',
          position: 'relative'
        }} className="stat-card dashboard-card-padding">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#a21caf',
                margin: '0 0 8px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>🛍️ Active Products</h3>
              <p style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: '#a21caf',
                margin: '0',
                lineHeight: '1'
              }} className="dashboard-stat-title">{stats.totalProducts}</p>
            </div>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #d946ef 0%, #c026d3 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>🎁</div>
          </div>
        </div>

        {/* Active Staff */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdfa 0%, #5eead4 100%)',
          padding: '28px',
          borderRadius: '20px',
          border: '1px solid #5eead4',
          boxShadow: '0 8px 25px rgba(94, 234, 212, 0.2)',
          position: 'relative'
        }} className="stat-card dashboard-card-padding">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#0f766e',
                margin: '0 0 8px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>👥 Active Staff</h3>
              <p style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: '#0f766e',
                margin: '0',
                lineHeight: '1'
              }} className="dashboard-stat-title">{stats.totalStaff}</p>
            </div>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>👨‍💼</div>
          </div>
        </div>

        {/* Today's Revenue */}
        <div style={{
          background: 'linear-gradient(135deg, #fefce8 0%, #facc15 100%)',
          padding: '28px',
          borderRadius: '20px',
          border: '1px solid #facc15',
          boxShadow: '0 8px 25px rgba(250, 204, 21, 0.2)',
          position: 'relative'
        }} className="stat-card dashboard-card-padding">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#a16207',
                margin: '0 0 8px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>💰 Today's Revenue</h3>
              <p style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: '#a16207',
                margin: '0',
                lineHeight: '1'
              }} className="dashboard-stat-title">{stats.todayRevenue.toLocaleString()}Ks</p>
            </div>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>💵</div>
          </div>
        </div>
      </div>

      {/* Enhanced Business Insights */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
        padding: '32px',
        border: '1px solid #f1f5f9'
      }} className="hover-scale dashboard-card-padding">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem'
          }}>🔍</div>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            margin: '0',
            color: '#1e293b'
          }}>Business Insights</h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {stats.pendingAppointments > stats.confirmedAppointments && (
            <div style={{
              ...getInsightColor('warning'),
              padding: '20px',
              borderRadius: '16px',
              borderLeft: '6px solid',
              position: 'relative'
            }} className="insight-card">
              <div style={{ 
                fontWeight: '700', 
                marginBottom: '8px',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ⚠️ High Pending Appointments
              </div>
              <div style={{ fontSize: '1rem', lineHeight: '1.5', marginBottom: '8px' }}>
                You have <strong>{stats.pendingAppointments}</strong> pending appointments that need confirmation
              </div>
              <div style={{ 
                fontSize: '0.85rem', 
                fontStyle: 'italic',
                padding: '8px 16px',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                💡 <strong>Action:</strong> Review and confirm pending appointments to improve customer satisfaction
              </div>
            </div>
          )}

          {stats.todayAppointments === 0 ? (
            <div style={{
              ...getInsightColor('info'),
              padding: '20px',
              borderRadius: '16px',
              borderLeft: '6px solid',
              position: 'relative'
            }} className="insight-card">
              <div style={{ 
                fontWeight: '700', 
                marginBottom: '8px',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📢 Opportunity Day
              </div>
              <div style={{ fontSize: '1rem', lineHeight: '1.5', marginBottom: '8px' }}>
                No appointments scheduled for today - perfect time for marketing!
              </div>
              <div style={{ 
                fontSize: '0.85rem', 
                fontStyle: 'italic',
                padding: '8px 16px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                💡 <strong>Suggestions:</strong> Post on social media, send promotional emails, or offer same-day discounts
              </div>
            </div>
          ) : (
            <div style={{
              ...getInsightColor('success'),
              padding: '20px',
              borderRadius: '16px',
              borderLeft: '6px solid',
              position: 'relative'
            }} className="insight-card">
              <div style={{ 
                fontWeight: '700', 
                marginBottom: '8px',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🎉 Active Business Day
              </div>
              <div style={{ fontSize: '1rem', lineHeight: '1.5' }}>
                Great! <strong>{stats.todayAppointments}</strong> appointments scheduled for today
              </div>
            </div>
          )}

          {stats.totalAppointments > 50 && (
            <div style={{
              ...getInsightColor('success'),
              padding: '20px',
              borderRadius: '16px',
              borderLeft: '6px solid',
              position: 'relative'
            }} className="insight-card">
              <div style={{ 
                fontWeight: '700', 
                marginBottom: '8px',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🚀 Thriving Business
              </div>
              <div style={{ fontSize: '1rem', lineHeight: '1.5', marginBottom: '8px' }}>
                Congratulations! You've reached <strong>{stats.totalAppointments}</strong> total appointments
              </div>
              <div style={{ 
                fontSize: '0.85rem', 
                fontStyle: 'italic',
                padding: '8px 16px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                💡 <strong>Growth Tip:</strong> Consider expanding services or adding loyalty programs for repeat customers
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Calendar View - Full Width */}
      <MonthlyCalendarView />

      {/* Enhanced Two Column Layout - Mobile Responsive */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '32px'
      }} className="two-column-grid">
        {/* Enhanced Recent Appointments */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
          padding: '32px',
          border: '1px solid #f1f5f9'
        }} className="hover-scale dashboard-card-padding">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}>📋</div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: '0',
              color: '#1e293b'
            }}>Recent Appointments</h3>
          </div>

          {recentAppointments.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 0',
              color: '#64748b'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '16px',
                filter: 'grayscale(0.3)'
              }}>📅</div>
              <p style={{
                fontSize: '1.1rem',
                fontWeight: '500',
                margin: '0'
              }}>No appointments yet</p>
              <p style={{
                fontSize: '0.9rem',
                margin: '8px 0 0 0',
                opacity: '0.7'
              }}>New appointments will appear here</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recentAppointments.slice(0, 5).map((appointment, index) => (
                <div key={appointment.id} style={{
                  padding: '20px',
                  borderRadius: '16px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  position: 'relative'
                }} className="appointment-item slide-in"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontWeight: '600',
                      fontSize: '1.1rem',
                      color: '#1e293b'
                    }}>{appointment.customer_name}</span>
                    <span style={{
                      fontSize: '0.8rem',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      ...getStatusColor(appointment.status)
                    }}>
                      {appointment.status}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '1rem',
                    color: '#475569',
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>
                    💅 {appointment.service?.name}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <span>📅 {format(new Date(appointment.appointment_date), 'MMM d')}</span>
                    <span>🕐 {appointment.appointment_time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Quick Actions */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
          padding: '32px',
          border: '1px solid #f1f5f9'
        }} className="hover-scale dashboard-card-padding">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}>⚡</div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: '0',
              color: '#1e293b'
            }}>Quick Actions</h3>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '24px'
          }} className="quick-actions-grid">
            <button style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              padding: '20px',
              borderRadius: '16px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
            }} className="quick-action-btn" onClick={() => window.location.href = '/admin/appointments'}>
              <span style={{ fontSize: '1.5rem' }}>📅</span>
              <span>Appointments</span>
            </button>
            
            <button style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              padding: '20px',
              borderRadius: '16px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
            }} className="quick-action-btn" onClick={() => window.location.href = '/admin/services'}>
              <span style={{ fontSize: '1.5rem' }}>✨</span>
              <span>Services</span>
            </button>
            
            <button style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              padding: '20px',
              borderRadius: '16px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 25px rgba(139, 92, 246, 0.3)'
            }} className="quick-action-btn" onClick={() => window.location.href = '/admin/staff'}>
              <span style={{ fontSize: '1.5rem' }}>👥</span>
              <span>Staff</span>
            </button>
            
            <button style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              padding: '20px',
              borderRadius: '16px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 25px rgba(245, 158, 11, 0.3)'
            }} className="quick-action-btn" onClick={() => window.location.href = '/admin/products'}>
              <span style={{ fontSize: '1.5rem' }}>🛍️</span>
              <span>Products</span>
            </button>
          </div>
          
          {/* Enhanced Business Tip */}
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: '16px',
            border: '1px solid #0ea5e9',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-20%',
              width: '100px',
              height: '100px',
              background: 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)',
              borderRadius: '50%'
            }}></div>
            <div style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: '#0369a1',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              position: 'relative',
              zIndex: 1
            }}>
              💡 Business Tip
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: '#0369a1',
              lineHeight: '1.5',
              position: 'relative',
              zIndex: 1
            }}>
              {stats.pendingAppointments > 5 
                ? "Consider setting up automated appointment confirmations to reduce manual work and improve customer experience."
                : stats.todayRevenue === 0
                ? "Promote today's availability on social media to attract walk-in customers. Consider flash sales or discounts!"
                : "Your business is running smoothly! Consider expanding your service offerings or implementing a customer loyalty program."
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
