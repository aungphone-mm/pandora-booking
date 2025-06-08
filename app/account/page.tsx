// ACCOUNT PAGE
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AccountPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user's appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      *,
      service:services(name, price, duration)
    `)
    .eq('user_id', user.id)
    .order('appointment_date', { ascending: false })

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '32px 16px'
    }}>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '24px'
      }}>My Account</h1>
      
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        marginBottom: '32px'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          marginBottom: '16px'
        }}>Profile Information</h2>
        <p style={{
          color: '#6b7280',
          marginBottom: '8px'
        }}>Email: {user.email}</p>
        <p style={{
          color: '#6b7280',
          marginBottom: '8px'
        }}>Name: {user.user_metadata?.full_name || 'Not set'}</p>
        <p style={{
          color: '#6b7280'
        }}>Phone: {user.user_metadata?.phone || 'Not set'}</p>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          marginBottom: '16px'
        }}>My Appointments</h2>
        {appointments && appointments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {appointments.map((appointment) => (
              <div key={appointment.id} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <h3 style={{ fontWeight: '600' }}>{appointment.service?.name}</h3>
                    <p style={{
                      color: '#6b7280',
                      marginBottom: '4px'
                    }}>
                      Date: {new Date(appointment.appointment_date).toLocaleDateString()}
                    </p>
                    <p style={{
                      color: '#6b7280',
                      marginBottom: '4px'
                    }}>Time: {appointment.appointment_time}</p>
                    <p style={{
                      color: '#6b7280'
                    }}>Duration: {appointment.service?.duration} minutes</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: '600' }}>{appointment.service?.price}Ks</p>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      backgroundColor: appointment.status === 'confirmed' 
                        ? '#dcfce7' 
                        : appointment.status === 'cancelled'
                        ? '#fee2e2'
                        : '#fef3c7',
                      color: appointment.status === 'confirmed' 
                        ? '#166534' 
                        : appointment.status === 'cancelled'
                        ? '#991b1b'
                        : '#92400e'
                    }}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6b7280' }}>No appointments found.</p>
        )}
      </div>
    </div>
  )
}

// CONFIRMATION PAGE
