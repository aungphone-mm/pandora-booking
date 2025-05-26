'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

type SimpleAppointment = {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  service_id: string
  appointment_date: string
  appointment_time: string
  status: 'pending' | 'confirmed' | 'cancelled'
  notes?: string
  created_at: string
  user_id?: string
}

export default function SimpleAppointmentManager() {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<SimpleAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      console.log('Loaded appointments:', data?.length || 0)
      setAppointments(data || [])
    } catch (err: any) {
      console.error('Error loading appointments:', err)
      setError(err.message || 'Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, newStatus: 'pending' | 'confirmed' | 'cancelled') => {
    try {
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

    } catch (err: any) {
      console.error('Error updating appointment status:', err)
      setError(err.message || 'Failed to update appointment status')
    }
  }

  const filteredAppointments = appointments.filter(apt => {
    if (filterStatus === 'all') return true
    return apt.status === filterStatus
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
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
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

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-600">Total</h3>
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
      {filteredAppointments.length === 0 ? (
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
                <th className="text-left py-3 px-4">Service ID</th>
                <th className="text-left py-3 px-4">Date & Time</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{appointment.customer_name}</p>
                      <p className="text-sm text-gray-600">{appointment.customer_email}</p>
                      <p className="text-sm text-gray-600">{appointment.customer_phone}</p>
                      {appointment.user_id && (
                        <p className="text-xs text-blue-600">User ID: {appointment.user_id}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600">{appointment.service_id}</p>
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
                    <select
                      value={appointment.status}
                      onChange={(e) => updateAppointmentStatus(
                        appointment.id, 
                        e.target.value as 'pending' | 'confirmed' | 'cancelled'
                      )}
                      className={`px-2 py-1 rounded text-sm font-medium border-0 cursor-pointer ${getStatusColor(appointment.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    {appointment.notes && (
                      <p className="text-xs text-gray-600 italic">
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