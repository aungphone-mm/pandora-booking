'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import MonthlyCalendarView from './MonthlyCalendarView'
import type { Appointment } from '@/lib/types'

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
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([])
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
      const activities: RecentActivity[] = recentAppointmentsResult.data?.slice(0, 5).map((apt: Appointment) => ({
        id: apt.id,
        type: 'appointment' as const,
        title: `New appointment: ${apt.customer_name}`,
        description: `${apt.service?.name} scheduled for ${format(new Date(apt.appointment_date), 'MMM d')}`,
        time: format(new Date(apt.created_at), 'h:mm a'),
        status: apt.status
      })) || []

      setRecentActivity(activities)

    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-50 text-green-800 border border-green-200'
      case 'cancelled':
        return 'bg-red-50 text-red-800 border border-red-200'
      case 'pending':
        return 'bg-yellow-50 text-yellow-800 border border-yellow-200'
      default:
        return 'bg-gray-50 text-gray-800 border border-gray-200'
    }
  }

  const getInsightColor = (type: 'success' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-emerald-100'
      case 'warning':
        return 'bg-amber-50 border-amber-500 text-amber-900 shadow-amber-100'
      case 'info':
        return 'bg-blue-50 border-blue-500 text-blue-900 shadow-blue-100'
      default:
        return 'bg-gray-50 border-gray-500 text-gray-800 shadow-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-12 text-center border border-slate-100">
        <div className="inline-block w-12 h-12 border-4 border-gray-100 border-t-pink-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 text-lg font-medium">Loading dashboard data...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 min-h-screen bg-slate-50 animate-[fadeIn_0.5s_ease-out]">

      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 rounded-[20px] shadow-[0_15px_35px_rgba(102,126,234,0.3)] p-8 md:p-8 sm:p-6 text-white relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(102,126,234,0.35)] transition-all duration-200">
        <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-center md:items-center mb-4 gap-4 md:gap-0 relative z-10 text-center md:text-left">
          <div>
            <h2 className="text-4xl sm:text-[1.75rem] font-bold m-0 drop-shadow-sm">Welcome Back! 👋</h2>
            <p className="text-lg sm:text-[0.9rem] mt-2 opacity-90">Here's what's happening at Pandora Beauty Salon today</p>
          </div>
          <button
            onClick={loadDashboardData}
            className="bg-gradient-to-br from-pink-500 to-pink-700 text-white px-6 py-4 rounded-xl border-none cursor-pointer font-semibold text-base shadow-[0_6px_20px_rgba(236,72,153,0.3)] flex items-center gap-2 hover:-translate-y-px hover:shadow-[0_8px_25px_rgba(236,72,153,0.4)] active:translate-y-0 transition-all duration-200"
          >
            🔄 Refresh Data
          </button>
        </div>

        <div className="text-base opacity-80 relative z-10">
          📅 {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </div>

      {error && (
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-300 rounded-2xl p-5 shadow-[0_8px_25px_rgba(248,113,113,0.2)] animate-[slideIn_0.3s_ease-out]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-red-700 font-semibold m-0 text-lg">{error}</p>
          </div>
        </div>
      )}

      {/* Enhanced Statistics Grid - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-4 sm:gap-4">
        {/* Total Appointments */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-200 p-7 sm:p-5 rounded-[20px] border border-slate-200 shadow-[0_8px_25px_rgba(0,0,0,0.08)] relative hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.15)] transition-all duration-300 before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-0.5 before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent before:transition-[left] before:duration-500 hover:before:left-full">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 m-0 mb-2 uppercase tracking-wider">📊 Total Appointments</h3>
              <p className="text-5xl sm:text-[2rem] font-extrabold text-slate-800 m-0 leading-none">{stats.totalAppointments}</p>
            </div>
            <div className="w-[60px] h-[60px] bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center text-2xl">📋</div>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-gradient-to-br from-blue-100 to-blue-300 p-7 sm:p-5 rounded-[20px] border border-blue-300 shadow-[0_8px_25px_rgba(59,130,246,0.2)] relative hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(59,130,246,0.25)] transition-all duration-300 before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-0.5 before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent before:transition-[left] before:duration-500 hover:before:left-full">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold text-blue-900 m-0 mb-2 uppercase tracking-wider">📅 Today's Appointments</h3>
              <p className="text-5xl sm:text-[2rem] font-extrabold text-blue-900 m-0 leading-none">{stats.todayAppointments}</p>
            </div>
            <div className="w-[60px] h-[60px] bg-gradient-to-br from-blue-500 to-blue-800 rounded-2xl flex items-center justify-center text-2xl">🗓️</div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-gradient-to-br from-yellow-100 to-amber-400 p-7 sm:p-5 rounded-[20px] border border-amber-400 shadow-[0_8px_25px_rgba(251,191,36,0.2)] relative hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(251,191,36,0.25)] transition-all duration-300 before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-0.5 before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent before:transition-[left] before:duration-500 hover:before:left-full">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold text-amber-900 m-0 mb-2 uppercase tracking-wider">⏳ Pending</h3>
              <p className="text-5xl sm:text-[2rem] font-extrabold text-amber-900 m-0 leading-none">{stats.pendingAppointments}</p>
            </div>
            <div className="w-[60px] h-[60px] bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center text-2xl">⏰</div>
          </div>
        </div>

        {/* Confirmed */}
        <div className="bg-gradient-to-br from-green-100 to-green-400 p-7 sm:p-5 rounded-[20px] border border-green-400 shadow-[0_8px_25px_rgba(74,222,128,0.2)] relative hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(74,222,128,0.25)] transition-all duration-300 before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-0.5 before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent before:transition-[left] before:duration-500 hover:before:left-full">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold text-green-800 m-0 mb-2 uppercase tracking-wider">✅ Confirmed</h3>
              <p className="text-5xl sm:text-[2rem] font-extrabold text-green-800 m-0 leading-none">{stats.confirmedAppointments}</p>
            </div>
            <div className="w-[60px] h-[60px] bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center text-2xl">✔️</div>
          </div>
        </div>

        {/* Active Services */}
        <div className="bg-gradient-to-br from-violet-100 to-violet-300 p-7 sm:p-5 rounded-[20px] border border-violet-300 shadow-[0_8px_25px_rgba(196,181,253,0.2)] relative hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(196,181,253,0.25)] transition-all duration-300 before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-0.5 before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent before:transition-[left] before:duration-500 hover:before:left-full">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold text-violet-800 m-0 mb-2 uppercase tracking-wider">✨ Active Services</h3>
              <p className="text-5xl sm:text-[2rem] font-extrabold text-violet-800 m-0 leading-none">{stats.totalServices}</p>
            </div>
            <div className="w-[60px] h-[60px] bg-gradient-to-br from-violet-600 to-violet-800 rounded-2xl flex items-center justify-center text-2xl">💅</div>
          </div>
        </div>

        {/* Active Products */}
        <div className="bg-gradient-to-br from-pink-50 to-fuchsia-300 p-7 sm:p-5 rounded-[20px] border border-fuchsia-300 shadow-[0_8px_25px_rgba(240,171,252,0.2)] relative hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(240,171,252,0.25)] transition-all duration-300 before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-0.5 before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent before:transition-[left] before:duration-500 hover:before:left-full">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold text-fuchsia-900 m-0 mb-2 uppercase tracking-wider">🛍️ Active Products</h3>
              <p className="text-5xl sm:text-[2rem] font-extrabold text-fuchsia-900 m-0 leading-none">{stats.totalProducts}</p>
            </div>
            <div className="w-[60px] h-[60px] bg-gradient-to-br from-fuchsia-600 to-fuchsia-800 rounded-2xl flex items-center justify-center text-2xl">🎁</div>
          </div>
        </div>

        {/* Active Staff */}
        <div className="bg-gradient-to-br from-cyan-50 to-teal-300 p-7 sm:p-5 rounded-[20px] border border-teal-300 shadow-[0_8px_25px_rgba(94,234,212,0.2)] relative hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(94,234,212,0.25)] transition-all duration-300 before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-0.5 before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent before:transition-[left] before:duration-500 hover:before:left-full">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold text-teal-800 m-0 mb-2 uppercase tracking-wider">👥 Active Staff</h3>
              <p className="text-5xl sm:text-[2rem] font-extrabold text-teal-800 m-0 leading-none">{stats.totalStaff}</p>
            </div>
            <div className="w-[60px] h-[60px] bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl flex items-center justify-center text-2xl">👨‍💼</div>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-400 p-7 sm:p-5 rounded-[20px] border border-yellow-400 shadow-[0_8px_25px_rgba(250,204,21,0.2)] relative hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(250,204,21,0.25)] transition-all duration-300 before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-0.5 before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent before:transition-[left] before:duration-500 hover:before:left-full">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold text-yellow-800 m-0 mb-2 uppercase tracking-wider">💰 Today's Revenue</h3>
              <p className="text-4xl sm:text-[2rem] font-extrabold text-yellow-800 m-0 leading-none">{stats.todayRevenue.toLocaleString()}Ks</p>
            </div>
            <div className="w-[60px] h-[60px] bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-2xl flex items-center justify-center text-2xl">💵</div>
          </div>
        </div>
      </div>

      {/* Enhanced Business Insights */}
      <div className="bg-white rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.08)] p-8 sm:p-5 border border-slate-100 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-xl">🔍</div>
          <h3 className="text-2xl font-bold m-0 text-slate-800">Business Insights</h3>
        </div>

        <div className="flex flex-col gap-4">
          {stats.pendingAppointments > stats.confirmedAppointments && (
            <div className={`${getInsightColor('warning')} p-5 rounded-2xl border-l-[6px] relative shadow-lg transition-all duration-300 hover:translate-x-1 hover:shadow-xl`}>
              <div className="font-bold mb-2 text-lg flex items-center gap-2">
                ⚠️ High Pending Appointments
              </div>
              <div className="text-base leading-6 mb-2">
                You have <strong>{stats.pendingAppointments}</strong> pending appointments that need confirmation
              </div>
              <div className="text-sm italic p-2 px-4 bg-amber-100/50 rounded-lg border border-amber-200/50">
                💡 <strong>Action:</strong> Review and confirm pending appointments to improve customer satisfaction
              </div>
            </div>
          )}

          {stats.todayAppointments === 0 ? (
            <div className={`${getInsightColor('info')} p-5 rounded-2xl border-l-[6px] relative shadow-lg transition-all duration-300 hover:translate-x-1 hover:shadow-xl`}>
              <div className="font-bold mb-2 text-lg flex items-center gap-2">
                📢 Opportunity Day
              </div>
              <div className="text-base leading-6 mb-2">
                No appointments scheduled for today - perfect time for marketing!
              </div>
              <div className="text-sm italic p-2 px-4 bg-blue-100/50 rounded-lg border border-blue-200/50">
                💡 <strong>Suggestions:</strong> Post on social media, send promotional emails, or offer same-day discounts
              </div>
            </div>
          ) : (
            <div className={`${getInsightColor('success')} p-5 rounded-2xl border-l-[6px] relative shadow-lg transition-all duration-300 hover:translate-x-1 hover:shadow-xl`}>
              <div className="font-bold mb-2 text-lg flex items-center gap-2">
                🎉 Active Business Day
              </div>
              <div className="text-base leading-6">
                Great! <strong>{stats.todayAppointments}</strong> appointments scheduled for today
              </div>
            </div>
          )}

          {stats.totalAppointments > 50 && (
            <div className={`${getInsightColor('success')} p-5 rounded-2xl border-l-[6px] relative shadow-lg transition-all duration-300 hover:translate-x-1 hover:shadow-xl`}>
              <div className="font-bold mb-2 text-lg flex items-center gap-2">
                🚀 Thriving Business
              </div>
              <div className="text-base leading-6 mb-2">
                Congratulations! You've reached <strong>{stats.totalAppointments}</strong> total appointments
              </div>
              <div className="text-sm italic p-2 px-4 bg-emerald-100/50 rounded-lg border border-emerald-200/50">
                💡 <strong>Growth Tip:</strong> Consider expanding services or adding loyalty programs for repeat customers
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Calendar View - Full Width */}
      <MonthlyCalendarView />

      {/* Enhanced Two Column Layout - Mobile Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-6">
        {/* Enhanced Recent Appointments */}
        <div className="bg-white rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.08)] p-8 sm:p-5 border border-slate-100 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-700 rounded-xl flex items-center justify-center text-xl">📋</div>
            <h3 className="text-2xl font-bold m-0 text-slate-800">Recent Appointments</h3>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-5xl mb-4 grayscale-[0.3]">📅</div>
              <p className="text-lg font-medium m-0">No appointments yet</p>
              <p className="text-sm mt-2 mb-0 opacity-70">New appointments will appear here</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {recentAppointments.slice(0, 5).map((appointment, index) => (
                <div key={appointment.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 relative transition-all duration-200 hover:bg-slate-100 hover:translate-x-1 hover:shadow-[0_4px_15px_rgba(0,0,0,0.08)] animate-[slideIn_0.3s_ease-out]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-lg text-slate-800">{appointment.customer_name}</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wide ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                  <div className="text-base text-slate-600 mb-1 font-medium">
                    💅 {appointment.service?.name}
                  </div>
                  <div className="text-sm text-slate-500 flex items-center gap-4">
                    <span>📅 {format(new Date(appointment.appointment_date), 'MMM d')}</span>
                    <span>🕐 {appointment.appointment_time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Quick Actions */}
        <div className="bg-white rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.08)] p-8 sm:p-5 border border-slate-100 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center text-xl">⚡</div>
            <h3 className="text-2xl font-bold m-0 text-slate-800">Quick Actions</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              className="bg-gradient-to-br from-blue-500 to-blue-800 text-white p-5 rounded-2xl border-none cursor-pointer text-center text-base font-semibold flex flex-col items-center gap-2 shadow-[0_8px_25px_rgba(59,130,246,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
              onClick={() => window.location.href = '/admin/appointments'}
            >
              <span className="text-2xl">📅</span>
              <span>Appointments</span>
            </button>

            <button
              className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-5 rounded-2xl border-none cursor-pointer text-center text-base font-semibold flex flex-col items-center gap-2 shadow-[0_8px_25px_rgba(16,185,129,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
              onClick={() => window.location.href = '/admin/services'}
            >
              <span className="text-2xl">✨</span>
              <span>Services</span>
            </button>

            <button
              className="bg-gradient-to-br from-violet-600 to-violet-800 text-white p-5 rounded-2xl border-none cursor-pointer text-center text-base font-semibold flex flex-col items-center gap-2 shadow-[0_8px_25px_rgba(139,92,246,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
              onClick={() => window.location.href = '/admin/staff'}
            >
              <span className="text-2xl">👥</span>
              <span>Staff</span>
            </button>

            <button
              className="bg-gradient-to-br from-amber-500 to-amber-700 text-white p-5 rounded-2xl border-none cursor-pointer text-center text-base font-semibold flex flex-col items-center gap-2 shadow-[0_8px_25px_rgba(245,158,11,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
              onClick={() => window.location.href = '/admin/products'}
            >
              <span className="text-2xl">🛍️</span>
              <span>Products</span>
            </button>
          </div>

          {/* Enhanced Business Tip */}
          <div className="p-5 bg-gradient-to-br from-sky-50 to-sky-100 rounded-2xl border border-sky-500 relative overflow-hidden">
            <div className="absolute -top-1/2 -right-[20%] w-[100px] h-[100px] bg-[radial-gradient(circle,rgba(14,165,233,0.1)_0%,transparent_70%)] rounded-full"></div>
            <div className="text-base font-bold text-sky-800 mb-2 flex items-center gap-2 relative z-10">
              💡 Business Tip
            </div>
            <div className="text-sm text-sky-800 leading-6 relative z-10">
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
