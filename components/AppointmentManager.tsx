'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

type Appointment = {
  id: string
  user_id?: string | null
  staff_id?: string | null
  customer_name: string
  customer_email: string
  customer_phone: string
  appointment_date: string
  appointment_time: string
  status: 'pending' | 'confirmed' | 'cancelled'
  notes?: string
  created_at: string
  appointment_services: {
    id: string
    quantity: number
    price: number
    service: {
      id: string
      name: string
      price: number
      duration: number
    }
  }[]
  staff?: {
    id: string
    full_name: string
  } | null
  user?: {
    full_name: string
  }
  appointment_products?: {
    id: string
    quantity: number
    product: {
      id: string
      name: string
      price: number
    }
  }[]
}

export default function AppointmentManager() {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [staff, setStaff] = useState<{id: string, full_name: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'created' | 'customer'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [updatingStaff, setUpdatingStaff] = useState<string | null>(null)

  useEffect(() => {
    loadAppointments()
    
    // Add enhanced CSS animations
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
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      .appointment-card {
        transition: all 0.3s ease-in-out;
      }
      .appointment-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
      }
      .filter-select {
        transition: all 0.2s ease-in-out;
      }
      .filter-select:focus {
        box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
        border-color: #ec4899;
      }
      .status-select {
        transition: all 0.2s ease-in-out;
        cursor: pointer;
      }
      .status-select:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      .table-row {
        transition: all 0.2s ease-in-out;
      }
      .table-row:hover {
        background-color: #f8fafc;
        transform: scale(1.005);
      }
      .action-button {
        transition: all 0.2s ease-in-out;
      }
      .action-button:hover {
        transform: translateY(-1px);
      }
      
      /* Mobile responsiveness */
      @media (max-width: 768px) {
        .appointment-card:hover {
          transform: none;
        }
        .table-row:hover {
          transform: none;
        }
        .mobile-table {
          display: block !important;
        }
        .desktop-table {
          display: none !important;
        }
        .mobile-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border: 1px solid #f1f5f9;
        }
      }
      
      @media (min-width: 769px) {
        .mobile-table {
          display: none !important;
        }
        .desktop-table {
          display: block !important;
        }
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          appointment_services(
            id,
            quantity,
            price,
            service:services(id, name, price, duration)
          ),
          appointment_products(
            id,
            quantity,
            product:products(id, name, price)
          )
        `)
        .order('created_at', { ascending: false })

      if (appointmentsError) {
        throw appointmentsError
      }

      const staffIds = appointmentsData?.map(apt => apt.staff_id).filter(id => id) || []
      
      let staffData: any[] = []
      
      if (staffIds.length > 0) {
        const { data: staffInfo, error: staffError } = await supabase
          .from('staff')
          .select('id, full_name')
          .in('id', staffIds)
        
        if (staffError) {
          console.error('Error loading staff info:', staffError)
        }
        
        staffData = staffInfo || []
      }

      const userIds = appointmentsData?.filter(apt => apt.user_id).map(apt => apt.user_id) || []
      let profilesData: any[] = []
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)
        profilesData = profiles || []
      }

      const { data: allStaffData, error: allStaffError } = await supabase
        .from('staff')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name')

      if (allStaffError) {
        console.error('Error loading all staff:', allStaffError)
      }

      setStaff(allStaffData || [])

      const combinedData = appointmentsData?.map(appointment => {
        const userProfile = profilesData.find(profile => profile.id === appointment.user_id)
        const staffInfo = staffData.find(staff => staff.id === appointment.staff_id)

        return {
          ...appointment,
          appointment_services: appointment.appointment_services?.map((as: any) => ({
            ...as,
            service: Array.isArray(as.service) ? as.service[0] : as.service
          })) || [],
          user: userProfile || null,
          staff: staffInfo || null
        }
      }) || []

      setAppointments(combinedData)
    } catch (err: any) {
      console.error('Error loading appointments:', err)
      setError(err.message || 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, newStatus: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      setUpdatingStatus(appointmentId)
      setError(null)

      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId)

      if (updateError) {
        throw updateError
      }

      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: newStatus }
            : apt
        )
      )
      
    } catch (err: any) {
      console.error('Error updating appointment status:', err)
      setError(err.message || 'Failed to update appointment status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const updateAppointmentStaff = async (appointmentId: string, staffId: string | null) => {
    try {
      setUpdatingStaff(appointmentId)
      setError(null)

      const { error: updateError } = await supabase
        .from('appointments')
        .update({ staff_id: staffId })
        .eq('id', appointmentId)

      if (updateError) {
        throw updateError
      }

      const selectedStaff = staffId ? staff.find(s => s.id === staffId) : null
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, staff_id: staffId, staff: selectedStaff }
            : apt
        )
      )
      
    } catch (err: any) {
      console.error('Error updating appointment staff:', err)
      setError(err.message || 'Failed to update appointment staff')
    } finally {
      setUpdatingStaff(null)
    }
  }

  const deleteAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
      return
    }

    try {
      setError(null)

      const { error: productsError } = await supabase
        .from('appointment_products')
        .delete()
        .eq('appointment_id', appointmentId)

      if (productsError) {
        throw productsError
      }

      const { error: appointmentError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)

      if (appointmentError) {
        throw appointmentError
      }

      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId))
      
    } catch (err: any) {
      console.error('Error deleting appointment:', err)
      setError(err.message || 'Failed to delete appointment')
    }
  }

  const filteredAndSortedAppointments = appointments
    .filter(apt => {
      if (filterStatus === 'all') return true
      return apt.status === filterStatus
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          const dateA = new Date(`${a.appointment_date} ${a.appointment_time}`)
          const dateB = new Date(`${b.appointment_date} ${b.appointment_time}`)
          comparison = dateA.getTime() - dateB.getTime()
          break
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'customer':
          comparison = a.customer_name.localeCompare(b.customer_name)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { 
          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', 
          color: '#166534',
          border: '1px solid #16a34a'
        }
      case 'cancelled':
        return { 
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', 
          color: '#991b1b',
          border: '1px solid #dc2626'
        }
      case 'pending':
        return { 
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
          color: '#92400e',
          border: '1px solid #f59e0b'
        }
      default:
        return { 
          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', 
          color: '#374151',
          border: '1px solid #6b7280'
        }
    }
  }

  const getServices = (appointment: Appointment) => {
    return appointment.appointment_services.map(as => ({
      ...as.service,
      quantity: as.quantity,
      bookedPrice: as.price
    }))
  }

  const calculateTotal = (appointment: Appointment) => {
    const servicesTotal = getServices(appointment).reduce(
      (sum, service) => sum + (service.bookedPrice * service.quantity), 0
    )
    const productsTotal = appointment.appointment_products?.reduce(
        (sum, ap) => sum + (ap.product.price * ap.quantity), 0
      ) || 0
      return servicesTotal + productsTotal
    }

  if (loading) {
    return (
      <div className="bg-white rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.08)] p-12 text-center border border-slate-100">
        <div className="inline-block w-12 h-12 border-4 border-slate-100 border-t-pink-600 rounded-full animate-spin mb-5"></div>
        <h2 className="mb-2">Loading Appointments</h2>
        <p className="text-slate-500 text-base">Please wait while we fetch your appointment data...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 animate-[fadeIn_0.6s_ease-out]">
      {/* Enhanced Header */}
      <div className="appointment-card bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[20px] shadow-[0_15px_35px_rgba(102,126,234,0.3)] p-8 text-white relative overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 relative z-10">
          <div>
            <h2 className="text-2xl md:text-4xl font-extrabold m-0 mb-2 [text-shadow:0_2px_4px_rgba(0,0,0,0.1)]">📅 Appointment Management</h2>
            <p className="text-lg m-0 opacity-90">Manage all customer appointments and schedules</p>
          </div>
          <button
            onClick={loadAppointments}
            className="action-button bg-gradient-to-br from-pink-600 to-pink-700 text-white px-6 py-4 rounded-xl border-none cursor-pointer font-semibold text-base shadow-[0_6px_20px_rgba(236,72,153,0.3)] flex items-center gap-2"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-400 rounded-2xl p-6 shadow-[0_8px_25px_rgba(248,113,113,0.2)]">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">⚠️</span>
            <h3 className="text-red-700 font-bold m-0 text-xl">Error Loading Appointments</h3>
          </div>
          <p className="text-red-600 font-medium m-0 mb-4">{error}</p>
          
          <details className="p-3">
            <summary className="text-sm text-red-600 cursor-pointer font-semibold">🔧 Troubleshooting Guide</summary>
            <div className="mt-3 text-sm text-red-600 leading-relaxed">
              <p><strong>Common solutions:</strong></p>
              <ol className="list-decimal pl-5 mt-2">
                <li>Verify database tables exist (appointments, services, profiles, products)</li>
                <li>Check RLS policies allow reading from all tables</li>
                <li>Ensure proper relationships are set up between tables</li>
                <li>Check browser console for detailed error messages</li>
                <li>Try refreshing the page or logging out and back in</li>
              </ol>
            </div>
          </details>
        </div>
      )}

      {/* Enhanced Filters and Sorting */}
      <div className="appointment-card bg-white rounded-[20px] shadow-[0_8px_25px_rgba(0,0,0,0.06)] p-5 md:p-8 border border-slate-100">
        <div className="mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-xl">🔍</div>
          <h3 className="text-2xl font-bold m-0 text-slate-800">Filter & Sort Options</h3>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
          <div>
            <label className="mb-2">📊 Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl outline-none text-base font-medium bg-white text-slate-800"
            >
              <option value="all">All Statuses</option>
              <option value="pending">⏳ Pending</option>
              <option value="confirmed">✅ Confirmed</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
          </div>

          <div>
            <label className="mb-2">📋 Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'created' | 'customer')}
              className="filter-select w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl outline-none text-base font-medium bg-white text-slate-800"
            >
              <option value="date">📅 Appointment Date</option>
              <option value="created">🕐 Created Date</option>
              <option value="customer">👤 Customer Name</option>
            </select>
          </div>

          <div>
            <label className="mb-2">🔄 Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="filter-select w-full py-3.5 px-4 border-2 border-slate-200 rounded-xl outline-none text-base font-medium bg-white text-slate-800"
            >
              <option value="desc">📉 Newest First</option>
              <option value="asc">📈 Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 md:gap-5">
        <div className="appointment-card bg-gradient-to-br from-slate-50 to-slate-200 p-6 rounded-2xl border border-slate-200 shadow-[0_6px_20px_rgba(0,0,0,0.06)] text-center">
          <div className="mb-2">📊</div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider m-0 mb-2">Total Appointments</h3>
          <p className="text-5xl font-extrabold text-slate-800 m-0">{appointments.length}</p>
        </div>
        
        <div className="appointment-card bg-gradient-to-br from-amber-50 to-amber-200 p-6 rounded-2xl border border-amber-500 shadow-[0_6px_20px_rgba(245,158,11,0.15)] text-center">
          <div className="mb-2">⏳</div>
          <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wider m-0 mb-2">Pending</h3>
          <p className="text-5xl font-extrabold text-amber-800 m-0">
            {appointments.filter(a => a.status === 'pending').length}
          </p>
        </div>
        
        <div className="appointment-card bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-2xl border border-green-700 shadow-[0_6px_20px_rgba(34,197,94,0.15)] text-center">
          <div className="mb-2">✅</div>
          <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wider m-0 mb-2">Confirmed</h3>
          <p className="text-5xl font-extrabold text-green-800 m-0">
            {appointments.filter(a => a.status === 'confirmed').length}
          </p>
        </div>
        
        <div className="appointment-card bg-gradient-to-br from-red-100 to-red-200 p-6 rounded-2xl border border-red-600 shadow-[0_6px_20px_rgba(220,38,38,0.15)] text-center">
          <div className="mb-2">❌</div>
          <h3 className="text-sm font-semibold text-red-800 uppercase tracking-wider m-0 mb-2">Cancelled</h3>
          <p className="text-5xl font-extrabold text-red-800 m-0">
            {appointments.filter(a => a.status === 'cancelled').length}
          </p>
        </div>
      </div>

      {/* Enhanced Appointments Table */}
      <div className="bg-white rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.08)] p-0 border border-slate-100 overflow-hidden">
        {filteredAndSortedAppointments.length === 0 ? (
          <div className="text-center py-16 px-8 text-slate-500">
            <div className="mb-4">📅</div>
            <h3 className="mb-2">
              {filterStatus === 'all' ? 'No appointments found' : `No ${filterStatus} appointments found`}
            </h3>
            <p className="text-base opacity-80">
              {filterStatus === 'all' 
                ? 'Start by creating your first appointment or check your filters.' 
                : `Try changing the filter to see other appointments.`
              }
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="desktop-table overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                <tr className="bg-gradient-to-br from-slate-50 to-slate-200 border-b-2 border-slate-200">
                  <th className="text-left py-5 px-6 font-bold text-sm text-gray-700 uppercase tracking-wider">👤 Customer</th>
                  <th className="text-left py-5 px-6 font-bold text-sm text-gray-700 uppercase tracking-wider">🔖 Booking ID</th>
                  <th className="text-left py-5 px-6 font-bold text-sm text-gray-700 uppercase tracking-wider">✨ Service</th>
                  <th className="text-left py-5 px-6 font-bold text-sm text-gray-700 uppercase tracking-wider">👥 Staff</th>
                  <th className="text-left py-5 px-6 font-bold text-sm text-gray-700 uppercase tracking-wider">📅 Date & Time</th>
                  <th className="text-left py-5 px-6 font-bold text-sm text-gray-700 uppercase tracking-wider">💰 Total</th>
                  <th className="text-left py-5 px-6 font-bold text-sm text-gray-700 uppercase tracking-wider">📊 Status</th>
                  <th className="text-left py-5 px-6 font-bold text-sm text-gray-700 uppercase tracking-wider">⚡ Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedAppointments.map((appointment, index) => (
                  <tr key={appointment.id} className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                    <td className="p-6">
                      <div>
                        <p className="font-semibold text-lg text-slate-800 m-0 mb-1">{appointment.customer_name}</p>
                        <p className="text-sm text-slate-500 m-0 mb-0.5">📧 {appointment.customer_email}</p>
                        <p className="text-sm text-slate-500 m-0 mb-2">📞 {appointment.customer_phone}</p>
                        <span style={{
                          fontSize: '0.8rem',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          backgroundColor: appointment.user_id ? '#dcfce7' : '#fef3c7',
                          color: appointment.user_id ? '#166534' : '#92400e',
                          fontWeight: '600',
                          border: appointment.user_id ? '1px solid #16a34a' : '1px solid #f59e0b'
                        }}>
                          {appointment.user_id ? '👤 Registered User' : '👥 Guest Booking'}
                        </span>
                        {appointment.user?.full_name && (
                          <p style={{
                            fontSize: '0.8rem',
                            color: '#3b82f6',
                            margin: '4px 0 0 0',
                            fontWeight: '500'
                          }}>🔗 Account: {appointment.user.full_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-6">
                      <div>
                        <div style={{
                          fontFamily: 'monospace',
                          fontSize: '0.7rem',
                          color: '#6b7280',
                          backgroundColor: '#f9fafb',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: '1px solid #e5e7eb',
                          wordBreak: 'break-all',
                          marginBottom: '6px'
                        }}>
                          {appointment.id}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(appointment.id)
                            alert('Booking ID copied!')
                          }}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.65rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          📋 Copy
                        </button>
                      </div>
                    </td>
                    <td className="p-6">
                      <div>
                        {getServices(appointment).map((service, idx) => (
                          <div key={idx} className="mb-2">
                            <p className="font-semibold text-lg text-slate-800 m-0 mb-1">
                              💅 {service.name} {service.quantity > 1 && `×${service.quantity}`}
                            </p>
                            <p className="text-sm text-slate-500 m-0">
                              💰 {service.bookedPrice.toLocaleString()}Ks • ⏱️ {service.duration} min
                            </p>
                          </div>
                        ))}
                        {getServices(appointment).length === 0 && (
                          <p className="text-sm text-slate-400 italic">No service assigned</p>
                        )}
                        {appointment.appointment_products && appointment.appointment_products.length > 0 && (
                          <div style={{
                            fontSize: '0.8rem',
                            color: '#6b7280',
                            marginTop: '8px',
                            padding: '8px 12px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <p className="font-semibold m-0 mb-1">🛍️ Add-ons:</p>
                            {appointment.appointment_products.map((ap) => (
                              <p key={ap.id} className="my-0.5">
                                • {ap.product.name} ×{ap.quantity} ({(ap.product.price * ap.quantity).toLocaleString()}Ks)
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-6">
                      <select
                        value={appointment.staff_id || ''}
                        onChange={(e) => updateAppointmentStaff(
                          appointment.id, 
                          e.target.value || null
                        )}
                        disabled={updatingStaff === appointment.id}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          fontSize: '0.9rem',
                          border: '2px solid #e2e8f0',
                          cursor: updatingStaff === appointment.id ? 'not-allowed' : 'pointer',
                          opacity: updatingStaff === appointment.id ? 0.5 : 1,
                          backgroundColor: 'white',
                          color: '#1e293b',
                          fontWeight: '500'
                        }}
                        className="filter-select"
                      >
                        <option value="">👤 No Staff Assigned</option>
                        {staff.map((staffMember) => (
                          <option key={staffMember.id} value={staffMember.id}>
                            👨‍💼 {staffMember.full_name}
                          </option>
                        ))}
                      </select>
                      {appointment.staff && (
                        <p style={{
                          fontSize: '0.8rem',
                          color: '#10b981',
                          margin: '6px 0 0 0',
                          fontWeight: '600'
                        }}>
                          ✅ Staff Assigned
                        </p>
                      )}
                    </td>
                    <td className="p-6">
                      <div>
                        <p className="font-semibold text-lg text-slate-800 m-0 mb-1">
                          📅 {format(new Date(appointment.appointment_date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-base text-blue-500 font-semibold">🕐 {appointment.appointment_time}</p>
                        <p style={{
                          fontSize: '0.8rem',
                          color: '#94a3b8',
                          margin: '0'
                        }}>
                          ➕ Created: {format(new Date(appointment.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </td>
                    <td className="p-6">
                      <p style={{ 
                        fontWeight: '700',
                        fontSize: '1.2rem',
                        color: '#059669',
                        margin: '0'
                      }}>💰 {calculateTotal(appointment).toLocaleString()}Ks</p>
                    </td>
                    <td className="p-6">
                      <select
                        value={appointment.status}
                        onChange={(e) => updateAppointmentStatus(
                          appointment.id, 
                          e.target.value as 'pending' | 'confirmed' | 'cancelled'
                        )}
                        disabled={updatingStatus === appointment.id}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '12px',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: updatingStatus === appointment.id ? 'not-allowed' : 'pointer',
                          opacity: updatingStatus === appointment.id ? 0.5 : 1,
                          minWidth: '120px',
                          ...getStatusColor(appointment.status)
                        }}
                        className="status-select"
                      >
                        <option value="pending">⏳ Pending</option>
                        <option value="confirmed">✅ Confirmed</option>
                        <option value="cancelled">❌ Cancelled</option>
                      </select>
                    </td>
                    <td className="p-6">
                      <button
                        onClick={() => deleteAppointment(appointment.id)}
                        className="w-full bg-gradient-to-br from-red-600 to-red-700 text-white border-none rounded-lg py-2 px-4 cursor-pointer text-sm font-semibold shadow-[0_4px_12px_rgba(220,38,38,0.3)] hover:from-red-700 hover:to-red-800"
                      >
                        🗑️ Delete
                      </button>
                      {appointment.notes && (
                        <div className="mt-2 py-2 px-3 bg-amber-50 border-l-4 border-amber-500 rounded text-sm text-amber-900">
                          <p style={{
                            fontSize: '0.8rem',
                            color: '#92400e',
                            margin: '0',
                            fontStyle: 'italic',
                            fontWeight: '500'
                          }}>
                            📝 Note: {appointment.notes}
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Cards */}
            <div className="mobile-table">
              {filteredAndSortedAppointments.map((appointment) => (
                <div key={appointment.id} className="mobile-card">
                  <div className="mb-4">
                    <h3 style={{ 
                      fontWeight: '600',
                      fontSize: '1.1rem',
                      color: '#1e293b',
                      margin: '0 0 8px 0'
                    }}>{appointment.customer_name}</h3>
                    <p className="text-sm text-slate-500 my-1">
                      📧 {appointment.customer_email}
                    </p>
                    <p className="text-sm text-slate-500 my-1">
                      📞 {appointment.customer_phone}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    {getServices(appointment).map((service, idx) => (
                      <div key={idx} className="mb-2">
                        <p className="mb-2">
                          💅 {service.name} {service.quantity > 1 && `×${service.quantity}`}
                        </p>
                        <p className="text-sm text-slate-500">
                          💰 {service.bookedPrice.toLocaleString()}Ks • ⏱️ {service.duration} min
                        </p>
                      </div>
                    ))}
                    {getServices(appointment).length === 0 && (
                      <p className="text-sm text-slate-400 italic">No service assigned</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <p className="mb-2">
                      📅 {format(new Date(appointment.appointment_date), 'MMM d, yyyy')}
                    </p>
                    <p className="text-base text-blue-500 font-semibold">
                      🕐 {appointment.appointment_time}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <select
                      value={appointment.status}
                      onChange={(e) => updateAppointmentStatus(
                        appointment.id, 
                        e.target.value as 'pending' | 'confirmed' | 'cancelled'
                      )}
                      disabled={updatingStatus === appointment.id}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        flex: '1',
                        minWidth: '120px',
                        ...getStatusColor(appointment.status)
                      }}
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="confirmed">✅ Confirmed</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>
                    
                    <button
                      onClick={() => deleteAppointment(appointment.id)}
                      className="w-full bg-gradient-to-br from-red-600 to-red-700 text-white border-none rounded-lg py-2 px-4 cursor-pointer text-sm font-semibold shadow-[0_4px_12px_rgba(220,38,38,0.3)] hover:from-red-700 hover:to-red-800"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  
                  <div className="border-t border-slate-200 pt-4">
                    <label className="mb-2">Assign Staff:</label>
                    <select
                      value={appointment.staff_id || ''}
                      onChange={(e) => updateAppointmentStaff(
                        appointment.id, 
                        e.target.value || null
                      )}
                      disabled={updatingStaff === appointment.id}
                      className="w-full py-2 px-3 border-2 border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    >
                      <option value="">👤 No Staff Assigned</option>
                      {staff.map((staffMember) => (
                        <option key={staffMember.id} value={staffMember.id}>
                          👨‍💼 {staffMember.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="p-3">
                    <p style={{ 
                      fontWeight: '700',
                      fontSize: '1.1rem',
                      color: '#059669',
                      margin: '0'
                    }}>
                      Total: 💰 {calculateTotal(appointment).toLocaleString()}Ks
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
