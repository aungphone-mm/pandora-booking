import AppointmentList from '@/components/AppointmentList'

export default function AdminAppointmentsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Appointment Management</h1>
      <AppointmentList />
    </div>
  )
}