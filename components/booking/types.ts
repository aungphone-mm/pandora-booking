/**
 * Type definitions for booking form
 */

export type Staff = {
  id: string
  full_name: string
  position: string
  specializations: string[] | null
  bio: string
  is_active: boolean
}

export type Service = {
  id: string
  name: string
  price: number
  duration: number
  category?: {
    name: string
  }
}

export type Product = {
  id: string
  name: string
  price: number
  category_id: string
  category?: {
    name: string
  }
}

export type ProductCategory = {
  id: string
  name: string
  display_order: number
}

export type TimeSlot = {
  id: string
  time: string
  is_active: boolean
}

export type BookingFormData = {
  customerName: string
  customerEmail?: string
  customerPhone: string
  serviceIds: string[] // Changed from serviceId to serviceIds (array)
  appointmentDate: string
  appointmentTime: string
  products: string[]
  notes: string
}
