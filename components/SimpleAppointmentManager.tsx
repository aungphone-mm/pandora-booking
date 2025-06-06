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
        return { backgroundColor: '#dcfce7', color: '#166534' }
      case 'cancelled':
        return { backgroundColor: '#fee2e2', color: '#991b1b' }
      case 'pending':
        return { backgroundColor: '#fef3c7', color: '#92400e' }
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151' }
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
          <p style={{ color: '#b91c1c' }}>{error}</p>
        </div>
      )}

      {/* Filter */}
      <div style={{ marginBottom: '24px' }}>
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
          }}>Total</h3>
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
      {filteredAppointments.length === 0 ? (
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
                }}>Service ID</th>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontWeight: '600'
                }}>Date & Time</th>
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
              {filteredAppointments.map((appointment) => (
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
                      {appointment.user_id && (
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#2563eb'
                        }}>User ID: {appointment.user_id}</p>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>{appointment.service_id}</p>
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
                    <select
                      value={appointment.status}
                      onChange={(e) => updateAppointmentStatus(
                        appointment.id, 
                        e.target.value as 'pending' | 'confirmed' | 'cancelled'
                      )}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        border: 'none',
                        cursor: 'pointer',
                        ...getStatusColor(appointment.status)
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {appointment.notes && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
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