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
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [totalPrice, setTotalPrice] = useState(0)
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    defaultValues: {
      customerName: user?.user_metadata?.full_name || '',
      customerEmail: user?.email || '',
      customerPhone: user?.user_metadata?.phone || '',
      products: []
    }
  })

  const selectedServiceId = watch('serviceId')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      checkAvailability(selectedDate)
    }
  }, [selectedDate])

  useEffect(() => {
    calculateTotal()
  }, [selectedServiceId, selectedProducts])

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

  const calculateTotal = () => {
    const selectedService = services.find(s => s.id === selectedServiceId)
    const servicePrice = selectedService?.price || 0
    
    const productsPrice = Array.from(selectedProducts).reduce((sum, productId) => {
      const product = products.find(p => p.id === productId)
      return sum + (product?.price || 0)
    }, 0)
    
    setTotalPrice(servicePrice + productsPrice)
  }

  const handleProductToggle = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
    setValue('products', Array.from(newSelected))
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
          status: 'pending'
        })
        .select()
        .single()
      
      if (appointmentError) {
        console.error('Appointment creation error:', appointmentError)
        setError(`Failed to create appointment: ${appointmentError.message}`)
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
        }
      }
      
      router.push('/confirmation')
    } catch (err) {
      console.error('Unexpected error during submission:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    const category = service.category?.name || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    const categoryId = product.category_id
    if (!acc[categoryId]) acc[categoryId] = []
    acc[categoryId].push(product)
    return acc
  }, {} as Record<string, Product[]>)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 md:p-6 rounded-t-xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center">Book Your Appointment</h2>
        <p className="text-center mt-1 text-pink-100 text-sm">Fill in the details below to schedule your visit</p>
      </div>

      <div className="p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
            <p className="text-red-700 flex items-center">
              <span className="mr-2">⚠️</span>
              {error}
            </p>
          </div>
        )}

        {/* Customer Information Section */}
        <div className="mb-8">
          
          <h3 className="text-lg md:text-xl font-semibold mb-3 text-gray-800">Customer Information</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register('customerName', { required: 'Name is required' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                placeholder="Enter your full name"
              />
              {errors.customerName && (
                <span className="text-red-500 text-sm mt-1 block">{errors.customerName.message}</span>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register('customerEmail', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                placeholder="your@email.com"
              />
              {errors.customerEmail && (
                <span className="text-red-500 text-sm mt-1 block">{errors.customerEmail.message}</span>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                {...register('customerPhone', { required: 'Phone is required' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                placeholder="(123) 456-7890"
              />
              {errors.customerPhone && (
                <span className="text-red-500 text-sm mt-1 block">{errors.customerPhone.message}</span>
              )}
            </div>
          </div>
        </div>

        {/* Service Selection Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Select Service</h3>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Choose your service <span className="text-red-500">*</span>
            </label>
            <select
              {...register('serviceId', { required: 'Please select a service' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              disabled={services.length === 0}
            >
              <option value="">-- Select a service --</option>
              {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                <optgroup key={category} label={category}>
                  {categoryServices.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} • ${service.price} • {service.duration} minutes
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {errors.serviceId && (
              <span className="text-red-500 text-sm mt-1 block">{errors.serviceId.message}</span>
            )}
          </div>
        </div>

        {/* Date & Time Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Date & Time</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Appointment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('appointmentDate', { required: 'Date is required' })}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
              {errors.appointmentDate && (
                <span className="text-red-500 text-sm mt-1 block">{errors.appointmentDate.message}</span>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Preferred Time <span className="text-red-500">*</span>
              </label>
              <select
                {...register('appointmentTime', { required: 'Please select a time' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                disabled={!selectedDate || availableSlots.length === 0}
              >
                <option value="">-- Select a time --</option>
                {availableSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
              {errors.appointmentTime && (
                <span className="text-red-500 text-sm mt-1 block">{errors.appointmentTime.message}</span>
              )}
              {selectedDate && availableSlots.length === 0 && (
                <p className="text-yellow-600 text-sm mt-1">No available time slots for this date</p>
              )}
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Add Products (Optional)</h3>
          <div className="space-y-6">
            {productCategories.map(category => {
              const categoryProducts = productsByCategory[category.id] || []
              if (categoryProducts.length === 0) return null
              
              return (
                <div key={category.id} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-3">{category.name}</h4>
                  <div className="space-y-3">
                    {categoryProducts.map(product => (
                      <label key={product.id} className="flex items-center p-3 bg-white rounded-lg hover:bg-pink-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={() => handleProductToggle(product.id)}
                          className="mr-3 w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-gray-800">{product.name}</span>
                          <span className="ml-2 text-pink-600 font-semibold">${product.price}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Notes Section */}
        <div className="mb-8">
          <label className="block text-gray-700 font-medium mb-2">
            Special Notes or Requests (Optional)
          </label>
          <textarea
            {...register('notes')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            rows={3}
            placeholder="Any special requests or information we should know?"
          />
        </div>

        {/* Total Price Display */}
        {totalPrice > 0 && (
          <div className="mb-6 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
            <div className="flex justify-between items-center">
              <span className="text-base font-medium text-gray-700">Total:</span>
              <span className="text-xl font-bold text-pink-600">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || services.length === 0 || timeSlots.length === 0}
          className="w-full bg-pink-600 text-white py-4 rounded-lg font-semibold hover:bg-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Booking Your Appointment...
            </span>
          ) : (
            'Book Appointment'
          )}
        </button>

        {services.length === 0 && (
          <p className="text-center text-gray-600 mt-4">
            No services available. Please try refreshing the page.
          </p>
        )}
      </div>
    </form>
  )
}