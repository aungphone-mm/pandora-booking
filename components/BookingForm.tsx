'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

type Service = {
  id: string
  name: string
  price: number
  duration: number
  category?: {
    name: string
  }
}

type Product = {
  id: string
  name: string
  price: number
  category_id: string
  category?: {
    name: string
  }
}

type ProductCategory = {
  id: string
  name: string
  display_order: number
}

type TimeSlot = {
  id: string
  time: string
  is_active: boolean
}

type FormData = {
  customerName: string
  customerEmail: string
  customerPhone: string
  serviceId: string
  appointmentDate: string
  appointmentTime: string
  products: string[]
  notes: string
}

export default function BookingForm({ user }: { user: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    defaultValues: {
      customerName: user?.user_metadata?.full_name || '',
      customerEmail: user?.email || '',
    }
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      checkAvailability(selectedDate)
    }
  }, [selectedDate])

  const loadData = async () => {
    try {
      // Load services with categories
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          category:service_categories(name)
        `)
        .eq('is_active', true)
        .order('category_id')

      if (servicesError) {
        console.error('Error loading services:', servicesError)
        setError('Failed to load services. Please refresh the page.')
      }

      // Load products with categories
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          category:product_categories(name)
        `)
        .eq('is_active', true)
        .order('category_id')

      if (productsError) {
        console.error('Error loading products:', productsError)
      }

      // Load product categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('product_categories')
        .select('*')
        .order('display_order')

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError)
      }

      // Load time slots
      const { data: slotsData, error: slotsError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('is_active', true)
        .order('time')

      if (slotsError) {
        console.error('Error loading time slots:', slotsError)
        setError('Failed to load time slots. Please refresh the page.')
      }

      setServices(servicesData || [])
      setProducts(productsData || [])
      setProductCategories(categoriesData || [])
      setTimeSlots(slotsData || [])
    } catch (err) {
      console.error('Unexpected error loading data:', err)
      setError('An unexpected error occurred. Please refresh the page.')
    }
  }

  const checkAvailability = async (date: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('appointment_date', date)
        .eq('status', 'confirmed')
      
      if (error) {
        console.error('Error checking availability:', error)
        return
      }

      const bookedSlots = data?.map(apt => apt.appointment_time) || []
      const available = timeSlots
        .filter(slot => !bookedSlots.includes(slot.time))
        .map(slot => slot.time)
      setAvailableSlots(available)
    } catch (err) {
      console.error('Unexpected error checking availability:', err)
    }
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)
    
    try {
      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: user?.id || null,
          customer_name: data.customerName,
          customer_email: data.customerEmail,
          customer_phone: data.customerPhone,
          service_id: data.serviceId,
          appointment_date: data.appointmentDate,
          appointment_time: data.appointmentTime,
          notes: data.notes,
          status: 'pending' // Explicitly set status
        })
        .select()
        .single()
      
      if (appointmentError) {
        console.error('Appointment creation error:', appointmentError)
        
        // Provide specific error messages based on the error
        if (appointmentError.code === '42501') {
          setError('Database permission denied. Please contact support or try logging in again.')
        } else if (appointmentError.message?.includes('violates row-level security')) {
          setError('Unable to save appointment. This might be a permissions issue. Please try logging in or contact support.')
        } else {
          setError(`Failed to create appointment: ${appointmentError.message}`)
        }
        
        setLoading(false)
        return
      }

      if (!appointment) {
        setError('No appointment was created. Please try again.')
        setLoading(false)
        return
      }
      
      // Add products if selected
      if (data.products && data.products.length > 0) {
        const productInserts = data.products.map(productId => ({
          appointment_id: appointment.id,
          product_id: productId,
          quantity: 1
        }))
        
        const { error: productsError } = await supabase
          .from('appointment_products')
          .insert(productInserts)
        
        if (productsError) {
          console.error('Products insertion error:', productsError)
          // Don't fail the whole booking if products fail
          console.warn('Failed to add products to appointment, but appointment was created successfully')
        }
      }
      
      // Success! Redirect to confirmation
      router.push('/confirmation')
    } catch (err) {
      console.error('Unexpected error during submission:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  // Group services by category with proper typing
  const servicesByCategory = services.reduce((acc, service) => {
    const category = service.category?.name || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Book Your Appointment</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
        <input
          {...register('customerName', { required: 'Name is required' })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          placeholder="Enter your name"
        />
        {errors.customerName && <span className="text-red-500 text-sm">{errors.customerName.message}</span>}
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">Email</label>
        <input
          type="email"
          {...register('customerEmail', { 
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        {errors.customerEmail && <span className="text-red-500 text-sm">{errors.customerEmail.message}</span>}
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">Phone</label>
        <input
          {...register('customerPhone', { required: 'Phone is required' })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        {errors.customerPhone && <span className="text-red-500 text-sm">{errors.customerPhone.message}</span>}
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">Service</label>
        <select
          {...register('serviceId', { required: 'Please select a service' })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          disabled={services.length === 0}
        >
          <option value="">Select a service</option>
          {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
            <optgroup key={category} label={category}>
              {categoryServices.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} - ${service.price} ({service.duration} min)
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {errors.serviceId && <span className="text-red-500 text-sm">{errors.serviceId.message}</span>}
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">Date</label>
        <input
          type="date"
          {...register('appointmentDate', { required: 'Date is required' })}
          min={format(new Date(), 'yyyy-MM-dd')}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        {errors.appointmentDate && <span className="text-red-500 text-sm">{errors.appointmentDate.message}</span>}
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">Time</label>
        <select
          {...register('appointmentTime', { required: 'Please select a time' })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          disabled={!selectedDate || availableSlots.length === 0}
        >
          <option value="">Select a time</option>
          {availableSlots.map(slot => (
            <option key={slot} value={slot}>{slot}</option>
          ))}
        </select>
        {errors.appointmentTime && <span className="text-red-500 text-sm">{errors.appointmentTime.message}</span>}
        {selectedDate && availableSlots.length === 0 && (
          <p className="text-yellow-600 text-sm mt-1">No available time slots for this date</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">Add Products (Optional)</label>
        {productCategories.map(category => (
          <div key={category.id} className="mb-3">
            <h4 className="font-medium text-gray-600 mb-2">{category.name}</h4>
            <div className="space-y-1 pl-4">
              {products
                .filter(p => p.category_id === category.id)
                .map(product => (
                  <label key={product.id} className="flex items-center">
                    <input
                      type="checkbox"
                      value={product.id}
                      {...register('products')}
                      className="mr-2"
                    />
                    <span>{product.name} - ${product.price}</span>
                  </label>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 font-semibold mb-2">Notes (Optional)</label>
        <textarea
          {...register('notes')}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={loading || services.length === 0 || timeSlots.length === 0}
        className="w-full bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition disabled:opacity-50"
      >
        {loading ? 'Booking...' : 'Book Appointment'}
      </button>

      {services.length === 0 && (
        <p className="text-center text-gray-600 mt-4">
          No services available. Please try refreshing the page.
        </p>
      )}
    </form>
  )
}