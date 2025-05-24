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
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Appointments</h3>
          <p className="text-2xl font-bold text-gray-800">{totalAppointments || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Today's Appointments</h3>
          <p className="text-2xl font-bold text-gray-800">{todayAppointments || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Active Services</h3>
          <p className="text-2xl font-bold text-gray-800">{totalServices || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Active Products</h3>
          <p className="text-2xl font-bold text-gray-800">{totalProducts || 0}</p>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Appointments</h2>
        {recentAppointments && recentAppointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Customer</th>
                  <th className="text-left py-2">Service</th>
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Time</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b">
                    <td className="py-2">{appointment.customer_name}</td>
                    <td className="py-2">{appointment.service?.name}</td>
                    <td className="py-2">
                      {new Date(appointment.appointment_date).toLocaleDateString()}
                    </td>
                    <td className="py-2">{appointment.appointment_time}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        appointment.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800'
                          : appointment.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No appointments yet.</p>
        )}
      </div>
    </div>
  )
}
