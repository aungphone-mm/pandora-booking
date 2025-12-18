// Shared TypeScript types for the application

export type AppointmentProduct = {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
  }
}

export type AppointmentService = {
  id: string
  quantity: number
  price: number
  service: {
    id: string
    name: string
    price: number
    duration: number
  }
}

export type Appointment = {
  id: string
  user_id?: string | null
  staff_id?: string | null
  customer_name: string
  customer_email: string
  customer_phone: string
  appointment_date: string
  appointment_time: string
  status: 'pending' | 'confirmed' | 'cancelled'
  notes?: string
  created_at: string

  // Multiple services structure (using junction table)
  appointment_services: AppointmentService[]

  staff?: {
    id: string
    full_name: string
  } | null

  user?: {
    full_name: string
  } | null

  appointment_products?: AppointmentProduct[]
}

// Alias for backward compatibility with existing code
export type AppointmentWithRelations = Appointment
