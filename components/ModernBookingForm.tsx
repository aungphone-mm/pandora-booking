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

export default function ModernBookingForm({ user }: { user: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [currentStep, setCurrentStep] = useState(1)
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
  const totalSteps = 4

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

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
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

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
              step <= currentStep 
                ? 'bg-pink-500 text-white shadow-lg' 
                : 'bg-gray-200 text-gray-400'
            }`}>
              {step}
            </div>
            {step < 4 && (
              <div className={`flex-1 h-1 mx-4 transition-all duration-300 ${
                step < currentStep ? 'bg-pink-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="text-center">
        <span className="text-sm font-medium text-gray-600">
          Step {currentStep} of {totalSteps}: {
            currentStep === 1 ? 'Personal Information' :
            currentStep === 2 ? 'Choose Service' :
            currentStep === 3 ? 'Date & Time' : 'Add-ons & Review'
          }
        </span>
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Tell us about yourself</h3>
        <p className="text-gray-600">We'll use this information for your appointment</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-gray-700 font-semibold mb-3 text-lg">
            Full Name <span className="text-pink-500">*</span>
          </label>
          <input
            {...register('customerName', { required: 'Name is required' })}
            className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition-all duration-300 text-lg"
            placeholder="Enter your full name"
          />
          {errors.customerName && (
            <span className="text-pink-500 text-sm mt-2 block">
              {errors.customerName.message}
            </span>
          )}
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-3 text-lg">
            Email Address <span className="text-pink-500">*</span>
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
            className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition-all duration-300 text-lg"
            placeholder="your@email.com"
          />
          {errors.customerEmail && (
            <span className="text-pink-500 text-sm mt-2 block">
              {errors.customerEmail.message}
            </span>
          )}
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-3 text-lg">
            Phone Number <span className="text-pink-500">*</span>
          </label>
          <input
            {...register('customerPhone', { required: 'Phone is required' })}
            className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition-all duration-300 text-lg"
            placeholder="(123) 456-7890"
          />
          {errors.customerPhone && (
            <span className="text-pink-500 text-sm mt-2 block">
              {errors.customerPhone.message}
            </span>
          )}
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Service</h3>
        <p className="text-gray-600">Select the service you'd like to book</p>
      </div>

      <div className="space-y-6">
        {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
          <div key={category} className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-2xl">
            <h4 className="font-bold text-xl text-gray-800 mb-4">
              {category}
            </h4>
            <div className="grid gap-4">
              {categoryServices.map(service => (
                <label key={service.id} className={`cursor-pointer group`}>
                  <input
                    type="radio"
                    {...register('serviceId', { required: 'Please select a service' })}
                    value={service.id}
                    className="sr-only"
                  />
                  <div className={`p-6 border-2 rounded-2xl transition-all duration-300 group-hover:shadow-lg ${
                    selectedServiceId === service.id 
                      ? 'border-pink-500 bg-pink-50 shadow-lg transform scale-[1.02]' 
                      : 'border-gray-200 bg-white hover:border-pink-300'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="font-semibold text-lg text-gray-800">{service.name}</h5>
                        <p className="text-gray-600">{service.duration} minutes</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-pink-600">${service.price}</span>
                        {selectedServiceId === service.id && (
                          <div className="text-pink-500 mt-1">
                            <span className="text-sm">Selected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
        {errors.serviceId && (
          <span className="text-pink-500 text-sm text-center block">
            {errors.serviceId.message}
          </span>
        )}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Pick Date & Time</h3>
        <p className="text-gray-600">When would you like to visit us?</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="block text-gray-700 font-semibold mb-3 text-lg">
            Appointment Date <span className="text-pink-500">*</span>
          </label>
          <input
            type="date"
            {...register('appointmentDate', { required: 'Date is required' })}
            min={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition-all duration-300 text-lg"
          />
          {errors.appointmentDate && (
            <span className="text-pink-500 text-sm mt-2 block">
              {errors.appointmentDate.message}
            </span>
          )}
        </div>

        <div className="space-y-4">
          <label className="block text-gray-700 font-semibold mb-3 text-lg">
            Preferred Time <span className="text-pink-500">*</span>
          </label>
          <select
            {...register('appointmentTime', { required: 'Please select a time' })}
            className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition-all duration-300 text-lg"
            disabled={!selectedDate || availableSlots.length === 0}
          >
            <option value="">-- Select a time --</option>
            {availableSlots.map(slot => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
          {errors.appointmentTime && (
            <span className="text-pink-500 text-sm mt-2 block">
              {errors.appointmentTime.message}
            </span>
          )}
          {selectedDate && availableSlots.length === 0 && (
            <p className="text-yellow-600 text-sm mt-2">
              No available time slots for this date
            </p>
          )}
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Add Products & Review</h3>
        <p className="text-gray-600">Enhance your experience with our premium products</p>
      </div>

      {/* Products Section */}
      <div className="space-y-6">
        <h4 className="text-xl font-semibold text-gray-800">Add Products (Optional)</h4>
        {productCategories.map(category => {
          const categoryProducts = productsByCategory[category.id] || []
          if (categoryProducts.length === 0) return null
          
          return (
            <div key={category.id} className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl">
              <h5 className="font-semibold text-lg text-gray-700 mb-4">
                {category.name}
              </h5>
              <div className="grid gap-3">
                {categoryProducts.map(product => (
                  <label key={product.id} className="cursor-pointer group">
                    <div className={`p-4 border-2 rounded-xl transition-all duration-300 ${
                      selectedProducts.has(product.id) 
                        ? 'border-purple-500 bg-purple-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                    }`}>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={() => handleProductToggle(product.id)}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 mr-4"
                        />
                        <div className="flex-1 flex justify-between items-center">
                          <span className="font-medium text-gray-800">{product.name}</span>
                          <span className="text-purple-600 font-semibold">${product.price}</span>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Notes Section */}
      <div className="space-y-4">
        <label className="block text-gray-700 font-semibold text-lg">
          Special Notes or Requests
        </label>
        <textarea
          {...register('notes')}
          className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition-all duration-300 text-lg"
          rows={4}
          placeholder="Any special requests or information we should know?"
        />
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-8 rounded-2xl shadow-xl">
        <h4 className="text-xl font-bold mb-4">Booking Summary</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Service:</span>
            <span className="font-semibold">
              {services.find(s => s.id === selectedServiceId)?.name || 'Not selected'}
            </span>
          </div>
          {selectedProducts.size > 0 && (
            <div>
              <span>Add-ons:</span>
              <div className="ml-4 mt-1">
                {Array.from(selectedProducts).map(productId => {
                  const product = products.find(p => p.id === productId)
                  return (
                    <div key={productId} className="flex justify-between text-sm">
                      <span>{product?.name}</span>
                      <span>${product?.price}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div className="border-t border-pink-300 pt-3 mt-4">
            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Book Your Appointment
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience luxury beauty treatments in our relaxing environment
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            {renderProgressBar()}

            {error && (
              <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-2xl animate-fadeIn">
                <p className="text-red-700 text-lg font-medium">
                  Error: {error}
                </p>
              </div>
            )}

            {/* Step Content */}
            <div className="min-h-[500px]">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-12">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-8 py-4 bg-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Booking Your Appointment...' : 'Complete Booking'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}