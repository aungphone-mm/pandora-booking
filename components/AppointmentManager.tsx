'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

type Appointment = {
  id: string
  user_id?: string | null  // Added missing user_id field
  staff_id?: string | null  // Added staff_id field
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
  }, [])

  // Replace the loadAppointments function in components/AppointmentManager.tsx

// Replace the loadAppointments function in components/AppointmentManager.tsx (around line 53)

const loadAppointments = async () => {
  try {
    setLoading(true)
    setError(null)

    // First get appointments with services and products
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        *,
        service:services(id, name, price, duration),
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

    // Check if staff_id column exists and has values
    const staffIds = appointmentsData?.map(apt => apt.staff_id).filter(id => id) || []
    
    // Get staff information separately
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

    // Get user profiles separately for users who have accounts
    const userIds = appointmentsData?.filter(apt => apt.user_id).map(apt => apt.user_id) || []
    let profilesData: any[] = []
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)
      profilesData = profiles || []
    }

    // Load all active staff for dropdown
    const { data: allStaffData, error: allStaffError } = await supabase
      .from('staff')
      .select('id, full_name')
      .eq('is_active', true)
      .order('full_name')

    if (allStaffError) {
      console.error('Error loading all staff:', allStaffError)
    }

    setStaff(allStaffData || [])

    // Combine appointments with user profiles and staff info
    const combinedData = appointmentsData?.map(appointment => {
      const userProfile = profilesData.find(profile => profile.id === appointment.user_id)
      const staffInfo = staffData.find(staff => staff.id === appointment.staff_id)
      
      return {
        ...appointment,
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

      // Update local state
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
        return { backgroundColor: '#dcfce7', color: '#166534' }
      case 'cancelled':
        return { backgroundColor: '#fee2e2', color: '#991b1b' }
      case 'pending':
        return { backgroundColor: '#fef3c7', color: '#92400e' }
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151' }
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
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '24px'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '24px'
        }}>Appointment Management</h2>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '32px 0'
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
        marginBottom: '24px'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold'
        }}>Appointment Management</h2>
        <button
          onClick={loadAppointments}
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

      {error && (
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px'
        }}>
          <p style={{ color: '#b91c1c', fontWeight: '500' }}>{error}</p>
          <details style={{ marginTop: '8px' }}>
            <summary style={{
              fontSize: '0.875rem',
              color: '#dc2626',
              cursor: 'pointer'
            }}>Debug Information</summary>
            <div style={{
              marginTop: '8px',
              fontSize: '0.75rem',
              color: '#dc2626'
            }}>
              <p>Try the following steps:</p>
              <ol style={{
                listStyle: 'decimal',
                paddingLeft: '20px',
                marginTop: '4px'
              }}>
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
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center'
      }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>Filter by Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              outline: 'none'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'created' | 'customer')}
            style={{
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              outline: 'none'
            }}
          >
            <option value="date">Appointment Date</option>
            <option value="created">Created Date</option>
            <option value="customer">Customer Name</option>
          </select>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '4px'
          }}>Order</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            style={{
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              outline: 'none'
            }}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#6b7280'
          }}>Total Appointments</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827'
          }}>{appointments.length}</p>
        </div>
        <div style={{
          backgroundColor: '#fef3c7',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#92400e'
          }}>Pending</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#92400e'
          }}>
            {appointments.filter(a => a.status === 'pending').length}
          </p>
        </div>
        <div style={{
          backgroundColor: '#dcfce7',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#166534'
          }}>Confirmed</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#166534'
          }}>
            {appointments.filter(a => a.status === 'confirmed').length}
          </p>
        </div>
        <div style={{
          backgroundColor: '#fee2e2',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#991b1b'
          }}>Cancelled</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#991b1b'
          }}>
            {appointments.filter(a => a.status === 'cancelled').length}
          </p>
        </div>
      </div>

      {/* Appointments Table */}
      {filteredAndSortedAppointments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '32px 0'
        }}>
          <p style={{ color: '#6b7280' }}>
            {filterStatus === 'all' 
              ? 'No appointments found.' 
              : `No ${filterStatus} appointments found.`
            }
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb'
              }}>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: '600'
                }}>Customer</th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: '600'
                }}>Service</th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: '600'
                }}>Staff</th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: '600'
                }}>Date & Time</th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: '600'
                }}>Total</th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: '600'
                }}>Status</th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: '600'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedAppointments.map((appointment) => (
                <tr key={appointment.id} style={{
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div>
                      <p style={{ fontWeight: '500' }}>{appointment.customer_name}</p>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>{appointment.customer_email}</p>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>{appointment.customer_phone}</p>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: appointment.user_id ? '#dcfce7' : '#fef3c7',
                        color: appointment.user_id ? '#166534' : '#92400e',
                        fontWeight: '500'
                      }}>
                        {appointment.user_id ? '👤 Registered' : '👥 Guest'}
                      </span>
                      {appointment.user?.full_name && (
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#2563eb'
                        }}>Account: {appointment.user.full_name}</p>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div>
                      <p style={{ fontWeight: '500' }}>{appointment.service?.name}</p>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        {appointment.service?.price}Ks • {appointment.service?.duration} min
                      </p>
                      {appointment.appointment_products && appointment.appointment_products.length > 0 && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          marginTop: '4px'
                        }}>
                          <p>Add-ons:</p>
                          {appointment.appointment_products.map((ap) => (
                            <p key={ap.id}>
                              {ap.product.name} x{ap.quantity} ({ap.product.price * ap.quantity}Ks)
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <select
                      value={appointment.staff_id || ''}
                      onChange={(e) => updateAppointmentStaff(
                        appointment.id, 
                        e.target.value || null
                      )}
                      disabled={updatingStaff === appointment.id}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        border: '1px solid #d1d5db',
                        cursor: updatingStaff === appointment.id ? 'not-allowed' : 'pointer',
                        opacity: updatingStaff === appointment.id ? 0.5 : 1,
                        backgroundColor: 'white',
                        minWidth: '150px'
                      }}
                    >
                      <option value="">No Staff Assigned</option>
                      {staff.map((staffMember) => (
                        <option key={staffMember.id} value={staffMember.id}>
                          {staffMember.full_name}
                        </option>
                      ))}
                    </select>
                    {appointment.staff && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginTop: '4px'
                      }}>
                        Assigned
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div>
                      <p style={{ fontWeight: '500' }}>
                        {format(new Date(appointment.appointment_date), 'MMM d, yyyy')}
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>{appointment.appointment_time}</p>
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#9ca3af'
                      }}>
                        Created: {format(new Date(appointment.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <p style={{ fontWeight: '500' }}>{calculateTotal(appointment).toFixed(2)}Ks</p>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <select
                      value={appointment.status}
                      onChange={(e) => updateAppointmentStatus(
                        appointment.id, 
                        e.target.value as 'pending' | 'confirmed' | 'cancelled'
                      )}
                      disabled={updatingStatus === appointment.id}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        border: 'none',
                        cursor: updatingStatus === appointment.id ? 'not-allowed' : 'pointer',
                        opacity: updatingStatus === appointment.id ? 0.5 : 1,
                        ...getStatusColor(appointment.status)
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => deleteAppointment(appointment.id)}
                        style={{
                          color: '#dc2626',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                    {appointment.notes && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginTop: '4px',
                        fontStyle: 'italic'
                      }}>
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