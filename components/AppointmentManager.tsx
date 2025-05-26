'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

type Appointment = {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  appointment_date: string
  appointment_time: string
  status: 'pending' | 'confirmed' | 'cancelled'
  notes?: string
  created_at: string
  service: {
    id: string
    name: string
    price: number
    duration: number
  }
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'created' | 'customer'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      setError(null)

      // First, try a simple query to get appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })

      if (appointmentsError) {
        console.error('Error loading appointments:', appointmentsError)
        throw new Error(`Failed to load appointments: ${appointmentsError.message}`)
      }

      if (!appointmentsData || appointmentsData.length === 0) {
        console.log('No appointments found')
        setAppointments([])
        return
      }

      console.log('Found appointments:', appointmentsData.length)

      // Load related data separately to avoid relationship issues
      const appointmentIds = appointmentsData.map(apt => apt.id)
      const serviceIds = [...new Set(appointmentsData.map(apt => apt.service_id))]
      const userIds = [...new Set(appointmentsData.map(apt => apt.user_id).filter(Boolean))]

      // Load services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, name, price, duration')
        .in('id', serviceIds)

      if (servicesError) {
        console.warn('Error loading services:', servicesError)
      }

      // Load profiles (try to handle the relationship issue)
      let profilesData = []
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)

        if (profilesError) {
          console.warn('Error loading profiles:', profilesError)
          // Don't throw error, just continue without profile data
        } else {
          profilesData = profiles || []
        }
      }

      // Load appointment products
      const { data: appointmentProductsData, error: productsError } = await supabase
        .from('appointment_products')
        .select(`
          id,
          appointment_id,
          quantity,
          product_id,
          product:products(id, name, price)
        `)
        .in('appointment_id', appointmentIds)

      if (productsError) {
        console.warn('Error loading appointment products:', productsError)
      }

      // Create lookup maps
      const servicesMap = new Map(servicesData?.map(s => [s.id, s]) || [])
      const profilesMap = new Map(profilesData.map(p => [p.id, p]))
      const productsMap = new Map()
      
      // Group products by appointment_id
      appointmentProductsData?.forEach(ap => {
        if (!productsMap.has(ap.appointment_id)) {
          productsMap.set(ap.appointment_id, [])
        }
        productsMap.get(ap.appointment_id).push(ap)
      })

      // Combine all data
      const enrichedAppointments = appointmentsData.map(appointment => ({
        ...appointment,
        service: servicesMap.get(appointment.service_id) || null,
        user: appointment.user_id ? profilesMap.get(appointment.user_id) || null : null,
        appointment_products: productsMap.get(appointment.id) || []
      }))

      console.log('Enriched appointments:', enrichedAppointments.length)
      setAppointments(enrichedAppointments)

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

      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: newStatus }
            : apt
        )
      )

      // Show success message briefly
      const successMessage = `Appointment ${newStatus} successfully`
      setError(null)
      
    } catch (err: any) {
      console.error('Error updating appointment status:', err)
      setError(err.message || 'Failed to update appointment status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const deleteAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
      return
    }

    try {
      setError(null)

      // First delete appointment products
      const { error: productsError } = await supabase
        .from('appointment_products')
        .delete()
        .eq('appointment_id', appointmentId)

      if (productsError) {
        throw productsError
      }

      // Then delete the appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)

      if (appointmentError) {
        throw appointmentError
      }

      // Update local state
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId))
      
    } catch (err: any) {
      console.error('Error deleting appointment:', err)
      setError(err.message || 'Failed to delete appointment')
    }
  }

  // Filter and sort appointments
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
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateTotal = (appointment: Appointment) => {
    const servicePrice = appointment.service?.price || 0
    const productsTotal = appointment.appointment_products?.reduce(
      (sum, ap) => sum + (ap.product.price * ap.quantity), 0
    ) || 0
    return servicePrice + productsTotal
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Appointment Management</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Appointment Management</h2>
        <button
          onClick={loadAppointments}
          className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
          <details className="mt-2">
            <summary className="text-sm text-red-600 cursor-pointer">Debug Information</summary>
            <div className="mt-2 text-xs text-red-600">
              <p>Try the following steps:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Make sure all database tables exist (appointments, services, profiles, products, appointment_products)</li>
                <li>Check that the profiles table has proper relationships set up</li>
                <li>Verify RLS policies allow reading from all tables</li>
                <li>Check browser console for detailed error messages</li>
              </ol>
            </div>
          </details>
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'created' | 'customer')}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="date">Appointment Date</option>
            <option value="created">Created Date</option>
            <option value="customer">Customer Name</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Debug Information (remove this in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p><strong>Debug Info:</strong></p>
          <p>Total appointments loaded: {appointments.length}</p>
          <p>Loading state: {loading ? 'true' : 'false'}</p>
          <p>Error state: {error ? 'true' : 'false'}</p>
          <p>Filter: {filterStatus}</p>
          <p>Filtered count: {filteredAndSortedAppointments.length}</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600">Total Appointments</h3>
          <p className="text-2xl font-bold text-gray-800">{appointments.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-600">Pending</h3>
          <p className="text-2xl font-bold text-yellow-800">
            {appointments.filter(a => a.status === 'pending').length}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">Confirmed</h3>
          <p className="text-2xl font-bold text-green-800">
            {appointments.filter(a => a.status === 'confirmed').length}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-600">Cancelled</h3>
          <p className="text-2xl font-bold text-red-800">
            {appointments.filter(a => a.status === 'cancelled').length}
          </p>
        </div>
      </div>

      {/* Appointments Table */}
      {filteredAndSortedAppointments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            {filterStatus === 'all' 
              ? 'No appointments found.' 
              : `No ${filterStatus} appointments found.`
            }
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4">Customer</th>
                <th className="text-left py-3 px-4">Service</th>
                <th className="text-left py-3 px-4">Date & Time</th>
                <th className="text-left py-3 px-4">Total</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedAppointments.map((appointment) => (
                <tr key={appointment.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{appointment.customer_name}</p>
                      <p className="text-sm text-gray-600">{appointment.customer_email}</p>
                      <p className="text-sm text-gray-600">{appointment.customer_phone}</p>
                      {appointment.user?.full_name && (
                        <p className="text-xs text-blue-600">Account: {appointment.user.full_name}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{appointment.service?.name}</p>
                      <p className="text-sm text-gray-600">
                        ${appointment.service?.price} • {appointment.service?.duration} min
                      </p>
                      {appointment.appointment_products && appointment.appointment_products.length > 0 && (
                        <div className="text-xs text-gray-600 mt-1">
                          <p>Add-ons:</p>
                          {appointment.appointment_products.map((ap) => (
                            <p key={ap.id}>
                              {ap.product.name} x{ap.quantity} (${ap.product.price * ap.quantity})
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">
                        {format(new Date(appointment.appointment_date), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-600">{appointment.appointment_time}</p>
                      <p className="text-xs text-gray-500">
                        Created: {format(new Date(appointment.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium">${calculateTotal(appointment).toFixed(2)}</p>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={appointment.status}
                      onChange={(e) => updateAppointmentStatus(
                        appointment.id, 
                        e.target.value as 'pending' | 'confirmed' | 'cancelled'
                      )}
                      disabled={updatingStatus === appointment.id}
                      className={`px-2 py-1 rounded text-sm font-medium border-0 ${getStatusColor(appointment.status)} ${
                        updatingStatus === appointment.id ? 'opacity-50' : 'cursor-pointer'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteAppointment(appointment.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    {appointment.notes && (
                      <p className="text-xs text-gray-600 mt-1 italic">
                        Note: {appointment.notes}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}