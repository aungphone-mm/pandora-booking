// ACCOUNT PAGE
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { AppointmentWithRelations, AppointmentProduct, AppointmentService } from '@/lib/types'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

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
    appointment_services(
      id,
      quantity,
      price,
      service:services(name, price, duration)
    ),
    appointment_products(
      id,
      quantity,
      product:products(id, name, price)
    )
  `)
  .eq('user_id', user.id)
  .order('appointment_date', { ascending: false })

  // Helper function to calculate total
  const calculateTotal = (appointment: AppointmentWithRelations) => {
    const servicesTotal = appointment.appointment_services.reduce(
      (sum, as) => sum + (as.price * as.quantity), 0
    )
    const productsTotal = appointment.appointment_products?.reduce(
      (sum: number, ap: AppointmentProduct) => sum + (ap.product.price * ap.quantity), 0
    ) || 0
    return servicesTotal + productsTotal
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Account</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        <p className="text-gray-600 mb-2">Email: {user.email}</p>
        <p className="text-gray-600 mb-2">Name: {user.user_metadata?.full_name || 'Not set'}</p>
        <p className="text-gray-600">Phone: {user.user_metadata?.phone || 'Not set'}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">My Appointments</h2>
        {appointments && appointments.length > 0 ? (
          <div className="flex flex-col gap-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="mb-2">
                      {appointment.appointment_services.map((as: AppointmentService, idx: number) => (
                        <div key={as.id} className={idx > 0 ? 'mt-2' : ''}>
                          <h3 className="font-semibold">
                            {as.service.name}
                            {as.quantity > 1 && ` x${as.quantity}`}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Duration: {as.service.duration} minutes • {as.price.toLocaleString()}Ks
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-gray-600 mb-1">
                      Date: {new Date(appointment.appointment_date).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600 mb-1">Time: {appointment.appointment_time}</p>
                    {appointment.appointment_products && appointment.appointment_products.length > 0 && (
                      <div className="text-sm text-gray-600 mt-2">
                        <p className="font-medium">Add-ons:</p>
                        {appointment.appointment_products.map((ap: AppointmentProduct) => (
                          <p key={ap.product.id} className="ml-3">
                            • {ap.product.name} x{ap.quantity} ({ap.product.price * ap.quantity}Ks)
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      {calculateTotal(appointment).toLocaleString()}Ks
                    </p>
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

// CONFIRMATION PAGE
