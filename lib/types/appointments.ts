/**
 * Appointment-related type definitions
 * Used across the application for appointments and bookings
 */

export interface Service {
  id: string
  name: string
  price: number
  duration: number
  category_id?: string
  is_active: boolean
}

export interface Product {
  id: string
  name: string
  price: number
  category_id: string
  is_active: boolean
}

export interface Staff {
  id: string
  full_name: string
  position: string
  specializations?: string[] | null
  bio?: string
  is_active: boolean
}

export interface AppointmentProduct {
  product_id: string
  quantity: number
  product: Product
}

export interface Appointment {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  service_id: string
  staff_id: string
  appointment_date: string
  appointment_time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  notes?: string | null
  total_price: number
  user_id?: string | null
  created_at: string
  updated_at?: string
  service?: Service
  staff?: Staff
  appointment_products?: AppointmentProduct[]
}

export interface AppointmentWithRelations extends Appointment {
  service: Service
  staff: Staff
  appointment_products: AppointmentProduct[]
}
