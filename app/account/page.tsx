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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Account</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        <p className="text-gray-600">Email: {user.email}</p>
        <p className="text-gray-600">Name: {user.user_metadata?.full_name || 'Not set'}</p>
        <p className="text-gray-600">Phone: {user.user_metadata?.phone || 'Not set'}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">My Appointments</h2>
        {appointments && appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{appointment.service?.name}</h3>
                    <p className="text-gray-600">
                      Date: {new Date(appointment.appointment_date).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">Time: {appointment.appointment_time}</p>
                    <p className="text-gray-600">Duration: {appointment.service?.duration} minutes</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${appointment.service?.price}</p>
                    <span className={`inline-block px-2 py-1 rounded text-sm ${
                      appointment.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800'
                        : appointment.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No appointments found.</p>
        )}
      </div>
    </div>
  )
}
