import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboardPage() {
  const supabase = createClient()
  
  // Get today's date
  const today = new Date().toISOString().split('T')[0]
  
  // Fetch statistics
  const [
    { count: totalAppointments },
    { count: todayAppointments },
    { count: totalServices },
    { count: totalProducts }
  ] = await Promise.all([
    supabase.from('appointments').select('*', { count: 'exact', head: true }),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_date', today),
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])

  // Fetch recent appointments
  const { data: recentAppointments } = await supabase
    .from('appointments')
    .select(`
      *,
      service:services(name),
      user:profiles(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '32px'
      }}>Admin Dashboard</h1>
      
      {/* Statistics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>Total Appointments</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827'
          }}>{totalAppointments || 0}</p>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>Today's Appointments</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827'
          }}>{todayAppointments || 0}</p>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>Active Services</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827'
          }}>{totalServices || 0}</p>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>Active Products</h3>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827'
          }}>{totalProducts || 0}</p>
        </div>
      </div>

      {/* Recent Appointments */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        padding: '24px'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          marginBottom: '16px'
        }}>Recent Appointments</h2>
        {recentAppointments && recentAppointments.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{
                    textAlign: 'left',
                    padding: '12px 8px',
                    fontWeight: '600'
                  }}>Customer</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '12px 8px',
                    fontWeight: '600'
                  }}>Service</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '12px 8px',
                    fontWeight: '600'
                  }}>Date</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '12px 8px',
                    fontWeight: '600'
                  }}>Time</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '12px 8px',
                    fontWeight: '600'
                  }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map((appointment) => (
                  <tr key={appointment.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 8px' }}>{appointment.customer_name}</td>
                    <td style={{ padding: '12px 8px' }}>{appointment.service?.name}</td>
                    <td style={{ padding: '12px 8px' }}>
                      {new Date(appointment.appointment_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 8px' }}>{appointment.appointment_time}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#6b7280' }}>No appointments yet.</p>
        )}
      </div>
    </div>
  )
}