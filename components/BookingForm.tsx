'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

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
  const [services, setServices] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [productCategories, setProductCategories] = useState<any[]>([])
  const [timeSlots, setTimeSlots] = useState<any[]>([])
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
    // Load services with categories
    const { data: servicesData } = await supabase
      .from('services')
      .select(`
        *,
        category:service_categories(name)
      `)
      .eq('is_active', true)
      .order('category_id')

    // Load products with categories
    const { data: productsData } = await supabase
      .from('products')
      .select(`
        *,
        category:product_categories(name)
      `)
      .eq('is_active', true)
      .order('category_id')

    // Load product categories
    const { data: categoriesData } = await supabase
      .from('product_categories')
      .select('*')
      .order('display_order')

    // Load time slots
    const { data: slotsData } = await supabase
      .from('time_slots')
      .select('*')
      .eq('is_active', true)
      .order('time')

    setServices(servicesData || [])
    setProducts(productsData || [])
    setProductCategories(categoriesData || [])
    setTimeSlots(slotsData || [])
  }

  const checkAvailability = async (date: string) => {
    const { data } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('appointment_date', date)
      .eq('status', 'confirmed')
    
    const bookedSlots = data?.map(apt => apt.appointment_time) || []
    const available = timeSlots
      .filter(slot => !bookedSlots.includes(slot.time))
      .map(slot => slot.time)
    setAvailableSlots(available)
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    
    // Create appointment
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert([{
        user_id: user?.id || null,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone,
        service_id: data.serviceId,
        appointment_date: data.appointmentDate,
        appointment_time: data.appointmentTime,
        notes: data.notes
      }])
      .select()
      .single()
    
    if (error) {
      alert('Booking failed. Please try again.')
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
      
      await supabase
        .from('appointment_products')
        .insert(productInserts)
    }
    
    router.push('/confirmation')
  }

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    const category = service.category?.name || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push(service)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Book Your Appointment</h2>
      
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
        >
          <option value="">Select a service</option>
          {Object.entries(servicesByCategory).map(([category, services]) => (
            <optgroup key={category} label={category}>
              {services.map(service => (
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
          disabled={!selectedDate}
        >
          <option value="">Select a time</option>
          {availableSlots.map(slot => (
            <option key={slot} value={slot}>{slot}</option>
          ))}
        </select>
        {errors.appointmentTime && <span className="text-red-500 text-sm">{errors.appointmentTime.message}</span>}
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
        disabled={loading}
        className="w-full bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition disabled:opacity-50"
      >
        {loading ? 'Booking...' : 'Book Appointment'}
      </button>
    </form>
  )
}
