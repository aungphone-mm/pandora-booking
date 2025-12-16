/**
 * Single Page Booking Form - Refactored Version
 * Main booking form component that orchestrates all sub-components
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { BookingFormData } from './types'
import { useBookingData } from './useBookingData'
import ServiceSelector from './ServiceSelector'
import ProductSelector from './ProductSelector'
import DateTimeSelector from './DateTimeSelector'
import CustomerInfoForm from './CustomerInfoForm'
import BookingSummary from './BookingSummary'

interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    phone?: string
  }
}

interface SinglePageBookingFormProps {
  user: User | null
}

export default function SinglePageBookingForm({ user }: SinglePageBookingFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [totalPrice, setTotalPrice] = useState(0)

  const {
    loading: dataLoading,
    services,
    staff,
    products,
    productCategories,
    availableSlots,
    checkAvailability
  } = useBookingData()

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<BookingFormData>({
    defaultValues: {
      customerName: user?.user_metadata?.full_name || '',
      customerEmail: user?.email || '',
      customerPhone: user?.user_metadata?.phone || '',
      serviceIds: [],
      products: []
    }
  })

  const selectedTime = watch('appointmentTime')

  // Check availability when date changes
  useEffect(() => {
    if (selectedDate) {
      checkAvailability(selectedDate)
    }
  }, [selectedDate])

  // Calculate total price
  useEffect(() => {
    calculateTotal()
  }, [selectedServices, selectedProducts])

  const calculateTotal = () => {
    // Calculate total price from all selected services
    const servicesPrice = Array.from(selectedServices).reduce((sum, serviceId) => {
      const service = services.find(s => s?.id === serviceId)
      return sum + (service?.price || 0)
    }, 0)

    const productsPrice = Array.from(selectedProducts).reduce((sum, productId) => {
      const product = products.find(p => p?.id === productId)
      return sum + (product?.price || 0)
    }, 0)

    setTotalPrice(servicesPrice + productsPrice)
  }

  const handleServiceToggle = (serviceId: string) => {
    const newSelected = new Set(selectedServices)
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId)
    } else {
      newSelected.add(serviceId)
    }
    setSelectedServices(newSelected)
    setValue('serviceIds', Array.from(newSelected))
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

  const onSubmit = async (data: BookingFormData) => {
    try {
      setLoading(true)
      setError(null)

      // Validate that at least one service is selected
      if (!data.serviceIds || data.serviceIds.length === 0) {
        setError('Please select at least one service')
        setLoading(false)
        return
      }

      // Create appointment
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          customer_name: data.customerName,
          customer_email: data.customerEmail || null,
          customer_phone: data.customerPhone,
          service_id: null, // No longer using single service_id
          staff_id: null, // Staff selection removed
          appointment_date: data.appointmentDate,
          appointment_time: data.appointmentTime,
          notes: data.notes || null,
          status: 'pending',
          total_price: totalPrice,
          user_id: user?.id || null
        })
        .select()
        .single()

      if (appointmentError) throw appointmentError

      // Insert service associations (NEW: multiple services)
      if (data.serviceIds && data.serviceIds.length > 0 && appointment) {
        const serviceInserts = data.serviceIds.map(serviceId => {
          const service = services.find(s => s.id === serviceId)
          return {
            appointment_id: appointment.id,
            service_id: serviceId,
            quantity: 1,
            price: service?.price || 0
          }
        })

        const { error: servicesError } = await supabase
          .from('appointment_services')
          .insert(serviceInserts)

        if (servicesError) throw servicesError
      }

      // Insert product associations
      if (data.products && data.products.length > 0 && appointment) {
        const productInserts = data.products.map(productId => ({
          appointment_id: appointment.id,
          product_id: productId,
          quantity: 1
        }))

        const { error: productsError } = await supabase
          .from('appointment_products')
          .insert(productInserts)

        if (productsError) throw productsError
      }

      // Store booking details in sessionStorage for the confirmation page
      if (appointment) {
        sessionStorage.setItem('lastBooking', JSON.stringify({
          id: appointment.id,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          appointmentDate: data.appointmentDate,
          appointmentTime: data.appointmentTime,
          totalPrice: totalPrice,
          serviceIds: data.serviceIds, // Store array of service IDs
          productIds: data.products || [] // Store array of product IDs
        }))
      }

      // Redirect to confirmation page for both guests and logged-in users
      router.push('/confirmation')
    } catch (err: any) {
      console.error('Error creating booking:', err)
      setError(err.message || 'Failed to create booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Get all selected services for display
  const selectedServicesData = services.filter(s => selectedServices.has(s?.id))

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-12">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading Booking Form</h2>
          <p className="text-gray-500">
            Please wait while we prepare your booking experience...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Book Your Appointment
          </h1>
          <p className="text-xl text-gray-500">
            Experience luxury beauty treatments in our relaxing environment
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-100 text-red-800 border-b border-red-200">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Service Selection */}
            <ServiceSelector
              services={services}
              selectedServiceIds={Array.from(selectedServices)}
              errors={errors}
              register={register}
              onServiceToggle={handleServiceToggle}
            />

            {/* Product Selection */}
            <ProductSelector
              products={products}
              productCategories={productCategories}
              selectedProducts={selectedProducts}
              onProductToggle={handleProductToggle}
            />

            {/* Date & Time Selection */}
            <DateTimeSelector
              selectedDate={selectedDate}
              availableSlots={availableSlots}
              selectedTime={selectedTime}
              onDateChange={(date) => {
                setSelectedDate(date)
                setValue('appointmentDate', date)
              }}
              errors={errors}
              register={register}
            />

            {/* Customer Information */}
            <CustomerInfoForm
              isLoggedIn={!!user}
              errors={errors}
              register={register}
            />

            {/* Booking Summary */}
            <BookingSummary
              selectedServices={selectedServicesData}
              selectedProducts={selectedProducts}
              products={products}
              totalPrice={totalPrice}
              loading={loading}
            />
          </div>
        </form>
      </div>
    </div>
  )
}
