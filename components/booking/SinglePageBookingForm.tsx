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
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #ec4899',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }}></div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '8px'
          }}>Loading Booking Form</h2>
          <p style={{ color: '#6b7280' }}>
            Please wait while we prepare your booking experience...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '48px 0'
    }}>
      <div style={{
        maxWidth: '1024px',
        margin: '0 auto',
        padding: '0 16px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '16px'
          }}>
            Book Your Appointment
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#6b7280' }}>
            Experience luxury beauty treatments in our relaxing environment
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            {/* Error Message */}
            {error && (
              <div style={{
                padding: '16px',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                borderBottom: '1px solid #fecaca'
              }}>
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

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
